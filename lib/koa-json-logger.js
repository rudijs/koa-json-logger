'use strict';

var path = require('path'),
  _ = require('lodash'),
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

var configDefaults = {
  name: 'app',
  path: 'log',
  jsonapi: false,
  isJsonApi: function () {
    return this.jsonapi;
  }
};

module.exports = function koaLogger(opts) {

  opts = opts || {};

  var config = _.extend(configDefaults, opts),
    env = process.env.NODE_ENV;

  var outStream = { level: 'info' };
  if (config.path === null) {
    outStream.stream = process.stdout;
  }
  else {
    outStream.path = path.join(config.path, config.name + '.log');
  }

  // Standard Logger
  var outLogger = bunyan.createLogger({

    name: config.name,

    serializers: {
      req: reqSerializer,
      res: resSerializer
    },

    streams: [outStream]
  });

  var errStream = { level: 'error' };
  if (config.path === null) {
    errStream.stream = process.stderr;
  }
  else {
    errStream.path = path.join(config.path, config.name + '_error.log');
  }

  // Error Logger
  var errLogger = bunyan.createLogger({

    name: config.name,

    serializers: {
      uid: uidSerializer,
      req: reqSerializer,
      res: resSerializer,
      err: bunyan.stdSerializers.err
    },

    streams: [errStream]
  });

  return function *logger(next) {

    var ctx = this,
      start = new Date();

    ctx.uuid = uuid.v4();

    // If logging for a JSON API set the response Content-type before logging is done so the header  is correctly logged
    if (config.isJsonApi()) {
      ctx.response.type = 'application/vnd.api+json';
    }

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
        (config.isJsonApi()) ? ctx.body = {status: 500, title: 'Internal Server Error'} : ctx.body = 'Internal Server Error';
      }
      else {
        ctx.body = err.message;
      }

      // Console output in development only
      if (env === 'development') {
        ctx.app.emit('error', err, this);
      }

    }

    /*
    Currently - if a nested object is thrown the Content-type is set to 'application/json'
    Example:
    this.throw(401, {
      message: {
        status: 401,
        title: 'Unauthorized',
        detail: 'No Authorization header found'
      }
    })
    If JSON API is enabled to work around this we need to set the response Content-type again
    */
    if (config.isJsonApi()) {
      ctx.response.type = 'application/vnd.api+json';
    }

  };

};
