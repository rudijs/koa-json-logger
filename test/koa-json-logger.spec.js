'use strict';

var should = require('chai').should(),
  request = require('supertest'),
  koa = require('koa'),
  fs = require('fs'),
  readline = require('readline'),
  stream = require('stream');

var koaJsonLogger = require('../lib/koa-json-logger'),
  testLogFiles = [
    'log/test.log',
    'log/myapp.log',
    'log/myapp-error.log'
  ],
  app;

describe('JSON Logger middleware', function () {

  beforeEach(function (done) {

    // clear out test log files
//    testLogFiles.forEach(function (logFile) {
//      fs.exists(logFile, function (file) {
//        if (file) {
//          fs.unlinkSync(logFile);
//        }
//      });
//    });

    app = koa();

    done();

  });

//  describe('using default options', function () {
//
//    it('should log info level', function (done) {
//
//      app.use(koaJsonLogger());
//
//      // default route for test
//      app.use(function *(next) {
//        this.body = 'Test Response is OK.';
//        yield next;
//      });
//
//      request(app.listen())
//        .get('/')
//        .expect(200)
//        .end(function (err, res) {
//          if (err) {
//            should.not.exist(err);
//            return done(err);
//          }
//
//          // test http response
//          res.text.should.equal('Test Response is OK.');
//
//          // read in log file entry
//          fs.readFile('log/myapp.log', function (err, data) {
//            if (err) {
//              throw err;
//            }
//
//            // test JSON parsed log entry
//            var logEntry = JSON.parse(data.toString());
//            logEntry.name.should.equal('myapp');
//            logEntry.req.method.should.equal('GET');
//            logEntry.req.url.should.equal('/');
//            logEntry.msg.should.equal('GET /');
//
//            done();
//          });
//
//        });
//
//    });
//
//  });

  describe('using non default options', function () {

    var testLogFile = 'log/test.log';

    beforeEach(function (done) {

      app.use(koaJsonLogger({
        name: 'unitTest',
        streams: [
          {
            level: 'info',
            path: testLogFile
          }]

      }));

      done();
    });

//    it('should log info level', function (done) {
//
//      // default route for test
//      app.use(function *(next) {
//        this.body = 'Test Response is OK.';
//        yield next;
//      });
//
//      request(app.listen())
//        .get('/')
//        .expect(200)
//        .end(function (err, res) {
//          if (err) {
//            should.not.exist(err);
//            return done(err);
//          }
//
//          // test http response
//          res.text.should.equal('Test Response is OK.');
//
//          // read in log file entry
//          fs.readFile(testLogFile, function (err, data) {
//            if (err) {
//              throw err;
//            }
//
//            // test JSON parsed log entry
//            var logEntry = JSON.parse(data.toString());
//            logEntry.name.should.equal('unitTest');
//            logEntry.req.method.should.equal('GET');
//            logEntry.req.url.should.equal('/');
//            logEntry.msg.should.equal('GET /');
//
//            done();
//          });
//
//        });
//
//    });

    it('should log error level', function (done) {

//    process.env.NODE_ENV = 'development';

      // 1st default test route that will catch uncaught downstream errors
      app.use(function *route1(next) {
        yield next;
      });

      // 2nd route. Downstream route/middleware that throws an error
      app.use(function *route2(next) {
        yield next;
        throw new Error('Oops! Something blew up.');
      });

      request(app.listen())
        .get('/')
        .expect(500)
        .end(function (err, res) {
          if (err) {
            should.not.exist(err);
            return done(err);
          }

          res.text.should.equal('Internal Server Error');

          var instream = fs.createReadStream(testLogFile);
          var outstream = new stream();
          var rl = readline.createInterface(instream, outstream);

          var lineNumber = 0;

          rl.on('line', function(line) {
            var logEntry = JSON.parse(line);

            if (lineNumber === 0) {
              // 1st log entry is then error message
              logEntry.err.should.match(/Something\ blew\ up/);
            }
            else {
              // 2nd log entry is the request
              logEntry.name.should.equal('unitTest');
              logEntry.req.method.should.equal('GET');
              logEntry.req.url.should.equal('/');
              logEntry.msg.should.equal('GET /');
            }

            lineNumber += 1;

          });

          rl.on('close', function() {
            done();
          });

        });

    });

//    it('should log errors to console in development mode', function (done) {
//
//      process.env.NODE_ENV = 'development';
//
//      // default test route throw error
//      app.use(function *route1(next) {
//        yield next;
//        throw new Error('Oops! Something blew up.');
//      });
//
//      request(app.listen())
//        .get('/')
//        .expect(500)
//        .end(function (err, res) {
//          if (err) {
//            should.not.exist(err);
//            return done(err);
//          }
//          res.text.should.equal('Internal Server Error');
//          done();
//
//        });
//
//    });

  });



});
