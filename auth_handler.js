const fs = require("fs"),
  sqlite3 = require("sqlite3").verbose(),
  tc = require("./termcolors.js"),
  schemaFile = `${__dirname}/defaults/auth_schema.sql`,
  schema = fs.readFileSync(schemaFile, "utf8");

var db = new sqlite3.Database(`${__dirname}/logs/auth.db`);

db.serialize(function() {
  db.exec(schema, function(err) {
    if (err) {
      console.log(`[${getWholeDate()}] ! Error creating database!`);
      console.log(`[${getWholeDate()}] ! ${err}`);
      console.log(`[${getWholeDate()}] ! Likely already created!`);
    } else {
      console.log(`[${getWholeDate()}] > Created database`);
    }
  });
});

db.on("error", function(error) {
  console.log(`[${getWholeDate()}] ! ${error}`);
});

function getDate() {
  var d = new Date();
  var dateString = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  return dateString;
}

function getWholeDate() {
  var d = new Date();
  var dateString = `${d.getFullYear()}-${d.getMonth() +
    1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
  return dateString;
}

function getUnixDate() {
  return new Date().valueOf();
}

class auth_handler {

    authenticate(username, password, callback)    {

        var q = "SELECT username FROM user WHERE user_username = ? AND user_password = ?";

        db.run(q, [username, password], function(err, row)  {
            if(err) {
                console.log("!!! Auth Error");
                callback("!!! Auth Error");
            }   else if(row[0]) {
                console.log(row)
                callback(null, row)
            }   else    {
                console.log("!!! Invalid");
                callback("!!! Invalid");
            }
        })

    }

}

module.exports = auth_handler;
