const { Transform } = require('stream');
const CSVTransform = require('json2csv').Transform;
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

    // set up input, csv, and output streams
    const fileName = `${options.name}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
    const outputPath = `${options.location}/${fileName}`;

    const input = connection.query(options.query).stream({ highWaterMark: 64 });
    const output = fs.createWriteStream(outputPath, { encoding: 'utf8' });
    const json2csv = new CSVTransform(null, { objectMode: true });

    // handle row transformations
    let empty = true;
    const rowTransform = new Transform({
      writableObjectMode: true,
      readableObjectMode: true,

      transform(chunk, enc, handler) {
        try {
          let row = chunk;
          if (_.isArray(options.process_row)) {
            _.each(options.process_row, (func) => {
              row = func(row);
            });
          } else if (_.isFunction(options.process_row)) {
            row = options.process_row(row);
          }
          handler(null, row);
          empty = false;
        } catch (e) {
          handler(e);
        }
      },
    });

    // route errors from streams to callback
    let wasError = false;
    function forwardError(e) {
      wasError = true;
      callback(e);
    }
    input.on('error', forwardError);
    rowTransform.on('error', forwardError);
    json2csv.on('error', forwardError);
    output.on('error', forwardError);

    // route output stream finish event to callback
    output.on('close', () => {
      if (wasError) {
        // suppress final report info callback on errors
        return;
      }
      if (empty) {
        // don't leave empty report files if there were no results
        fs.unlink(outputPath, (e) => {
          if (e) {
            callback(`Failed to remove empty report file: ${e}`);
          }
        });
        callback('No records for query');
        return;
      }
      // prune older reports only after successful export
      if (options.hasOwnProperty('removeOlderThan')) {
        rmDir(options.location, options, outputPath);
      }
      // finally return new report info
      const reportInfo = {
        name: fileName,
        path: `${options.location}/`,
      };
      callback(null, reportInfo);
    });

    // stream query results through processing pipeline
    input.pipe(rowTransform).pipe(json2csv).pipe(output);
    connection.end();
  },
};

function rmDir(dirPath, options, outputPath) {
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
    if (filePath === outputPath) {
      console.log(`ignoring: ${filePath}`);
      return;
    }
    if (fs.statSync(filePath).isFile()) {
      const now = moment().unix();
      const daysAgo = now - (parseInt(options.removeOlderThan, 10) * 86400);
      const fileTime = moment(fs.statSync(filePath).mtime).unix();
      // get the full name of the report from the file by removing the datetime and extension
      if (fileName.slice(0, 0-'_YYYY-MM-DD_HH-mm-ss.csv'.length) === options.name) {
        if (fileTime < daysAgo) {
          fs.unlinkSync(filePath);
          console.log(`deleted: ${filePath}`);
        } else {
          console.log(`kept: ${filePath}`);
        }
      }
    } else {
      rmDir(filePath, options, outputPath);
    }
  });
}
