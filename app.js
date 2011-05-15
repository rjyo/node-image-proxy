/**
 * Module dependencies.
 */

require.paths.unshift('./node_modules');

var express = require('express'),
    sys = require('sys'),
    crypto = require('crypto'),
    request = require('request'),
    redis = require('redis'),
    client = null,
    app = module.exports = express.createServer();

// Configuration

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.logger('  \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:response-timems\033[0m'));
});

app.configure('production', function() {
  app.use(express.errorHandler());
  app.use(express.logger('[:date] INFO :method :url :response-timems'));
});

app.get('/', function(req, res) {
  console.log('GET /');
  res.render('index', {
    title: 'node-image-proxy online'
  });
});

function downloadImage(url, digest, callback) {
  console.log('downloading: ' + url);
  request({uri:url, encoding:'binary'}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var h = response.headers;
      if (/image\/.+/.test(h['content-type'])) {
        console.log("saving to redis");
        // set hash = digest with 2 fields: data=body, header=header
        client.hset(digest, 'body',  body, redis.print);
        client.hset(digest, 'header', JSON.stringify(h), redis.print);

        console.log('d = ' + digest);
        callback(h, body);
      }
    }
  });
}

function sendFile(res, headers, body) {
  for (var key in headers) {
    res.header(key, headers[key]);
  }
  res.write(body, encoding='binary');
  res.end();
}

function getDigest(url) {
  var hash = crypto.createHash('sha1');
  hash.update(url);
  return "img:" + hash.digest('hex');
}

app.get('/cache/clear', function(req, res) {
  console.log("Clearing all keys");
  client.keys('*', function(err, results) {
    for (var key in results) {
      client.del(key);
    }
    res.send({done:1});
  });
});

app.get('/u/:url', function(req, res) {
  var url = req.params.url;
  console.log('GET /u/' + url);

  var digest = getDigest(url);

  client.exists(digest, function(err, result) {
    if (result == 1) {
      console.log("Using redis cache...");
      client.hgetall(digest, function (err, data) { // get all values and keys for digest
        if (err) {
          res.send({err:-1});
        } else {
          sendFile(res, JSON.parse(data['header']), data['body']);
        }
      });
    } else {
      downloadImage(url, digest, function(header, body) {
        sendFile(res, header, body);
      });
    }
  });

});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.VMC_APP_PORT || 3000);
  console.log("Express server listening on port " + app.address().port);
}

//Set up Redis, dynamically discovering and connecting to the bound CloudFoundry service
if (process.env.VCAP_SERVICES) {
    console.log("Bound services detected.");
    var services = JSON.parse(process.env.VCAP_SERVICES);
    for (serviceType in services) {
        console.log("Service: " + serviceType);
        console.log("Service Info: " + JSON.stringify(services[serviceType]));
        if (serviceType.match(/redis*/)) {
            var service = services[serviceType][0];
            console.log("Connecting to Redis service " + service.name + ":" + service.credentials.hostname + ":" + service.credentials.port);
            client = redis.createClient(service.credentials.port, service.credentials.hostname);
            client.auth(service.credentials.password);
            break;
        }
    }
} else {
  client = redis.createClient();
}
