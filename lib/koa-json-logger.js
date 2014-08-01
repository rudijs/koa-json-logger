'use strict';

var bunyan = require('bunyan'),
  util = require('util');

function reqSerializer(ctx) {
  return {
    method: ctx.method,
    url: ctx.originalUrl
  };
}

function resSerializer(ctx) {
  return {
    status: ctx.status
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
      level: 'error',
      path: 'log/' + defaultName + '-error.log',
      period: '1d',
      count: 3
    },
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

  return function *(next) {

    var ctx = this;

    var done = function () {
      logger[defaultLevel]({req: ctx, res: ctx}, util.format('%s %s', ctx.method, ctx.originalUrl));
    };

    ctx.res.once('finish', done);
    ctx.res.once('close', done);

    try {
      yield next;
    }
    catch (e) {
      // log uncaught downstream errors
      logger.error({err: e.stack}, util.format('%s %s', ctx.method, ctx.originalUrl));

        // Friendly response message for user
        this.status = 500;
        this.body = 'Internal Server Error';

      if (process.env.NODE_ENV === 'development') {
        // dump error to console in development mode
        this.throw(500, e);
      }
    }

  };

};
