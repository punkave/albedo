var json2csv = require('json2csv');
var mysql = require('mysql');
var fs = require('fs');

module.exports = {
   /**
   * Processes a report for the given options
   *
   * @param  {obj} options
   * @param  {function} callback
   */
  processReport: function(options, callback) {
    

    var err;

    if(options) {

      if(options.connection.type === "mysql") {

        var connection = mysql.createConnection({
        host: options.connection.host,
        user: options.connection.user,
        password: options.connection.password,
        database: options.connection.database
        });

        connection.query(options.query, function (err, rows, fields) {

        if (err) {

            callback(err);
        } else {

            var fields = Object.keys(rows[0]);

            json2csv({
                data: rows,
                fields: fields
            }, function (err, csv) {

                if (err) {
                    callback(err);
                } else {

                    var fileName =  options.name + "_";
                    fs.writeFile(options.location + "/" + fileName, csv, {'flags': 'wx'}, function (err) {
                        if (err) {
                            callback(err);
                        } else {

                           var reportInfo = {
                              name: fileName + '.csv',
                              path: options.location + '/'
                            }; 

                            callback(null, reportInfo);
                        }
                    });
                }
            });
          }
        });

        connection.end();

      }

      else {
        err = 'The selected database type is not yet supported';
        callback(err);
      }
    }

    else {
      err = 'processReport requires options, see documentation';
      callback(err);
    }
  }
};
