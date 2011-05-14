var request = require('request'),
    redis = require("redis"),
    crypto = require("crypto"),
    client = redis.createClient();

var downloadfile = "http://posterous.com/getfile/files.posterous.com/xuxiaoyu/IcDlkEmECIFeGCyGkjlEmHvgbFGHoeEkgAujjmHmzpazHfHmqpoCtAzeGxrm/p105.jpg.scaled500.jpg";
var hash = crypto.createHash('sha1');
hash.update(downloadfile);
var digest = hash.digest('hex');

request({uri:downloadfile, encoding:'binary'}, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var h = response.headers;
    if (/image\/.+/.test(h['content-type'])) {
      client.set(digest, body, redis.print);
      client.set(digest + ':t', h['content-type'], redis.print);
      client.set(digest + ':l', h['content-length'], redis.print);
      client.set(digest + ':m', h['last-modified'], redis.print);

      console.log('d = ' + digest);
    }
  }
});
