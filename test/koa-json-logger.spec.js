'use strict';

var should = require('chai').should(),
  request = require('supertest'),
  koa = require('koa'),
  fs = require('fs');

var koaJsonLogger = require('../lib/koa-json-logger'),
  testLogFiles = [
    'log/test.log',
    'log/myapp.log',
    'log/myapp_error.log'
  ],
  app;

describe('JSON Logger middleware', function () {

  beforeEach(function (done) {
    // clear out test log files
    testLogFiles.forEach(function (logFile) {
      fs.exists(logFile, function (file) {
        if (file) {
          fs.unlinkSync(logFile);
        }
      });
    });
    done();
  });

  beforeEach(function (done) {
    app = koa();
    done();
  });

  describe('success', function () {

    it('should log request and response', function (done) {

      app.use(koaJsonLogger());

      // default route for test
      app.use(function *(next) {
        this.body = 'Test Response is OK.';
        yield next;
      });

      request(app.listen())
        .get('/')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            should.not.exist(err);
            return done(err);
          }

          // test http response
          res.text.should.equal('Test Response is OK.');

          // read in log file entry
          fs.readFile('log/myapp.log', function (err, data) {
            if (err) {
              throw err;
            }

            // test JSON parsed log entry
            var logEntry = JSON.parse(data.toString());

            // bunyan property logging
            logEntry.name.should.equal('myapp');
            logEntry.msg.should.equal('GET /');

            // request logging
            logEntry.req.method.should.equal('GET');
            logEntry.req.url.should.equal('/');
            should.exist(logEntry.req.headers);

            // response logging
            logEntry.res.statusCode.should.equal(200);
            should.exist(logEntry.res.responseTime);

            done();
          });

        });

    });

  });

  describe('error', function () {

    describe('thrown', function () {

      it('should log request, response and error', function (done) {

        app.use(koaJsonLogger());

        //    process.env.NODE_ENV = 'development';

        // 1st default test route that will catch uncaught downstream errors
        app.use(function
        *
        route1(next)
        {
          yield next;
        }
        )
        ;

        // 2nd route. Downstream route/middleware that throws an error
        app.use(function
        *
        route2(next)
        {
          this.throw('Oops! Something blew up.');
          yield next;
        }
        )
        ;

        request(app.listen())
          .get('/')
          .expect(500)
          .end(function (err, res) {
            if (err) {
              should.not.exist(err);
              return done(err);
            }

            // should not leak out internal server error messages on 500
            // standard error response for the user
            res.text.should.equal('Internal Server Error');

            // read in log file entry
            fs.readFile('log/myapp_error.log', function (err, data) {
              if (err) {
                throw err;
              }

              // test JSON parsed log entry
              var logEntry = JSON.parse(data.toString());

              // bunyan property logging
              logEntry.name.should.equal('myapp');
              logEntry.msg.should.equal('GET /');

              // request logging
              logEntry.req.method.should.equal('GET');
              logEntry.req.url.should.equal('/');
              should.exist(logEntry.req.headers);

              // response logging
              logEntry.res.statusCode.should.equal(500);
              should.exist(logEntry.res.responseTime);

              // error logging
              logEntry.err.message.should.match(/Something\ blew\ up/);
              logEntry.err.name.should.equal('Error');
              logEntry.err.stack.should.match(/Something\ blew\ up/);

              done();
            });

          });

      });

      it('should display the application error message for non 500 errors', function (done) {

        app.use(koaJsonLogger());

        // 1st default test route that will catch uncaught downstream errors
        app.use(function
        *
        route1(next)
        {

          // throw a custom application error
          this.throw(400, 'Bad URL parameter format');
          yield next;
        }
        )
        ;

        request(app.listen())
          .get('/')
          .expect(400)
          .end(function (err, res) {
            if (err) {
              should.not.exist(err);
              return done(err);
            }

            // should not leak out internal server error messages on 500
            // standard error response for the user
            res.text.should.equal('Bad URL parameter format');

            // read in log file entry
            fs.readFile('log/myapp_error.log', function (err, data) {
              if (err) {
                throw err;
              }

              // test JSON parsed log entry
              var logEntry = JSON.parse(data.toString());

              // bunyan property logging
              logEntry.name.should.equal('myapp');
              logEntry.msg.should.equal('GET /');

              // request logging
              logEntry.req.method.should.equal('GET');
              logEntry.req.url.should.equal('/');
              should.exist(logEntry.req.headers);

              // response logging
              logEntry.res.statusCode.should.equal(400);
              should.exist(logEntry.res.responseTime);

              // error logging
              logEntry.err.message.should.equal('Bad URL parameter format');
              logEntry.err.name.should.equal('Error');
              logEntry.err.stack.should.match(/Bad\ URL\ parameter\ format/);

              done();
            });

          });

      });

      it('should respond with JSON 500 errors if response media type is JSON API', function (done) {

        app.use(koaJsonLogger());

        // Set the API response to JSON API format
        app.use(function
        *(next)
        {
          this.type = 'application/vnd.api+json';
          yield next;
        }
        )
        ;

        // 1st default test route that will catch uncaught downstream errors
        app.use(function
        *
        route1(next)
        {

          // throw a custom application error
          this.throw('Oops! Something blew up.');
          yield next;
        }
        )
        ;

        request(app.listen())
          .get('/')
          .expect(500)
          .end(function (err, res) {
            if (err) {
              should.not.exist(err);
              return done(err);
            }

            // should not leak out internal server error messages on 500
            // standard error response for the user
            res.text.should.equal('{"status":500,"title":"Internal Server Error"}');

            // read in log file entry
            fs.readFile('log/myapp_error.log', function (err, data) {
              if (err) {
                throw err;
              }

              // test JSON parsed log entry
              var logEntry = JSON.parse(data.toString());

              // bunyan property logging
              logEntry.name.should.equal('myapp');
              logEntry.msg.should.equal('GET /');

              // request logging
              logEntry.req.method.should.equal('GET');
              logEntry.req.url.should.equal('/');
              should.exist(logEntry.req.headers);

              // response logging
              logEntry.res.statusCode.should.equal(500);
              should.exist(logEntry.res.responseTime);

              // error logging
              logEntry.err.message.should.match(/Something\ blew\ up/);
              logEntry.err.name.should.equal('Error');
              logEntry.err.stack.should.match(/Something\ blew\ up/);

              done();
            });

          });

      });
    });

    describe('not thrown', function () {

      it('should log request, response and error', function (done) {

        app.use(koaJsonLogger());

        // Set the API response to JSON API format
        app.use(function *(next) {
          this.type = 'application/vnd.api+json';
          yield next;
        });

        // 1st default test route that will catch uncaught downstream errors
        app.use(function *route1(next) {

          // Custom application error *not thrown*
          this.status = 403;
          this.body = 'Access denied';
          yield next;
        });

        request(app.listen())
          .get('/')
          .expect(403)
          .end(function (err, res) {
            if (err) {
              should.not.exist(err);
              return done(err);
            }

            // should not leak out internal server error messages on 500
            // standard error response for the user
            //res.text.should.equal('{"status":500,"title":"Internal Server Error"}');
            res.text.should.equal('Access denied');

            // read in log file entry
            fs.readFile('log/myapp_error.log', function (err, data) {
              if (err) {
                throw err;
              }

              // test JSON parsed log entry
              var logEntry = JSON.parse(data.toString());

              // bunyan property logging
              logEntry.name.should.equal('myapp');
              logEntry.msg.should.equal('GET /');

              // request logging
              logEntry.req.method.should.equal('GET');
              logEntry.req.url.should.equal('/');
              should.exist(logEntry.req.headers);

              // response logging
              logEntry.res.statusCode.should.equal(403);
              should.exist(logEntry.res.responseTime);

              // error logging
              logEntry.err.should.equal('Access denied');

              done();
            });

          });

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
//
//  });

});
