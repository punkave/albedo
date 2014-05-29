var should = require('chai').should(),
    albedo = require('../albedo'),
    processReport = albedo.processReport;

var options = {
  location: "reports",
  name: "cmmi",
  query: "SELECT * FROM incident LEFT JOIN sf_guard_user ON incident.user_id = sf_guard_user.id LIMIT 5;",
  connection: {
    type: "db",
    host: "localhost",
    user: "root",
    password: "root",
    database: "cmmi"
  },
  conflict: "overwrite",
  removeOlderThan: "5 days"
};



describe('processReport', function() {
    it('call process report without options', function() {
        processReport(null, function (err, doc) {
            should.exist(err);
            err.should.equal('processReport requires options, see documentation');
        });
    });
    it('call process report unsupported DB', function() {
        processReport(options, function (err, doc) {
            should.exist(err);
            err.should.equal('The selected database type is not yet supported');
        });
    });

    

    it('call process report', function() {
        options.connection.type = 'mysql';
        processReport(options, function (err, doc) {
            should.not.exist(err);
        });
    });
});

