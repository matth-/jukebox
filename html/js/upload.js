
var uploadTab = Class.create(Tab, {
    initialize : function( identifier, tabName ){
        // Search parameters 
        this.identifier = identifier;
        this.name = tabName;
        this.uploader = null;
        this.unique="UploadTab";
        this.uploadedFiles = null;
        this.uploadedFilesEdition = null;
        this.lastSendingDeletionIdentifier = null;
        this.lastSendingUpdateIdentifier = null;
        this.lastSendingValidationIdentifier = null;
        this.refresher = null;
        this.tableId = new Date().getTime();
    },


    /* actions */
    deleteUploadedSong : function(file_name) {
        if( this.lastSendingDeletionIdentifier == null) {
            this.lastSendingDeletionIdentifier = unescape(file_name);
            query = new Object();
            query.action = new Object();
            query.action.name = "delete_uploaded_file";
            query.action.file_name = unescape(file_name);
            updateJukebox();
        } 
    },

    getUploadedFileEditionFromFilename: function(file_name){
        if(null == tabs.getFirstTabByClassName("UploadTab").uploadedFilesEdition ) {
            return null
        }
        for( var i=0; i<tabs.getFirstTabByClassName("UploadTab").uploadedFilesEdition.length; ++i){
            if( tabs.getFirstTabByClassName("UploadTab").uploadedFilesEdition[i].filename == file_name ){
                return tabs.getFirstTabByClassName("UploadTab").uploadedFilesEdition[i];
            }
        }
        return null;
    },

    updateUploadedSong : function(file_name){
        if( this.lastSendingUpdateIdentifier == null) {
            this.lastSendingUpdateIdentifier = unescape(file_name);
            var tmp = this.getUploadedFileEditionFromFilename(unescape(file_name));
            query = new Object();
            query.action = new Object();
            query.action.name = "update_uploaded_file";
            query.action.file_name = unescape(file_name);
            query.action.title = tmp.title;
            query.action.album = tmp.album;
            query.action.artist = tmp.artist;
            query.action.year = tmp.year;
            query.action.track = tmp.track;
            query.action.genre = tmp.genre;
            updateJukebox();
        } 
    },

    validateUploadedSong: function(file_name){
        if( this.lastSendingValidationIdentifier == null) {
            this.lastSendingValidationIdentifier = unescape(file_name);
            query = new Object();
            query.action = new Object();
            query.action.name = "validate_uploaded_file";
            query.action.file_name = unescape(file_name);
            updateJukebox();
        } 
    },


    /* Actions responses */
    deletionResponse : function(ret, message){
        if("success" == ret){
            if( null != this.lastSendingDeletionIdentifier ){

                /* Delete html part*/
                $('upload_line_' + escape(this.lastSendingDeletionIdentifier)).remove();
                showNotification(2, "song '" + this.lastSendingDeletionIdentifier + "'sucessfully deleted");

                /* delete unmodified reference entry*/
                var newUploaddedFilelist = new Array();
                var i = this.uploadedFiles.length - 1;
                while( i >= 0 ){
                    if( this.uploadedFiles[i].filename != this.lastSendingDeletionIdentifier ){
                        newUploaddedFilelist.push(this.uploadedFiles[i]);
                    }
                    i = i - 1;
                }
                this.uploadedFiles = newUploaddedFilelist;

                /* delete modifications file entry */
                var newUploaddedFilelist = new Array();
                var i = this.uploadedFilesEdition.length - 1;
                while( i >= 0 ){
                    if( this.uploadedFilesEdition[i].filename != this.lastSendingDeletionIdentifier ){
                        newUploaddedFilelist.push(this.uploadedFilesEdition[i]);
                    }
                    i = i - 1;
                }
                this.uploadedFilesEdition = newUploaddedFilelist;
                this.lastSendingDeletionIdentifier = null;
                if( 0 == $('uploaded_files').down('tbody').childElementCount ){
                    var html_uploaded_files = '';
                    html_uploaded_files += "No file uploaded yet."
                    $('uploaded_files').update(html_uploaded_files);
                    this.uploadedFilesEdition = null;
                    this.uploadedFiles = null;

                } else {
                    var temp = new Date().getTime() ;
                    $('uploaded_filelist_' + this.tableId).id = 'uploaded_filelist_' + temp; 
                    this.tableId = temp;

                    this.tableKit = new TableKit( 'uploaded_filelist_' + this.tableId, { });
                }
            }
        } else if( "error" == ret ) {
            this.lastSendingDeletionIdentifier = null;
            showNotification(4,message);
        }
    },

    updateResponse : function(ret, message){
        if("success" == ret){
            showNotification(1,message);

            /* delete all modified styles */
            $('upload_line_' + escape(this.lastSendingUpdateIdentifier)).select('[class="modified"]').each(function(e){
                    e.removeClassName("modified");
            });

            /* hide update */
            $('upload_line_' + escape(this.lastSendingUpdateIdentifier)).select('[name="update"]').each(function(e){
                    e.hide();
            });

            /* Show validate */
            $('upload_line_' + escape(this.lastSendingUpdateIdentifier)).select('[name="validate"]').each(function(e){
                    e.show();
            });
        } else if( "error" == ret ) {
            showNotification(4,message);
        }
        this.lastSendingUpdateIdentifier = null;
    },


    validationResponse : function(ret, message){
        if("success" == ret){
            showNotification(1,message);
            if( null != this.lastSendingValidationIdentifier ){
                /* Delete html part*/
                $('upload_line_' + escape(this.lastSendingValidationIdentifier)).remove();

                /* delete unmodified reference entry*/
                var newUploaddedFilelist = new Array();
                var i = this.uploadedFiles.length - 1;
                while( i >= 0 ){
                    if( this.uploadedFiles[i].filename != this.lastSendingValidationIdentifier ){
                        newUploaddedFilelist.push(this.uploadedFiles[i]);
                    }
                    i = i - 1;
                }
                this.uploadedFiles = newUploaddedFilelist;

                /* delete modifications file entry */
                var newUploaddedFilelist = new Array();
                var i = this.uploadedFilesEdition.length - 1;
                while( i >= 0 ){
                    if( this.uploadedFilesEdition[i].filename != this.lastSendingValidationIdentifier ){
                        newUploaddedFilelist.push(this.uploadedFilesEdition[i]);
                    }
                    i = i - 1;
                }
                this.uploadedFilesEdition = newUploaddedFilelist;
                this.lastSendingValidationIdentifier = null;

                if( $('uploaded_files').down('tbody').childElementCount  == 0 ){
                    var html_uploaded_files = '';
                    html_uploaded_files += "No file uploaded yet."
                    $('uploaded_files').update(html_uploaded_files);
                    this.uploadedFilesEdition = null;
                    this.uploadedFiles = null;
                } else {                
                    var temp = new Date().getTime();
                    $('uploaded_filelist_' + this.tableId).id = 'uploaded_filelist_' + temp; 
                    this.tableId = temp;
                    this.tableKit = new TableKit( 'uploaded_filelist_' + this.tableId, { });
                }
            }
        } else if( "error" == ret ) {
            this.lastSendingValidationIdentifier = null;
            showNotification(4,message);
        }

    },


    treatResponse : function( resp ){
        // Switch case show/deletion/update/alidation
        if( undefined != resp.action_response && null != resp.action_response) {
            if( "validate_uploaded_file" == resp.action_response.name) {
                this.validationResponse(resp.action_response["return"], resp.action_response["message"]);
            } else if( "delete_uploaded_file" == resp.action_response.name ) {
                this.deletionResponse(resp.action_response["return"], resp.action_response["message"]);
            } else if( "update_uploaded_file" == resp.action_response.name ) {
                this.updateResponse(resp.action_response["return"], resp.action_response["message"]);
            }
        }
        
        if( undefined != resp.files && null != resp.files) {
            this.displayUploadedFiles(resp.files);
        }
    },

    getUploadedFileHtml : function(obj){
        var html_uploaded_files = '';
        html_uploaded_files += "<tr id='upload_line_" + escape(obj.filename) + "'>";
        html_uploaded_files += "<td class='static'>";
        html_uploaded_files += obj.filename;
        html_uploaded_files += "</td>";
        html_uploaded_files += "<td>";
        if(obj.artist)
            html_uploaded_files += obj.artist;
        html_uploaded_files += "</td>";
        html_uploaded_files += "<td>";
        if(obj.album)
            html_uploaded_files += obj.album;
        html_uploaded_files += "</td>";
        html_uploaded_files += "<td>";
        if(obj.title)
            html_uploaded_files += obj.title;
        html_uploaded_files += "</td>";
        html_uploaded_files += "<td>";
        html_uploaded_files += obj.year;
        html_uploaded_files += "</td>";
        html_uploaded_files += "<td>";
        if( obj.track.toString().indexOf("/") != -1 )
            html_uploaded_files += obj.track.split("/")[0];
        else
            html_uploaded_files += obj.track;
        html_uploaded_files += "</td>";
        html_uploaded_files += "<td>";
        if( obj.track.toString().indexOf("/") != -1 )
            html_uploaded_files += obj.track.split("/")[1];
        else
            html_uploaded_files += 0;
        html_uploaded_files += "</td>";

        html_uploaded_files += "<td>";
        if( genres.length >= obj.genre ) {
            html_uploaded_files += genres[obj.genre];
        } else {
            html_uploaded_files += genres[genres.length - 1];
        }
        html_uploaded_files += "</td>";
        html_uploaded_files += "<td class='static actions'>";
        html_uploaded_files += "<div name='delete'><a href='javascript:void(0);'";
        html_uploaded_files += "onclick='tabs.getFirstTabByClassName(\"UploadTab\").deleteUploadedSong(\"" ;
        html_uploaded_files += escape(obj.filename) + "\");return false;'>X</a></div>";

        html_uploaded_files += "<div name='update' style='display:none;'><a href='javascript:void(0);'"
        html_uploaded_files += "onclick='tabs.getFirstTabByClassName(\"UploadTab\").updateUploadedSong(\"";
        html_uploaded_files += escape(obj.filename) + "\");return false;'>&nbsp;Update&nbsp;</a></div>";        

        html_uploaded_files += "<div name='validate'><a href='javascript:void(0);'"
        html_uploaded_files += "onclick='tabs.getFirstTabByClassName(\"UploadTab\").validateUploadedSong(\"";
        html_uploaded_files += escape(obj.filename) + "\");return false;'>&nbsp;Validate&nbsp;</a></div>";        
        html_uploaded_files += "</td>";
        html_uploaded_files += "</tr>";
        return html_uploaded_files;
    },

    displayUploadedFiles : function( uploaded_files ){
        var html_uploaded_files = '';
        
        clearTimeout(this.refresher);
        this.refresher = setTimeout("tabs.getFirstTabByClassName(\"UploadTab\").getUploadedFiles();", 5000);
        
        // We assume that this.uploadedFiles.length > uploaded_files.length
        // It means that the last state could'nt contain less entries than the new list entries
        // (deletions are not allowes in this code part)
        if( null == this.uploadedFiles || null == this.uploadedFilesEdition || 
            ( ($('uploaded_files').down('tbody') == null ||( $('uploaded_files').down('tbody').childElementCount == 0 ) 
               && uploaded_files.length >= 1 ))){
            /* TODO columns filters */
            if( uploaded_files.length > 0 ) {
                html_uploaded_files += '<table id="uploaded_filelist_' + this.tableId + '" class="sortable resizable editable">';
                html_uploaded_files += '<thead><tr>';
                html_uploaded_files += '<th id="filename">Filename</th>';
                html_uploaded_files += '<th id="artist">Artist</th>';
                html_uploaded_files += '<th id="album">Album</th>';
                html_uploaded_files += '<th id="title">Title</th>';
                html_uploaded_files += '<th id="year">Year</th>';
                html_uploaded_files += '<th id="track">Track</th>';
                html_uploaded_files += '<th id="trackNb">TrackNb</th>';
                html_uploaded_files += '<th id="genre">Genre</th>';
                html_uploaded_files += '<th id="actions">Actions</th>';
                html_uploaded_files += '</tr></thead>';
                html_uploaded_files += '<tfoot><tr>';
                html_uploaded_files += '<td id="filename">Filename</td>';
                html_uploaded_files += '<td id="artist">Artist</td>';
                html_uploaded_files += '<td id="album">Album</td>';
                html_uploaded_files += '<td id="title">Title</td>';
                html_uploaded_files += '<td id="year">Year</td>';
                html_uploaded_files += '<td id="track">Track</td>';
                html_uploaded_files += '<td id="trackNb">TrackNb</td>';
                html_uploaded_files += '<td id="genre">Genre</td>';
                html_uploaded_files += '<td id="actions">Actions</td>';
                html_uploaded_files += '</tr></tfoot>';
                
                html_uploaded_files += '<tbody>';
                for(var i=0 ; i< uploaded_files.length; ++i){
                    html_uploaded_files += this.getUploadedFileHtml(uploaded_files[i]);
                    $$( '.qq-upload-success').each( function(element){
                        if(element.down('.qq-upload-file').innerHTML == uploaded_files[i].filename){
                            element.remove();
                            showNotification(1,'Informations for : ' + uploaded_files[i].filename + 'successfuly retrieved.');
                        }
                    });

                }
                html_uploaded_files += '</tbody></table>';
                $('uploaded_files').update(html_uploaded_files);

                var obj = new musicFieldEditor("artist");
                TableKit.Editable.addCellEditor(obj);
                obj = new musicFieldEditor("album");
                TableKit.Editable.addCellEditor(obj);
                obj = new musicFieldEditor("title");
                TableKit.Editable.addCellEditor(obj);
                obj = new musicFieldEditor("year");
                TableKit.Editable.addCellEditor(obj);
                obj = new musicFieldEditor("track");
                TableKit.Editable.addCellEditor(obj);
                obj = new musicFieldEditor("trackNb");
                TableKit.Editable.addCellEditor(obj);
                obj = new musicFieldEditor("genre");
                TableKit.Editable.addCellEditor(obj);

                this.tableKit = new TableKit( 'uploaded_filelist_' + this.tableId, { });


            } else {
                var html_uploaded_files = '';
                html_uploaded_files += "No file uploaded yet."
                $('uploaded_files').update(html_uploaded_files);

            }
        } else if($('uploaded_files').down('tbody').childElementCount < uploaded_files.length){ // Just insert the new file
            // Find files to add
            newLines = new Array();
            found = false;
            for(var i=0; i < uploaded_files.length; ++i){
                for(var j=0; j < this.uploadedFiles.length; ++j){
                    if(uploaded_files[i].filename == this.uploadedFiles[j].filename){
                        found = true;
                        // TODO before breaking we have to get new defaults values for the line if changed (because of multi sessions)
                        break;
                    }
                } 
                if(!found){
                    newLines.push(uploaded_files[i]);
                }
                found = false;
            }

            // Add files to references
            for( var i=0; i<newLines.length; ++i){
                $('uploaded_filelist_' + this.tableId).down('tbody').insert( this.getUploadedFileHtml(newLines[i]) );
                this.uploadedFiles.push(JSON.parse(JSON.stringify(newLines[i])));
                this.uploadedFilesEdition.push(JSON.parse(JSON.stringify(newLines[i])));
                $$( '.qq-upload-success').each( function(element){
                    if(element.down('.qq-upload-file').innerHTML == newLines[i].filename){
                        element.remove();
                        showNotification(1,'Informations for : ' + uploaded_files[i].filename + 'successfuly retrieved.');
                    }
                });
            }
            
            if( this.uploadedFiles.length != 0 && newLines.length > 0) {
                var temp = new Date().getTime();
                $('uploaded_filelist_' + this.tableId).id = 'uploaded_filelist_' + temp; 
                this.tableId = temp;
                this.tableKit = new TableKit( 'uploaded_filelist_' + this.tableId, { });
            }
        }
        if(null == this.uploadedFiles|| this.uploadedFiles.length == 0 ){
            // trick used to clone
            this.uploadedFiles = JSON.parse(JSON.stringify(uploaded_files));
        }
        if( null == this.uploadedFilesEdition || this.uploadedFilesEdition.length == 0 ) {
            this.uploadedFilesEdition = JSON.parse(JSON.stringify(uploaded_files));
        }
    },

    getUploadedFiles: function(){
        query = new Object();
        query.action = new Object();
        query.action.name = "get_uploaded_files";
        updateJukebox();
    },

    clear: function(){
        clearTimeout(this.refresher);
        /* Don't know if it works */
        if(tabs.getFirstTabByClassName("UploadTab").uploader._handler._queue.length > 0)
            showNotification(1, "All current uploads canceled.");
        tabs.getFirstTabByClassName("UploadTab").uploader._handler.cancelAll();

        this.refresher = null;
    },

    updateContent : function( ){
        var upload_form = '';
        upload_form += '<div id="file-uploader' + this.identifier +'">';
        upload_form += '<div class="qq-uploader">';
        upload_form += '<div class="qq-upload-drop-area" style="display: none;">';
        upload_form += '<span>Drop files here to upload</span>';
        upload_form += '</div>';
        upload_form += '<div class="qq-upload-button" style="position: relative; overflow: hidden; direction: ltr;">';
        upload_form += 'Upload files';
        upload_form += '<input type="file" multiple="multiple" name="file"';
        upload_form += 'style="position:absolute; right:0pt; top:0pt; font-family:Arial; font-size:118px; margin:0pt; padding:0pt; cursor:pointer; opacity:0;">';
        upload_form += '</div>';
        upload_form += '<ul class="qq-upload-list">';
        upload_form += '</ul>';
        upload_form += '</div>';
        upload_form += '</div>';
        upload_form += '<h2>Uploaded files</h2>';
        upload_form += '<div id="uploaded_files" style="overflow:auto;">';
        upload_form += '</div>';
        
        $('tabContent_' + this.identifier).update(upload_form);

        // Init upload button behavior
        this.uploader = new qq.FileUploader({
            element: document.getElementById('file-uploader' + this.identifier),
            action: 'upload',
            params: {
                id: this.identifier
            },
            debug: true
        });

        // Send a json query to obtain the list off uploaded files
        this.getUploadedFiles();
    }
});
