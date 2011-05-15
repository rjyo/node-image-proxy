var fs = require("fs"),
    redis = require("redis"),
    crypto = require("crypto"),
    client = redis.createClient();

var downloadfile = "http://www.google.com/images/logos/ps_logo2.png";
var hash = crypto.createHash('sha1');
hash.update(downloadfile);
var digest = hash.digest('hex');

var filename = 'logo.png';
var fh = fs.createWriteStream(filename, {flags: 'w', encoding: 'binary'});

client.get(digest, function (err, reply) { // get entire file
  if (err) {
    console.log("Get error: " + err);
  } else {
    fh.write(reply, encoding = 'binary');
    fh.end();
    console.log("file write");
    client.end();
  }
});
