var json2csv = require('json2csv');
var mysql      = require('mysql');
var commands = require('commander');
var fs = require('fs');

var orders;

commands
  .version('0.0.0')
  .option('-o, --orders [filename]', 'Process report orders from config file [filename]')
  .parse(process.argv);

if(!commands.orders){
	console.log('Report Maker requires orders to process reports, see --help.');

}
else{

	orders = require('./' + commands.orders);
	processOrders(orders);
}

function processOrders(orders){

	var connection = mysql.createConnection({
  		host     : orders.host,
  		user     : orders.user,
  		password : orders.password,
  		database : orders.database
	});

	connection.connect();

	connection.query(orders.query, function(err, rows, fields) {

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

					fs.writeFile(orders.report_dir + "/" + orders.report_name + "_" + Date.now(), csv, function(err) {
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