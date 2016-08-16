/**
 * iframe embedding API for PopcornEditor
 *
 * @todo message handler should allow cross-site embedding for different security
 * @todo add a way to return status/data from listeners?
 */
function PopcornEditor() {
  var self = this,
      listeners = {};

  this.init = function (el, url) {
    var editor = (typeof el === 'string') ? document.getElementById(el) : el,
        url = url || 'PopcornEditor/editor.html',
        loadingDiv = null,
        loadingSpinner = null;

    window.addEventListener('message', onmessage);
    this.listen('loaded', function () {
      document.querySelector('#loading').remove();
    });

    loadingDiv = document.createElement('div');
    loadingDiv.setAttribute('id', 'loading');
    loadingDiv.style.width = '100%';
    loadingDiv.style.height = '100%';
    loadingDiv.style.backgroundColor = 'white';
    loadingDiv.style.display = 'flex';
    loadingDiv.style.justifyContent = 'center';

    loadingSpinner = document.createElement('img');
    loadingSpinner.setAttribute('class', 'loading-spinner');
    loadingSpinner.setAttribute('src', 'PopcornEditor/resources/ring-alt.svg');
    loadingSpinner.style.width = '30%';

    loadingDiv.appendChild(loadingSpinner);
    editor.appendChild(loadingDiv);

    this.iframe = document.createElement('iframe'),

    this.iframe.setAttribute('src', url);
    this.iframe.setAttribute('frameborder', '0');
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';

    editor.appendChild(this.iframe);
  };

  this.close = function () {
      window.removeEventListener('message', onmessage);
      this.iframe.parent.removeChild(this.iframe);
      this.iframe = null;
      for (key in listeners) {
          delete listeners[key];
      }
  };

  /**
   * Sets the given handler as the handler for the event
   *
   * @param eventName : [string] name of the event (must be in events)
   * @param handler : [function] takes event
   */
  this.listen = function (eventName, handler) {
      if (listeners[eventName] === undefined) {
        listeners[eventName] = [handler];
      } else {
        listeners[eventName].push(handler);
      }
  }

  /**
   * Remove an event listener
   *
   * @param eventName : [string] name of the event (must be in events)
   * @param handler : [function] handler to remove
   */
  this.unlisten = function (eventName, handler) {
      if (listeners[eventName] !== undefined) {
        var found = listeners[eventName].indexOf(handler);
        if (found !== -1) {
          listeners[eventName].splice(found, 1);
        }
      }
  }

  /**
   * Loads the popcorn json blob into the editor
   *
   * @param data : [object] json object
   */
  this.loadInfo = function (data) {
      this.iframe.contentWindow.postMessage({
         data: data,
         type: 'load'
      }, window.location.origin);
  };

  /**
   * Given a javascript object which fits the schema defined below, popcorn
   * editor will load that video into the editor.
   *
   * @param video : javascript object of video
   */
  this.createTemplate = function (video) {
    var videoUrl = video.url;
    data = {
        "template": "basic",
        "background": "#FFFFFF",
        "data": {
            "targets": [{
                "id": "Target0",
                "name": "video-container",
                "element": "video-container",
            }],
            "media": [{
                "id": "Media0",
                "name": "Media0",
                "url": "#t=,30",
                "target": "video",
                "duration": video.duration,
                "popcornOptions": {
                    "frameAnimation": true,
                },
                "controls": true,
                "tracks": [{
                    "name": "",
                    "id": "0",
                    "order": 0,
                    "trackEvents": [{
                        "id": "TrackEvent0",
                        "type": "sequencer",
                        "popcornOptions": {
                            "start": 0,
                            "source": [video.url],
                            "fallback": "",
                            "denied": false,
                            "end": video.duration,
                            "from": 0,
                            "title": video.title,
                            "type": "AirMozilla",
                            "thumbnailSrc": video.thumbnail,
                            "duration": video.duration,
                            "linkback": "",
                            "contentType": "",
                            "hidden": false,
                            "target": "video-container",
                            "left": 0,
                            "top": 0,
                            "width": 100,
                            "height": 100,
                            "volume": 100,
                            "mute": false,
                            "zindex": 1000,
                            "id": "TrackEvent0"
                        },
                        "track": "0",
                        "name": "TrackEvent0"
                    }]
                }],
                "clipData": {
                },
                "currentTime": 0,
            }]
        },
        "tags": ["popcorn"],
    }
    // Need to dynamically set the clipdata key
    data.data.media[0].clipData[videoUrl] = {
        "type": video.type,
        "title": video.title,
        "source": video.url,
        "thumbnail": video.thumbnail,
        "duration": video.duration
    }
    return data;
  };

  function onmessage (e) {
    if (e.source !== self.iframe.contentWindow) {
      return;
    }
    if (e.origin !== window.location.origin) {
      return;
    }
    for (key in listeners) {
      if (e.data.type === key) {
        listeners[key].forEach(function(handler) {
            handler(e.data.data);
        });
      }
    }
  }

}

// List of events that PopcornEditor supports
PopcornEditor.events = {
  save: 'save',
  loaded: 'loaded'
};
