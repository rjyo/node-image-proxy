var downloadfile = "http://posterous.com/getfile/files.posterous.com/xuxiaoyu/IcDlkEmECIFeGCyGkjlEmHvgbFGHoeEkgAujjmHmzpazHfHmqpoCtAzeGxrm/p105.jpg.scaled500.jpg";
var d2 = "http://s3.amazonaws.com/files.posterous.com/xuxiaoyu/IcDlkEmECIFeGCyGkjlEmHvgbFGHoeEkgAujjmHmzpazHfHmqpoCtAzeGxrm/p105.jpg.scaled500.jpg?AWSAccessKeyId=AKIAJFZAE65UYRT34AOQ&Expires=1305363103&Signature=7PbiUVKn4dmlau%2BmXedD9fkeldE%3D";
// downloadfile = "http://hackback.cloudfoundry.com";

var http = require("http"),
    fs = require("fs"),
    url = require("url");

var filename = 'a.jpg';
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
