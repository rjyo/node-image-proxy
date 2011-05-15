var downloadfile = "http://www.google.com/images/logos/ps_logo2.png";

var http = require("http"),
    fs = require("fs"),
    url = require("url");

var filename = 'logo.png';
var fh = fs.createWriteStream(filename, {flags: 'w', encoding: 'binary'});

function download (u) {
  console.log('downloading ' + u + ' ...');

  var options = url.parse(u);
  options.path = options.pathname;
  if (options.pathname) {
    options.path = options.pathname;
  }
  if (options.search) {
    options.path += options.search;
  }

  http.get(options, function(res) {
    if (res.statusCode == 301 || res.statusCode == 302) {
      console.log('redirecting...');
      download(res.headers.location);
    } else {
      console.log(res.headers);
      res.on('data', function(chunk) {
        fh.write(chunk, encoding='binary');
      });
      res.on('end', function() {
        fh.end();
        console.log("end");
      });
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
}

download(downloadfile);
