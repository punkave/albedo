const json2csv = require('json2csv');
const mysql = require('mysql');
const fs = require('fs');
const moment = require('moment');
const _ = require('underscore');

module.exports = {
  /**
   * Processes a report for the given options
   *
   * @param  {obj} options
   * @param  {function} callback
   */
  processReport(options, callback) {
    if (!options) {
      return callback('processReport requires options, see documentation');
    }

    if (options.connection.type != 'mysql') {
      return callback('The selected database type is not yet supported');
    }

    const connection = mysql.createConnection({
      host: options.connection.host,
      user: options.connection.user,
      password: options.connection.password,
      database: options.connection.database,
      insecureAuth: true,
    });

    connection.query(options.query, (err, rows, fields) => {
      if (err) {
        return callback(err);
      }
      if (rows.length == 0) {
        return callback('No records for query');
      }

      // Allow calling code to pass either a function or an array of functions
      // with which to process each row of data
      if (_.isArray(options.process_row)) {
        _.each(options.process_row, (func) => {
          rows = _.map(rows, func);
        });
      } else if (_.isFunction(options.process_row)) {
        rows = _.map(rows, options.process_row);
      }

      return json2csv(
        {
          data: rows,
          preserveNewLinesInValues: true,
        },
        (err, csv) => {
          if (err) {
            return callback(err);
          }

          if (options.hasOwnProperty('removeOlderThan')) {
            rmDir(options.location, options);
          }
          // make the new report
          const fileName = `${options.name}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
          fs.writeFile(`${options.location}/${fileName}`, csv, (err) => {
            if (err) {
              return callback(err);
            }
            const reportInfo = {
              name: fileName,
              path: `${options.location}/`,
            };

            callback(null, reportInfo);
          });
        },
      );
    });

    connection.end();
  },
};

function rmDir(dirPath, options) {
  // TODO: rejigger this whole thing to operate async
  try { var files = fs.readdirSync(dirPath); } catch (e) { callback(e); }

  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const filePath = `${dirPath}/${files[i]}`;
      const fileName = files[i];
      if (fs.statSync(filePath).isFile()) {
        const now = moment().unix();
        const daysAgo = now - (parseInt(options.removeOlderThan) * 86400);
        const fileTime = moment(fs.statSync(filePath).mtime).unix();
        if (fileName.substring(0, options.name.length) == options.name) {
          if (fileTime < daysAgo) {
            fs.unlinkSync(filePath);
            console.log(`deleted: ${filePath}`);
          } else {
            console.log(`kept: ${filePath}`);
          }
        }
      } else {
        rmDir(filePath, options);
      }
    }
  }
}
