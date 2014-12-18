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
  removeOlderThan: "5"
}
```

All options are required except for `removeOlderThan`.

`removeOlderThan` will allow Albedo to remove any reports matching the same name that are older than the specified number of days. By default, it will not remove any reports if this value is not specified.

The `report` object in the  callback will return a report object if successful, which contains the following information:

```javascript
{
  name: "report_name_YYYY-MM-DD_HH-mm-ss.csv",
  path: "/path/to/folder/for/report"
}
```

Otherwise it will return an error string.

