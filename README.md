koa-json-logger
===============

KoaJS HTTP Request/Response and uncaught downstream Error JSON format logger

[![Build Status](https://travis-ci.org/rudijs/koa-json-logger.svg?branch=master)](https://travis-ci.org/rudijs/koa-json-logger)
[![NPM version](https://badge.fury.io/js/koa-json-logger.svg)](http://badge.fury.io/js/koa-json-logger)
[![Dependency Status](https://gemnasium.com/rudijs/koa-json-logger.svg)](https://gemnasium.com/rudijs/koa-json-logger)

The actual logging is done with [node-bunyan](https://github.com/trentm/node-bunyan)

Credits and inspired by:

* [KoaJS](https://github.com/koajs)
* [express-winston](https://github.com/heapsource/express-winston)
* [node-bunyan](https://github.com/trentm/node-bunyan)
* [koa-bunyan](https://github.com/ivpusic/koa-bunyan)
* [KoaJS Logger](https://github.com/koajs/logger)


Code review, suggestions and pull requests very much welcome - thanks!

## Sample 200 Log Entry (pretty print)

    {  
       "name":"myapp",
       "hostname":"dev",
       "pid":16345,
       "level":30,
       "req":{  
          "url":"/users/539d77e8cd4e834b710a103a",
          "headers":{  
             "user-agent":"curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3",
             "host":"127.0.0.1:3000",
             "accept":"*/*",
          },
          "method":"GET",
          "originalUrl":"/users/539d77e8cd4e834b710a103a",
          "query":{  
    
          }
       },
       "res":{  
          "statusCode":200,
          "responseTime":14
       },
       "msg":"GET /users/539d77e8cd4e834b710a103a",
       "time":"2014-08-06T09:02:02.117Z",
       "v":0
    }

   
## Sample 500 Log Entry, two log entries for errors. The error and the request (pretty print)

    {  
       "name":"unitTest",
       "hostname":"dev",
       "pid":21494,
       "level":50,
       "err":"Error: Oops! Something blew up.\n    at Object.route1 (/media/crypt2/projects/koa-json-logger/test/koa-json-logger.spec.js:208:15)\n    at GeneratorFunctionPrototype.next (native)\n    at Object.next (/media/crypt2/projects/koa-json-logger/node_modules/koa/node_modules/co/index.js:74:21)\n    at Object.<anonymous> (/media/crypt2/projects/koa-json-logger/node_modules/koa/node_modules/co/index.js:93:18)\n    at Immediate._onImmediate (/media/crypt2/projects/koa-json-logger/node_modules/koa/node_modules/co/index.js:52:14)\n    at processImmediate [as _immediateCallback] (timers.js:374:17)",
       "msg":"GET /",
       "time":"2014-08-04T14:33:01.581Z",
       "v":0
    }

    {  
       "name":"unitTest",
       "hostname":"dev",
       "pid":21494,
       "level":30,
       "req":{  
          "url":"/",
          "headers":{  
             "host":"127.0.0.1:50762",
             "accept-encoding":"gzip, deflate",
             "cookie":"",
             "user-agent":"node-superagent/0.18.0",
             "connection":"close"
          },
          "method":"GET",
          "originalUrl":"/",
          "query":{  
    
          }
       },
       "res":{  
          "statusCode":500,
          "responseTime":2
       },
       "msg":"GET /",
       "time":"2014-08-04T14:33:01.583Z",
       "v":0
    }

## Install

`npm install koa-json-logger`

## Usage

`var koaJsonLogger = require('koa-json-logger');`

`app.use(koaJsonLogger());`

I suggest it's best to use this middleware very first in the stack so any and all downstream uncaught errors are logged.

Default will log to a relative `log/` directory so you'll need to create this folder.
 
Default use will create two log files:

`log/myapp.log` will contain req/res log entries plus error log entries

`log/myapp-error.log` will contain error log entries only.

Note: this current behavior means error logs will be duplicate - one in each file.

Log files have daily rotation and keeps 3 back copies.

If you prefer req/res and error log entries to be in a single file you can pass in some bunyan streams config like this:

      app.use(koaJsonLogger({
        name: 'myCoolApp',
        streams: [{
            level: 'info',
            path: 'log/app.log'
          }]
      }));

Currently the only supported config options are `name`, `streams` and `level`

Please review the test suite for further details.

## Tests with code coverage report in `test/coverage`

Note: Requires nodes at least v0.11.13 (earlier v0.11 versions may work, have not checked for this).

git clone the full repo: `git clone git@github.com:rudijs/koa-json-logger.git`

`cd koa-json-logger`

`npm install`

`npm test`


## Code Linting

`./node_modules/jshint/bin/jshint lib/**/*.js`

`./node_modules/jshint/bin/jshint test/*.js`
