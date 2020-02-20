const fs = require("fs"),
  sqlite3 = require("sqlite3").verbose(),
  Logger = require("./loghandler.js");

var logger = new Logger("Logreader");

var db = new sqlite3.Database(`${__dirname}/logs/logs.db`);

db.on("error", function(error) {
  console.log(`[${getWholeDate()}] ! ${error}`);
});

class logreader {
  constructor() {
    logger = new Logger("Logreader");
    logger.info(3, "Setup", "Logreader configured");
  }

  setLogLevel(logLevel) {
    logger.setLogLevel(logLevel);
  }

  getDate() {
    var d = new Date();
    var dateString = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    return dateString;
  }

  getUnixDate() {
    return new Date().valueOf();
  }

  getEverything(callback) {
    var q = `SELECT * FROM log`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else {
        callback(null, rows);
      }
    });
  }

  getDaysServing(callback) {
    var earliest = 0;

    var q = `SELECT * FROM log ORDER BY log_time ASC LIMIT 1`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else if(!rows[0])   {
        callback("No data");
      } else {
        earliest = rows[0]["log_time"];
        // console.log(earliest);

        var delta = Math.abs(earliest - new Date().valueOf()) / 1000;
        var days = Math.floor(delta / 86400);
        // delta -= days * 86400;

        callback(null, days);
      }
    });
  }

  getRequestsCount(callback) {
    var q = `SELECT COUNT(log_request) as requests FROM log WHERE log_type = 'Request' AND log_msg_short = 'New request'`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else if(!rows[0])   {
        callback("No data");
      } else {
        callback(null, rows[0]["requests"]);
      }
    });
  }

  getSessionsCount(callback) {
    var q = `SELECT COUNT(DISTINCT log_session) as sessions FROM log`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else if(!rows[0])   {
            callback("No data");
      } else {
        callback(null, rows[0]["sessions"]);
      }
    });
  }

  getSessions(callback) {
    var q = `SELECT DISTINCT log_session FROM log`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else {
        callback(null, rows);
      }
    });
  }

  getAverageRequests(callback) {
    var self = this;

    this.getRequestsCount(function(err, reqs) {
      if (!err) {
        self.getDaysServing(function(err, days) {
          if (!err) {
            if (days > 0) {
              callback(null, reqs / days);
            } else {
              callback(null, reqs);
            }
          }
        });
      } else {
        callback(err);
      }
    });
  }

  getAverageSessions(callback) {
    var self = this;

    this.getSessionsCount(function(err, sesh) {
      if (!err) {
        self.getDaysServing(function(err, days) {
          if (!err) {
            if (days > 0) {
              callback(null, sesh / days);
            } else {
              callback(null, sesh);
            }
          }
        });
      } else {
        callback(err);
      }
    });
  }

  getAgents(callback) {
    var q = `SELECT COUNT(log_agent), log_agent FROM log GROUP BY log_agent`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else {
        callback(null, rows);
      }
    });
  }

  getLevels(callback) {
    var q = `SELECT * FROM log_level`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else {
        callback(null, rows);
      }
    });
  }

  getRoutes(callback) {
    var q = `SELECT COUNT(log_route), log_route FROM log GROUP BY log_route`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else {
        callback(null, rows);
      }
    });
  }

  getFailedRoutes(callback) {
    var q = `SELECT * FROM log WHERE log_msg_short LIKE 'Unknown file requested: %'`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else {
        callback(null, rows);
      }
    });
  }
}

module.exports = logreader;
