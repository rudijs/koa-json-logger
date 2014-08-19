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

  var serializer = {
    statusCode: ctx.status,
    responseTime: ctx.responseTime
  };

  // if error, add the response body (if there is any)
  if (ctx.status >= 400 && ctx.body) {
    serializer.error = ctx.body;
  }

  return serializer;
}

function errSerializer(ctx) {
  return {
    error: ctx.body
  };
}

module.exports = function koaLogger(opts) {

  opts = opts || {};

  var defaultLevel = opts.level || 'info',
    defaultName = opts.name || 'myapp';

  // default streams
  // log INFO and above to file
  // log ERROR and above to file
  // daily rotation
  // keep 3 back copies
  var streams = [
    {
      level: 'info',
      path: 'log/' + defaultName + '.log',
      period: '1d',
      count: 3
    }
  ];

  var defaultStreams = opts.streams || streams;

  var logger = bunyan.createLogger({

    name: defaultName,

    serializers: {
      req: reqSerializer,
      res: resSerializer,
      err: bunyan.stdSerializers.err
    },

    streams: defaultStreams
  });

  var logger2 = bunyan.createLogger({

    name: defaultName,

    serializers: {
      req: reqSerializer,
      res: resSerializer,
      err: bunyan.stdSerializers.err
    },

    streams: [
      {
        level: 'error',
        path: 'log/' + defaultName + '-error.log',
        period: '1d',
        count: 3
      }
    ]
  });

  return function *(next) {

    var start = new Date();

    var ctx = this;

    var done = function () {
      ctx.responseTime = new Date() - start;

      var logLevel;


      // log non error messages
      if (ctx.status < 400) {
        logger.info({req: ctx, res: ctx}, util.format('%s %s', ctx.method, ctx.originalUrl));
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
        logger2.error({req: ctx, res: ctx, err: ctx.body}, util.format('%s %s', ctx.method, ctx.originalUrl));
      }

    };

    ctx.res.once('finish', done);
    ctx.res.once('close', done);

    try {
      yield next;
    }
    catch (e) {

      console.log(e);

      // Response properties
      ctx.status = e.status;
      ctx.responseTime = new Date() - start;

      // log error message and stack trace
      logger2.error({req: ctx, res: ctx, err: e}, util.format('%s %s', ctx.method, ctx.originalUrl));

      // Do not leak internal server error message to the user
      // Friendly response message for user
      if (e.status === 500) {
        this.body = {status: 500, title: 'Internal Server Error'};
      }
      else {
        this.body = e.message;
      }

      // dump error to console in development mode
      //if (process.env.NODE_ENV === 'development') {
      //  if (e.status) {
      //    this.throw(e.status, e.message);
      //  }
      //  else {
      //    this.throw(500, 'Internal Server Error');
      //  }
      //}

    }

  };

};
