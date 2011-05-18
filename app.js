/**
 * Module dependencies.
 */

require.paths.unshift('./node_modules');

var express = require('express'),
    sys = require('sys'),
    crypto = require('crypto'),
    request = require('request'),
    sio = require('socket.io'),
    redis = require('redis'),
    redis_client = null,
    app = module.exports = express.createServer();

var io;

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


//
// helper functions
//
function retrieve_file(url, fn) {
  var digest = getDigest(url);

  redis_client.exists(digest, function(err, result) {
    if (result == 1) {
      console.log("Using redis cache...");
      fn(digest);
    } else {
      downloadImage(url, digest, function(header, body) {
        console.log("File downloaded...");
        fn(digest);
      });
    }
  });
}

function downloadImage(url, digest, callback) {
  console.log('downloading: ' + url);
  try {
    request({uri:url, encoding:'binary'}, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var h = response.headers;
        if (/image\/.+/.test(h['content-type'])) {
          console.log("saving to redis");
          // set hash = digest with 2 fields: data=body, header=header
          redis_client.hset(digest, 'body',  body, redis.print);
          redis_client.hset(digest, 'header', JSON.stringify(h), redis.print);

          console.log('d = ' + digest);
          callback(h, body);
        }
      }
    });
  }catch (err) {
    console.log("error in downloading");
    console.log(err);
  }
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
  return hash.digest('hex') + '_p';
}

//
// routes
//
app.get('/', function(req, res) {
  console.log('GET /');
  res.render('index', {
    title: 'node-image-proxy online'
  });
});

app.get('/cache/clear', function(req, res) {
  console.log("Clearing all keys");
  redis_client.keys('*', function(err, results) {
    for (var key in results) {
      client.del(key);
    }
    res.send({done:1});
  });
});

app.get('/i/:digest', function(req, res) {
  var digest = req.params.digest;
  console.log('GET /i/' + digest);

  redis_client.hgetall(digest, function (err, data) { // get all values and keys for digest
    if (err) {
      sendFile(res, '', '');
    } else {
      sendFile(res, JSON.parse(data['header']), data['body']);
    }
  });
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.VMC_APP_PORT || 3000);
  console.log("Express server listening on port " + app.address().port);

  var options = {};
  // options.log = false;
  // if (!options.transportOptions) options.transportOptions = {
  //   'xhr-polling': { closeTimeout: 100 }
  // };
  options.origins = "*:*";
  // options.transports = ['websocket', 'xhr-polling', 'flashsocket'];
  options.transports = ['xhr-polling'];

  io = sio.listen(app, options);
}

// Socket.io
io.on('connection', function(client){
  console.log("connected");
  // new client is here!
  client.on('message', function(obj){
    retrieve_file(obj.url, function(digest) {
      client.send({digest: digest, idx: obj.idx});
    });
  });
});

// Set up Redis, dynamically discovering and connecting to the bound CloudFoundry service
if (process.env.VCAP_SERVICES) {
    console.log("Bound services detected.");
    var services = JSON.parse(process.env.VCAP_SERVICES);
    for (serviceType in services) {
        console.log("Service: " + serviceType);
        console.log("Service Info: " + JSON.stringify(services[serviceType]));
        if (serviceType.match(/redis*/)) {
            var service = services[serviceType][0];
            console.log("Connecting to Redis service " + service.name + ":" + service.credentials.hostname + ":" + service.credentials.port);
            redis_client = redis.createClient(service.credentials.port, service.credentials.hostname);
            redis_client.auth(service.credentials.password);
            break;
        }
    }
} else {
  redis_client = redis.createClient();
}

