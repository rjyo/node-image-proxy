(function($) {
  $.fn.imgProxy = function(options) {
    var settings = {
      "api-root" : "http://xiaoyu.cloudfoundry.com/u/"
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
