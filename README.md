About node-image-proxy
===
An image proxy written in node.js with a Redis backend, Ready to run on cloud services like CloudFoundry.

What Is This For?
---
I use posterous to update my blog from iPhone (which is much easier than WordPress's offical client), but the images from posterous are blocked in mainland China by the GFW. This image proxy can by-pass the block by sending the images from your own server.

Why Redis?
---
node-image-proxy caches not only the image, but also the headers send from the original server. Redis's hset/hget commands can save easily both of them as a set. It's schema-less!

What Else?
---
I also included 3 demos in this project.

* examples/image\_http.js - download a file using node's stand http module. 
* examples/image\_request.js - download a file using [request](https://github.com/mikeal/request) and save it to Redis.
* examples/image\_recover.js - recover a file from Redis to disk.

Installation
---
You need to add a simple Javascript to your blog, which let the blocked images be proxied. I wrote a jQuery plugin for that (public/imgProxy.js), but it's very simple and you can rewrite it using whatever you like.

    (function($) {
      $.fn.imgProxy = function(options) {
        var settings = {
          "api-root" : "http://img.yourserver.com/u/"
        };
        if (options) {
          $.extend(settings, options);
        }

        this.each(function() {
          var element = $(this);
          if (this.tagName.toLowerCase() == "img" && element.attr("src")) {
            element.attr("src", settings["api-root"] + encodeURIComponent(element.attr("src")));
          }
        });
      };
    })(jQuery);


    $ = jQuery;
    $(document).ready(function(){
      $(".posterous_autopost img").imgProxy();
    });

Install On Cloud Foundry
---
Here is the how to install it on Cloud Foundry:

    gem install vmc
    vmc target api.cloudfoundry.com
    vmc login # if you've got the invitation, it's in your mail
    vmc push your_app
    vmc env-add your_app NODE_ENV=production

    # update your app
    vmc update your_app

    # check status/logs
    vmc stats your_app
    vmc logs your_app
