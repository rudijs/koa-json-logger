koa-json-logger
===============

KoaJS HTTP Request/Response and uncaught downstream Error JSON format logger

[![Build Status](https://travis-ci.org/rudijs/koa-json-logger.svg?branch=master)](https://travis-ci.org/rudijs/koa-json-logger)  
[![Coverage Status](https://coveralls.io/repos/rudijs/koa-json-logger/badge.png?branch=master)](https://coveralls.io/r/rudijs/koa-json-logger?branch=master)  
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

## Overview

The basic goal of this module is to create log entries in JSON format for each HTTP request.

Success (<400) log entries will contain Request details, Response status code and Response time.

Error (>=400) log entries will contain Request details, Response status code, Response time and Error details.

Success and Error logs will have their own file (two files).

Higher level goals are:

- Create uniform success and error log entries in JSON format for centralized logging
- In particular the ELK stack (Logstash, Elasticsearch and Kibana)
- A unique ID (RFC4122 uuid v4) is also created for each log entry.
- This uuid can be used in other application logs, which end up in ELK, so you can correlate the request or error to other custom log entries.

Below will be some sample log entries in pretty print and also some screen shots of how they look in Kibana.

## Install

`npm install koa-json-logger`

## Usage

`var koaJsonLogger = require('koa-json-logger');`

`app.use(koaJsonLogger());`

I suggest it's best to use this middleware high in the middleware stack so any and all downstream uncaught errors are logged.

Logs will go into a `log/` directory relative to file that instruments the Koa app, so you'll need to create this folder.
 
Default use will create two log files:

`log/myapp.log` will contain req/res log entries.

`log/myapp_error.log` will contain error log entries.

Log files have daily rotation and keeps 3 back copies.

Currently the only supported config options are `name` which configures the log file name and name property of the log entry.

      app.use(koaJsonLogger({
        name: 'myCoolApp'
      }));

When you throw an application error it's best to always use `this.throw`

Example: `this.throw(403, 'Access Denied');`

You can throw errors this way but they will be silently *not* logged - so best *not* to do it this way:

    this.status = 401;
    this.body = 'Access Denied';

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


## Sample Success Log Entry (pretty print)

	{
	   "name":"myapp",
	   "hostname":"dev",
	   "pid":23816,
	   "level":30,
	   "req":{
	      "uuid":"04c41cbc-022c-43e0-846b-81922e5e4aa2",
	      "url":"/users/539d77e8cd4e834b710a103a",
	      "headers":{
		 "host":"127.0.0.1:3000",
		 "connection":"keep-alive",
		 "cache-control":"no-cache",
		 "user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36",
		 "accept":"*/*",
		 "accept-encoding":"gzip,deflate,sdch",
		 "accept-language":"en-US,en;q=0.8"
	      },
	      "method":"GET",
	      "originalUrl":"/users/539d77e8cd4e834b710a103a",
	      "query":{

	      }
	   },
	   "res":{
	      "statusCode":200,
	      "responseTime":4
	   },
	   "msg":"GET /users/539d77e8cd4e834b710a103a",
	   "time":"2014-08-20T14:59:47.257Z",
	   "v":0
	}

## Sample Error Log Entry (pretty print)

	{
	   "name":"myapp",
	   "hostname":"dev",
	   "pid":23816,
	   "level":50,
	   "req":{
	      "uuid":"3abbb7d7-e9c3-48ab-8ba9-da3db000592f",
	      "url":"/users/123",
	      "headers":{
		 "host":"127.0.0.1:3000",
		 "connection":"keep-alive",
		 "cache-control":"no-cache",
		 "user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36",
		 "accept":"*/*",
		 "accept-encoding":"gzip,deflate,sdch",
		 "accept-language":"en-US,en;q=0.8"
	      },
	      "method":"GET",
	      "originalUrl":"/users/123",
	      "query":{

	      }
	   },
	   "res":{
	      "statusCode":400,
	      "responseTime":8
	   },
	   "err":{
	      "message":{
		 "status":400,
		 "title":"Bad Request",
		 "detail":"Invalid user ID format."
	      },
	      "name":"Error",
	      "stack":"Error: Bad Request\n    at Object.module.exports [as throw] (/media/crypt2/projects/ride-share-market-api/node_modules/koa/lib/context.js:84:48)\n    at Object.<anonymous> (/media/crypt2/projects/ride-share-market-api/app/routes/routes-users.js:24:17)\n    at GeneratorFunctionPrototype.throw (native)\n    at Object.next (/media/crypt2/projects/ride-share-market-api/node_modules/koa/node_modules/co/index.js:65:26)\n    at /media/crypt2/projects/ride-share-market-api/node_modules/koa/node_modules/co/index.js:93:18\n    at _rejected (/media/crypt2/projects/ride-share-market-api/node_modules/q/q.js:797:24)\n    at /media/crypt2/projects/ride-share-market-api/node_modules/q/q.js:823:30\n    at Promise.when (/media/crypt2/projects/ride-share-market-api/node_modules/q/q.js:1035:31)\n    at Promise.promise.promiseDispatch (/media/crypt2/projects/ride-share-market-api/node_modules/q/q.js:741:41)\n    at /media/crypt2/projects/ride-share-market-api/node_modules/q/q.js:509:49"
	   },
	   "msg":"GET /users/123",
	   "time":"2014-08-20T15:05:44.442Z",
	   "v":0
	}

## Kibana Success Screenshot example:

![Kibana Success Screenshot example][images/kibana_success_log_entry.png]

## Kibana Error Screenshot example:

![Kibana Error Screenshot example][images/kibana_error_log_entry.png]

