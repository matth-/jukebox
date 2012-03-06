#!/usr/bin/env ruby

require 'json'
require 'rev'
require 'http.rb'
require 'display.rb'

class JsonManager < HttpNode
  MSG_LVL_DEBUG   = 1
  MSG_LVL_INFO    = 2
  MSG_LVL_WARNING = 3
  MSG_LVL_ERROR   = 4
  MSG_LVL_FATAL   = 5

  def initialize(list, library)
    @list     = list;
    @library  = library;

    super();
  end

  def on_request(s, req)
    ch  = @list[s.user];
    rep = HttpResponse.new(req.proto, 200, "OK",
                           "Content-Type" => "application/json");
    res = "";
    if(ch == nil)
      res = create_message(JsonManager::MSG_LVL_WARNING,
                                "Unknown channel #{s.user}");
    else
      if( nil != req and nil != req.data)
        argv = req.data.split("&").map() { |v|
          v.split("=").map() { |v|
            CGI.unescape(v);
          }
        }
        argv = Hash[argv];
        res = parse(argv["query"], ch);
      else
        res = create_message(JsonManager::MSG_LVL_ERROR,
                             "HttpRequest not well formed");
        
      end
    end
    rep.setData(res);
    s.write(rep.to_s);
  end

  private
  def create_message(lvl, code = nil, msg)
    resp = {};
    msg = {
      :level   => lvl,
      :message => msg
    };
    msg[:code] = code if(code);

    resp[:messages] = [ msg ];

    str = JSON.generate(resp);
    debug(str);
    str;
  end

  def parse(req, ch)
    resp = { :timestamp => Time.now.to_i() };
    if(req == nil)
        add_message(resp, MSG_LVL_ERROR, "JSON request not found", "Json request not found");      
    else
      begin
        json      = JSON.parse(req);
        timestamp = json.delete("timestamp") || 0;
        json.each { |type, value|
          case(type)
          when "search"
            parse_search(resp, value);
          when "action"
            parse_action(resp, ch, value);
          else
            add_message(resp, MSG_LVL_ERROR, "unknown command #{type}", "Unknown command #{type}");
          end
        }
        # refresh
        add_channel_infos(resp, ch);
        add_current_song(resp, ch);
        if(timestamp <= ch.timestamp)
          add_play_queue(resp, ch);
        end
      rescue JSON::ParserError => e
        add_message(resp, MSG_LVL_ERROR, "fail to parse request", "Exception when parsing json request, #{e}");
        error("Exception when parsing json request, #{e}");
      end
    end

    str = JSON.generate(resp);
    debug(str);
    str;
  end
  
  def add_message(resp, lvl, code, msg)
    msg = {
      :level   => lvl,
      :message => msg
    };
    msg[:code] = code if(code);

    resp[:messages] ||= [];
    resp[:messages].push(msg);
  end

  def add_channel_infos(resp, ch)
    resp[:channel_infos] = {
      :listener_count => ch.getConnected()
    };
  end

  def add_current_song(resp, ch)
    song    = ch.meta;
    elapsed = ch.song_pos();
    resp[:current_song] = {
      :mid          => song.mid,
      :title        => song.title,
      :artist       => song.artist,
      :album        => song.album,
      :total_time   => song.duration,
      :elapsed_time => elapsed
    };
  end

  def add_play_queue(resp, ch)
    queue = ch.mids[1..-1];
    if(queue.size() != 0)
      queue = @library.get_file(*queue).reject(&:nil?).map { |song|
        {
          :mid       => song.mid,
          :artist    => song.artist,
          :title     => song.title,
          :album     => song.album,
          :duration  => song.duration
        }
      }
    end

    if(queue)
      resp[:play_queue] = {
        :songs => queue
      }
    end
  end

  def forward_action(req, ch)
      resp = { :timestamp => Time.now.to_i() };
      case(req["name"])
      when "next"
        ch.next();
      when "previous"
        ch.previous();
      when "add_to_play_queue"
        ch.add_song(req["play_queue_index"], req["mid"])
      when "add_search_to_play_queue" 
        result = @library.secure_request("mid",
                                         CGI::unescape(req["search_value"]),
                                         req["search_comparison"],
                                         req["search_field"],
                                         req["order_by"],
                                         req["order_by_way"],
                                         req["first_result"],
                                         req["result_count"]);
        if( "head" == req["play_queue_position"] )
          i = 0;
        else
          i= nil;
        end

        result.each do |song|
          if( i != nil )
            ch.add_song(i, song.mid);
            i = i + 1;
          else
            ch.add_song_tail(song.mid);
          end
        end

      when "remove_from_play_queue"
        ch.del_song(req["play_queue_index"]);
      when "move_in_play_queue"
        ch.move_song(req["play_queue_index"], req["new_play_queue_index"]);
      when "select_plugin"
        ch.set_plugin(req["plugin_name"]);
      else
        error("Unknown action #{req["name"]}", true, $error_file);
        add_message(resp, MSG_LVL_ERROR, nil, "unknown action #{req["name"]}");
      end
  end

  def parse_action(resp, ch, req)
    if( req.kind_of?(Array) )
      req.each { |currentAction| 
        forward_action(currentAction,ch);
      }
    else
      forward_action(req,ch);
    end
  end

  def parse_search(resp, req)
    result = @library.secure_request(req["select_fields"],
                                     CGI::unescapeHTML(req["search_value"]),
                                     req["search_comparison"],
                                     req["search_field"],
                                     req["order_by"],
                                     req["order_by_way"],
                                     req["first_result"],
                                     req["result_count"]);

    songs = result.map { |song|
      { 
        :mid      => song.mid,
        :artist   => song.artist,
        :title    => song.title,
        :album    => song.album,
        :duration => song.duration
      }
    }
    resp [:search_results] = {
      :identifier     => req["identifier"],
      :select         => req["select"],
      :select_fields  => req["select_fields"],
      :search_value	  => CGI::unescapeHTML(req["search_value"]),
      :search_comparison  => req["search_comparison"],
      :search_field   => req["search_field"],
      :result_count   => req["result_count"],
      :order_by       => req["order_by"],
      :order_by_way   => req["order_by_way"],
      :first_result   => req["first_result"],
      :total_results  => @library.get_total(req["search_field"],
                                       req["search_comparison"],
                                           req["search_value"]),
      :results        => songs
    };
  end
end

