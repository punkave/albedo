report-maker
============

node.js app for generating cvs reports from mysql databases

### How to use

Run report-marker.js with the flag "--config"

where config = your config file for a given report

### Configuration

* `info`: information about this config.
* `report_name`: The name of the report, this will be used as the prefix for the report filename.
* `host`: Hostname of the MySQL server.
* `user`: username for the DB.
* `password`: password for the DB.
* `database`: DB name.
* `query`: The query you want to run for the report.
* `report_dir`: Location you want the report saved.

