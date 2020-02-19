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

  getEverything(callback)   {
    var q = `SELECT * FROM log`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else {
        callback(null, rows);
      }
    });
  }

  getDaysServing() {
    return this.days;
  }

  getRequestsCount() {
    return this.requestsCount;
  }

  getSessionsCount() {
    return this.sessionsCount;
  }

  getSessions() {
    return this.sessions;
  }

  getAverageRequests() {
    return this.requestsCount / this.days;
  }

  getAverageSessions() {
    return this.sessionsCount / this.days;
  }

  getAgents(callback) {
    var q = `SELECT COUNT(log_agent) FROM log GROUP BY log_agent`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else {
        callback(null, rows);
      }
    });
  }

  getLevels(callback)   {
    var q = `SELECT * FROM log_level`;

    db.all(q, function(err, rows) {
      if (err) {
        callback(err);
      } else {
        callback(null, rows);
      }
    });
  }

  getPages() {
    return this.pages;
  }

  getFailedPages() {
    return this.failedPages;
  }
}

module.exports = logreader;
