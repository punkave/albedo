albedo
============

node.js module for generating cvs reports from databases

### How to use:

call:

`albedo.processReport({options}, callback(err, report) {} );`

The options object takes the following parameters:
```javascript
{
  location: "/path/to/folder/for/report",
  name: "report_name",
  query: "SELECT * FROM ALBEDO",
  connection: {
    type: "mysql",
    host: "localhost",
    user: "root",
    password: "password",
    database: "bigdata"
  },
  removeOlderThan: "5",
  process_row: function(row) {
    row.foo = 'bar';
    return row;
  }
}
```

All options are required except for `removeOlderThan` and `process_row`.

`removeOlderThan` will allow Albedo to remove any reports matching the same name that are older than the specified number of days. By default, it will not remove any reports if this value is not specified.
`process_row` can be either a function or an array of functions, which will be used to modify data after it comes back from the database. For example, you may want to use it to separate JSON fields into two separate columns in the CSV output. Each function takes in a row as input, and must return the modified row.

The `report` object in the  callback will return a report object if successful, which contains the following information:

```javascript
{
  name: "report_name_YYYY-MM-DD_HH-mm-ss.csv",
  path: "/path/to/folder/for/report"
}
```

Otherwise it will return an error string.

