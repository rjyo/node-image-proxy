var fs = require("fs"),
    redis = require("redis"),
    crypto = require("crypto"),
    client = redis.createClient();

var downloadfile = "http://posterous.com/getfile/files.posterous.com/xuxiaoyu/IcDlkEmECIFeGCyGkjlEmHvgbFGHoeEkgAujjmHmzpazHfHmqpoCtAzeGxrm/p105.jpg.scaled500.jpg";
var hash = crypto.createHash('sha1');
hash.update(downloadfile);
var digest = hash.digest('hex');

var filename = 'a.jpg';
var fh = fs.createWriteStream(filename, {flags: 'w', encoding: 'binary'});

digest = 'b4508d2a431689c6abc8599c67f90ba21148bef2';
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
