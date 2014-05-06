var json2csv = require('json2csv');
var mysql      = require('mysql');
var commands = require('commander');
var fs = require('fs');

var config;

commands
  .version('0.0.0')
  .option('-o, --config [filename]', 'Process report from config file [filename]')
  .parse(process.argv);

if(!commands.config){
	console.log('Report Maker requires a config to process a report, see --help.');

}
else{

	config = require('./' + commands.config);
	processReport(config);
}

function processReport(config){

	var connection = mysql.createConnection({
  		host     : config.host,
  		user     : config.user,
  		password : config.password,
  		database : config.database
	});

	connection.connect();

	connection.query(config.query, function(err, rows, fields) {

		if (err) {
        	console.log(err);
    	}
    	else {

			var fields = Object.keys(rows[0]);

  			json2csv({data: rows, fields: fields}, function(err, csv) {
  	
  				if (err) {
        			console.log(err);
    			}
    			else {

					fs.writeFile(config.report_dir + "/" + config.report_name + "_" + Date.now(), csv, function(err) {
    					if(err) {
        					console.log(err);
    					} else {
        					console.log("Report created successfully!");
    					}
					});
				} 
			});
		}
	});

	connection.end();
}