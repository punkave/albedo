var json2csv = require('json2csv');
var mysql = require('mysql');
var fs = require('fs');
var moment = require('moment');

module.exports = {
   /**
   * Processes a report for the given options
   *
   * @param  {obj} options
   * @param  {function} callback
   */
  processReport: function(options, callback) {

    if (!options) {
      return callback('processReport requires options, see documentation');
    }

    if (options.connection.type != "mysql") {
      return callback('The selected database type is not yet supported');
    }

    var connection = mysql.createConnection({
      host: options.connection.host,
      user: options.connection.user,
      password: options.connection.password,
      database: options.connection.database,
      insecureAuth: true
    });

    connection.query(options.query, function (err, rows, fields) {

      if (err) {
        return callback(err);
      }
      if (rows.length == 0) {
        return callback('No records for query');
      }
      var fields = Object.keys(rows[0]);

      json2csv(
        {
          data: rows,
          fields: fields
        },
        function (err, csv) {
          if (err) {
            return callback(err);
          }

          if(options.removeOlderThan) {
            rmDir(options.location, options);
          }
          //make the new report
          var fileName =  options.name + "_" + moment().format("YYYY-MM-DD_HH-mm-ss") + '.csv';
          fs.writeFile(options.location + "/" + fileName, csv, function (err) {
            if (err) {
              return callback(err);
            }
            var reportInfo = {
              name: fileName,
              path: options.location + '/'
            };

            callback(null, reportInfo);
          });
        });
    });

    connection.end();

  }
};

function rmDir(dirPath, options) {
  // TODO: rejigger this whole thing to operate async
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { callback(e); }

  if (files.length > 0) {
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      var fileName = files[i];
      if (fs.statSync(filePath).isFile()) {
        var now = moment().unix();
        var daysAgo = now - (parseInt(options.removeOlderThan) * 86400);
        var fileTime = moment(fs.statSync(filePath).mtime).unix();
        if(fileName.substring(0, options.name.length) == options.name) {
          if (fileTime  < daysAgo)
          {
            fs.unlinkSync(filePath);
            console.log("deleted: " + filePath);
          }
          else{
            console.log("kept: " + filePath);
          }
        }
      }
      else {
        rmDir(filePath,options);
      }
    }
  }
};