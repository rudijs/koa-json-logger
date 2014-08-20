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

    var done = function () {
      if (ctx.status < 400) {
        ctx.responseTime = new Date() - start;
        outLogger.info({req: ctx, res: ctx}, util.format('%s %s', ctx.method, ctx.originalUrl));
      }
    };

    ctx.res.once('finish', done);
    ctx.res.once('close', done);

    try {
      yield next;
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
