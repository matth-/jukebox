#!/usr/bin/env ruby

require 'http.rb'
require 'channel.rb'

class Stream < HttpRest
  module StreamSession
    def on_close()
      ch = @data;
      ch.unregister(self);
      super();
    end

    def switch_channel(ch)
      oldch = @data;
      oldch.unregister(self);
      ch.register(self);
      @data = ch;
    end

    def write(data, low = false)
      if(@icyRemaining == 0 || low)
        super(data);
        return;
      end
      while(data.bytesize() != 0)
        if(@icyRemaining > data.bytesize())
          super(data);
          @icyRemaining -= data.bytesize();
          data     = "";
        else
          super(data[0..@icyRemaining-1]);
          data     = data[@icyRemaining..-1];
          generateIcyMetaData();
          @icyRemaining = @icyInterval;
        end
      end

      super(data)
    end

    def stream_init(icy_meta, ch, proto)
      @icyInterval  = icy_meta == "1" && 4096 || 0;
      @icyRemaining = @icyInterval;
      @data         = ch;
      metaint       = @icyInterval;
      rep = HttpResponse.new(proto, 200, "OK",
                             "Connection"   => "Close",
                             "Server"       => "Jukebox Streaming",
                             "Content-Type" => "audio/mpeg");
      rep.options["icy-metaint"] = @icyInterval if(@icyInterval != 0);

      write(rep.to_s, true);
      ch.register(self);
    end

    private
    def generateIcyMetaData()
      str  = "";
      ch   = @data;
      meta = ch.meta();

      if(meta && @meta != meta)
        str = "StreamTitle='#{meta.to_s().gsub("\'", " ")}';"
        @meta = meta;
      end
    
      padding = str.bytesize() % 16;
      padding = 16 - padding  if(padding != 0)
      str += "\x00" * padding;
      write((str.bytesize()/16).chr, true);
      write(str, true);
    end
  end

  def initialize(list, library, user)
    @list     = list;
    @library  = library;
    @user     = user;
    super();
  end

  def update(s, req)
    data  = @user[s.user];
    ch    = @list[data[:channel]];
    param = JSON.parse(req.data || "");
    owner = (data[:channel] == s.user);


    case(req.remaining)
    when "next"
      ch.next() if(owner);
    when "previous"
      ch.previous() if(owner);
    when "switch_channel"
      ch = @list[param["channel"]];
      data[:channel] = param["channel"];
      data[:stream].each { |s|
        s.switch_channel(ch);
      }
    end

    rep  = HttpResponse.new(req.proto, 200, "OK",
                            "Content-Type" => "application/json");

    json = {}
    json[:stream] = ch.queue.to_client(@library);
    str = JSON.generate(json);
    debug(str);
    rep.setData(str);

    rep;
  end

  def view(s, req)
    action      = req.remaining;
    channelName = s.user;

    @user[s.user] ||= {
      :channel => s.user,
      :stream  => []
    };
    data = @user[s.user];

    ch = @list[data[:channel]];
  
    if(ch == nil)
      ch = Channel.new(channelName, @library);
      @list[channelName] = ch;
    end

    return HttpResponse.generate301(req, req.prefix) if(action != nil);

    data[:stream].push(s);

    s.extend(StreamSession);
    s.stream_init(req.options["Icy-MetaData"], ch, req.proto);
  end
end
