koa-json-logger
===============

KoaJS HTTP and uncaught downstream Error JSON format logger

The actual logging is done with [node-bunyan](https://github.com/trentm/node-bunyan)

Inspired by [KoaJS](https://github.com/koajs), [express-winston](https://github.com/heapsource/express-winston), [node-bunyan](https://github.com/trentm/node-bunyan) and [KoaJS Logger](https://github.com/koajs/logger)

Code review, suggestions and pull requests very much welcome - thanks!

## Sample 200 Log Entry

    {"name":"myapp","hostname":"dev","pid":1106,"level":30,"req":{"method":"GET","url":"/users/539d77e8cd4e834b710a103a"},"res":{"status":200},"msg":"GET /users/539d77e8cd4e834b710a103a","time":"2014-08-01T06:31:20.612Z","v":0}

## Sample 200 Log Entry (pretty print)

    {
      "name": "myapp",
      "hostname": "dev",
      "pid": 1106,
      "level": 30,
      "req": {
        "method": "GET",
        "url": "\/users\/539d77e8cd4e834b710a103a"
      },
      "res": {
        "status": 200
      },
      "msg": "GET \/users\/539d77e8cd4e834b710a103a",
      "time": "2014-08-01T06:31:20.612Z",
      "v": 0
    }

   
## Sample 500 Log Entry - two log entries for errors. The error and the request

    {"name":"unitTest","hostname":"dev","pid":1468,"level":50,"err":"Error: Oops! Something blew up.\n    at Object.route2 (/media/crypt2/projects/koa-json-logger/test/koa-json-logger.spec.js:154:15)\n    at GeneratorFunctionPrototype.next (native)\n    at Object.next (/media/crypt2/projects/koa-json-logger/node_modules/koa/node_modules/co/index.js:74:21)\n    at Object.<anonymous> (/media/crypt2/projects/koa-json-logger/node_modules/koa/node_modules/co/index.js:93:18)\n    at Immediate._onImmediate (/media/crypt2/projects/koa-json-logger/node_modules/koa/node_modules/co/index.js:52:14)\n    at processImmediate [as _immediateCallback] (timers.js:374:17)","msg":"GET /","time":"2014-08-01T06:34:26.752Z","v":0}
    {"name":"unitTest","hostname":"dev","pid":1468,"level":30,"req":{"method":"GET","url":"/"},"res":{"status":500},"msg":"GET /","time":"2014-08-01T06:34:26.756Z","v":0}

## Sample 500 Log Entry (pretty print)

    {
      "name": "unitTest",
      "hostname": "dev",
      "pid": 1468,
      "level": 50,
      "err": "Error: Oops! Something blew up.\n    at Object.route2 (\/media\/crypt2\/projects\/koa-json-logger\/test\/koa-json-logger.spec.js:154:15)\n    at GeneratorFunctionPrototype.next (native)\n    at Object.next (\/media\/crypt2\/projects\/koa-json-logger\/node_modules\/koa\/node_modules\/co\/index.js:74:21)\n    at Object.<anonymous> (\/media\/crypt2\/projects\/koa-json-logger\/node_modules\/koa\/node_modules\/co\/index.js:93:18)\n    at Immediate._onImmediate (\/media\/crypt2\/projects\/koa-json-logger\/node_modules\/koa\/node_modules\/co\/index.js:52:14)\n    at processImmediate [as _immediateCallback] (timers.js:374:17)",
      "msg": "GET \/",
      "time": "2014-08-01T06:34:26.752Z",
      "v": 0
    }
    {
      "name": "unitTest",
      "hostname": "dev",
      "pid": 1468,
      "level": 30,
      "req": {
        "method": "GET",
        "url": "\/"
      },
      "res": {
        "status": 500
      },
      "msg": "GET \/",
      "time": "2014-08-01T06:34:26.756Z",
      "v": 0
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


## Linting

`./node_modules/jshint/bin/jshint index.js` 

`./node_modules/jshint/bin/jshint test/koa-json-logger.spec.js`
