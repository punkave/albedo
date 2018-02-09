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

    if (options.connection.type !== 'mysql') {
      return callback('The selected database type is not yet supported');
    }

    const connection = mysql.createConnection({
      host: options.connection.host,
      user: options.connection.user,
      password: options.connection.password,
      database: options.connection.database,
      insecureAuth: true,
    });

    connection.query(options.query, (err, rows) => {
      if (err) {
        return callback(err);
      }
      if (rows.length === 0) {
        return callback('No records for query');
      }

      let processedRows = rows;
      // Allow calling code to pass either a function or an array of functions
      // with which to process each row of data
      if (_.isArray(options.process_row)) {
        _.each(options.process_row, (func) => {
          processedRows = _.map(processedRows, func);
        });
      } else if (_.isFunction(options.process_row)) {
        processedRows = _.map(processedRows, options.process_row);
      }

      return json2csv(
        {
          data: processedRows,
          preserveNewLinesInValues: true,
        },
        (err1, csv) => {
          if (err1) {
            return callback(err1);
          }

          if (options.hasOwnProperty('removeOlderThan')) {
            rmDir(options.location, options);
          }
          // make the new report
          const fileName = `${options.name}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
          fs.writeFile(`${options.location}/${fileName}`, csv, (err2) => {
            if (err2) {
              return callback(err2);
            }
            const reportInfo = {
              name: fileName,
              path: `${options.location}/`,
            };

            return callback(null, reportInfo);
          });
        }
      );
    });

    connection.end();
  },
};

function rmDir(dirPath, options) {
  // TODO: rejigger this whole thing to operate async
  let files;
  try {
    files = fs.readdirSync(dirPath);
  } catch (e) {
    console.err('Could not delete files');
    return;
  }

  files.forEach((fileName) => {
    const filePath = `${dirPath}/${fileName}`;
    if (fs.statSync(filePath).isFile()) {
      const now = moment().unix();
      const daysAgo = now - (parseInt(options.removeOlderThan, 10) * 86400);
      const fileTime = moment(fs.statSync(filePath).mtime).unix();
      if (fileName.substring(0, options.name.length) === options.name) {
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
  });
}
