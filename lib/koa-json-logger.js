'use strict';

var path = require('path'),
  bunyan = require('bunyan'),
  uuid = require('uuid');

function reqSerializer(ctx) {
  return {
    url: ctx.url,
    headers: ctx.request.header,
    method: ctx.method,
    ip: ctx.ip,
    protocol: ctx.protocol,
    originalUrl: ctx.originalUrl,
    query: ctx.query
  };
}

function resSerializer(ctx) {
  return {
    statusCode: ctx.status,
    responseTime: ctx.responseTime,
    headers: ctx.response.header
  };
}

function uidSerializer (uuid) {
  return uuid;
}

module.exports = function koaLogger(opts) {

  var env = process.env.NODE_ENV;

  opts = opts || {};

  var defaultName = opts.name || 'myapp',
    defaultPath = opts.path || 'log';

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
        path: path.join(defaultPath, defaultName + '.log'),
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
      uid: uidSerializer,
      req: reqSerializer,
      res: resSerializer,
      err: bunyan.stdSerializers.err
    },

    streams: [
      {
        level: 'error',
        path: path.join(defaultPath, defaultName + '_error.log'),
        period: '1d',
        count: 3
      }
    ]
  });

  return function *logger(next) {

    var ctx = this,
      start = new Date();

    ctx.uuid = uuid.v4();

    try {
      yield next;

      ctx.responseTime = new Date() - start;

      outLogger.info({uid: ctx.uuid, req: ctx, res: ctx});
    }
    catch (err) {

      // Response properties
      ctx.status = err.status || 500;
      ctx.responseTime = new Date() - start;

      // log error message and stack trace
      errLogger.error({uid: ctx.uuid, req: ctx, res: ctx, err: err});

      // Handle 500 errors - do not leak internal server error message to the user.
      // Standard error response message for user
      if (ctx.status === 500) {
        if (this.type === 'application/vnd.api+json') {
          this.body = {status: 500, title: 'Internal Server Error'};
        }
        else {
          this.body = 'Internal Server Error';
        }
      }
      else {
        this.body = err.message;
      }

      // Console output in development only
      if (env === 'development') {
        this.app.emit('error', err, this);
      }

    }

  };

};
