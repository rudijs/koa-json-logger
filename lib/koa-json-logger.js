'use strict';

var bunyan = require('bunyan'),
  util = require('util');

function reqSerializer(ctx) {
  return {
    url: ctx.url,
    headers: ctx.header,
    method: ctx.method,
    originalUrl: ctx.originalUrl,
    query: ctx.query
  };
}

function resSerializer(ctx) {
  return {
    statusCode: ctx.status,
    responseTime: ctx.responseTime
  };
}

module.exports = function koaLogger(opts) {

  opts = opts || {};

  var defaultName = opts.name || 'myapp';

  // Standard Logger
  // daily rotation
  // keep 3 back copies
  var outLogger = bunyan.createLogger({

    name: defaultName,

    serializers: {
      req: reqSerializer,
      res: resSerializer
    },

    streams: [
      {
        level: 'info',
        path: 'log/' + defaultName + '.log',
        period: '1d',
        count: 3
      }
    ]
  });

  // Error Logger
  // daily rotation
  // keep 3 back copies
  var errLogger = bunyan.createLogger({

    name: defaultName,

    serializers: {
      req: reqSerializer,
      res: resSerializer,
      err: bunyan.stdSerializers.err
    },

    streams: [
      {
        level: 'error',
        path: 'log/' + defaultName + '_error.log',
        period: '1d',
        count: 3
      }
    ]
  });

  return function *logger(next) {

    var start = new Date();

    var ctx = this;

    try {
      yield next;

      ctx.responseTime = new Date() - start;

      if (ctx.status < 400) {
        outLogger.info({req: ctx, res: ctx}, util.format('%s %s', ctx.method, ctx.originalUrl));
      }
      else {
        /*
         Application code can return an error without using "this.throw" or "ctx.throw"
         For example application code could do this and return:
         this.status = 403;
         this.body = 'Access denied';
         In this case the catch block below would not be triggered.
         We want this type of response to go to the error log
         Without this else block the req/res would silently not be logged, this else block should catch this edge case
         The disadvantage of not using "this.throw" in this manner is there is no error stack trace logged only the error message
         */
        errLogger.error({req: ctx, res: ctx, err: ctx.body}, util.format('%s %s', ctx.method, ctx.originalUrl));
      }

    }
    catch (e) {

      // Response properties
      ctx.status = e.status;
      ctx.responseTime = new Date() - start;

      // log error message and stack trace
      errLogger.error({req: ctx, res: ctx, err: e}, util.format('%s %s', ctx.method, ctx.originalUrl));

      // Handle 500 errors - do not leak internal server error message to the user.
      // Standard error response message for user
      if (e.status === 500) {
        if (this.type === 'application/vnd.api+json') {
          this.body = {status: 500, title: 'Internal Server Error'};
        }
        else {
          this.body = 'Internal Server Error';
        }
      }
      else {
        this.body = e.message;
      }

    }

  };

};
