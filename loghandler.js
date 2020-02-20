const fs = require("fs"),
  sqlite3 = require("sqlite3").verbose(),
  tc = require("./termcolors.js"),
  schemaFile = `${__dirname}/defaults/schema.sql`,
  schema = fs.readFileSync(schemaFile, "utf8");

var stdin = process.openStdin();

var curInput = "";
var curPos = 0;

stdin.addListener("data", function(d) {
  if (d.toString().charCodeAt(0) == 0x7f || d.toString().charCodeAt(0) == 0x8) {
    // Backspace key
    if (curPos == curInput.length) {
      curInput = curInput.substring(0, curInput.length - 1);
    } else {
      curILeft = curInput.substring(0, curPos - 1);
      curIRight = curInput.substring(curPos, curInput.length);
      curInput = curILeft + curIRight;
    }
    if (curPos > 0) curPos--;
    // console.log(curInput);
  } else if (d.toString().charCodeAt(0) == 0xd) {
    // Enter key
    // console.log("\nFinal:"+curInput+"\tCur: "+curPos);
    curInput = "";
    curPos = 0;
  } else if (d == "\u001B\u005B\u0044") {
    // Left arrow
    if (curPos > 0) curPos--;
  } else if (d == "\u001B\u005B\u0043") {
    // Right arrow
    if (curPos < curInput.length) curPos++;
  } else {
    // Char input
    curILeft = curInput.substring(0, curPos);
    curIRight = curInput.substring(curPos, curInput.length);
    curInput = curILeft + d.toString().trim() + curIRight;
    curPos++;
  }
  // console.log("\r"+curInput+"\tCur: "+curPos+"\tLen: "+curInput.length);
});

var db = new sqlite3.Database(`${__dirname}/logs/logs.db`);

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

class logger {
  constructor(newName) {
    this.NAME = newName;
    this.LOGLEVEL = 1;
    this.LOGDIR = `${__dirname}/logs`;

    if (!fs.existsSync(this.LOGDIR)) {
      fs.mkdirSync(this.LOGDIR);
      this.logConfigChange({
        name: this.NAME,
        config: "Created log dir",
        loglevel: this.LOGLEVEL
      });
    }

    var msg = {
      name: this.NAME,
      config: "Created",
      loglevel: this.LOGLEVEL,
      logdir: this.LOGDIR
    };

    this.logConfigChange(msg);
  }

  procAgent(agent) {
    if (!agent) {
      return null;
    }

    var bFirefox = new RegExp(/Firefox\//);
    var bSeamonkey = new RegExp(/Seamonkey\//);
    var bChrome = new RegExp(/Chrome\//);
    var bChromium = new RegExp(/Chromium\//);
    var bSafari = new RegExp(/Safari\//);
    var bOPR = new RegExp(/OPR\//);
    var bOpera = new RegExp(/Opera\//);
    var bIE = new RegExp(/; MSIE /);
    var bBot = new RegExp(/bot/i);
    var bValidation = new RegExp(/validation server/);
    var bPython = new RegExp(/python-requests/);
    var bPythonUrllib = new RegExp(/Python-urllib/i);
    var bCurl = new RegExp(/curl\//);
    var detected = "";

    // As defined by https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent

    if (bFirefox.test(agent) && !bSeamonkey.test(agent)) {
      detected = "Firefox";
    } else if (bSeamonkey.test(agent)) {
      detected = "Seamonkey";
    } else if (bChrome.test(agent) && !bChromium.test(agent)) {
      detected = "Chrome";
    } else if (bChromium.test(agent)) {
      detected = "Chromium";
    } else if (
      bSafari.test(agent) &&
      !(bChrome.test(agent) && !bChromium.test(agent))
    ) {
      detected = "Safari";
    } else if (bOpera.test(agent) || bOPR.test(agent)) {
      detected = "Opera";
    } else if (bIE.test(agent)) {
      detected = "Internet Explorer";
    } else if (bBot.test(agent)) {
      detected = "Bot";
    } else if (bValidation.test(agent)) {
      detected = "Validation Server";
    } else if (bPython.test(agent) || bPythonUrllib.test(agent)) {
      detected = "Python";
    } else if (bCurl.test(agent)) {
      detected = "Curl";
    } else {
      detected = "Unknown";
      // console.log(agent);
    }

    return detected;
  }

  writeToConsole(log) {
    process.stdout.write("\r");
    console.log(
      `[${JSON.stringify(log["time"])
        .replace(/\"/g, "")
        .padEnd(19, " ")}] ${tc.BG_GREEN}${JSON.stringify(
        log["level"]
      ).padStart(2, " ")}${tc.RESET} ${tc.BG_BLUE}${JSON.stringify(log["name"])
        .replace(/\"/g, "")
        .padEnd(10, " ")}${tc.RESET} ${tc.BG_GREEN}${JSON.stringify(log["type"])
        .replace(/\"/g, "")
        .padEnd(10, " ")}${tc.RESET} ${log.msg}`
    );
    process.stdout.write(curInput);
  }

  writeLog(log, file) {
    fs.appendFile(
      `${this.LOGDIR}/${file}-${getDate()}.log`,
      `${log}\n`,
      function(err) {
        if (err) {
          console.error(`Error writing log to file: ${err}`);
        }
      }
    );

    var q = `INSERT INTO log (log_source, log_time, log_level, log_type, log_msg_short, log_route, log_ip, log_session, log_agent, log_request) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    log = JSON.parse(log);

    var agent,
      session = null;

    try {
      agent = this.procAgent(log["req"]["headers"]["user-agent"]);
      session = log["req"]["session"];
    } catch (e) {
      agent = null;
      session = null;
    }

    if (!log["config"]) {
      db.run(
        q,
        [
          log["name"],
          getUnixDate(),
          log["level"],
          log["type"],
          log["msg"],
          log["route"],
          log["ip"],
          session,
          agent,
          JSON.stringify(log["req"])
        ],
        function(err) {
          if (err) {
            console.log(
              `[${getWholeDate()}] ! Error inserting data record into log database:`
            );
            console.log(`[${getWholeDate()}] ! ${err}`);
          }
        }
      );
    }
  }

  setLogLevel(newLevel) {
    this.LOGLEVEL = newLevel;
    var msg = { name: this.NAME, config: "Log level", loglevel: this.LOGLEVEL };
    this.logConfigChange(msg);
  }

  setLogDir(newDir) {
    this.LOGDIR = newDir;
    var msg = { name: this.NAME, config: "Log dir", logdir: this.LOGDIR };
    this.logConfigChange(msg);
  }

  logConfigChange(log) {
    log.time = getWholeDate();
    var out = JSON.stringify(log);
    // console.log(out);

    // console.log(`[${JSON.stringify(log["time"]).replace(/\"/g, "").padEnd(19, " ")}] ${tc.BG_BLUE}${JSON.stringify(log["name"]).replace(/\"/g, "").padEnd(13, " ")}${tc.RESET} ${JSON.stringify(log)}`);

    this.writeLog(out, "setup");
  }

  info(level, type, msg) {
    var log = {
      name: this.NAME,
      time: getWholeDate(),
      level: level,
      type: type,
      msg: msg
    };

    // var out = JSON.stringify(log);
    // console.log(out);

    this.writeToConsole(log);
  }

  log(level, type, msg, req) {
    var log = {
      name: this.NAME,
      time: getWholeDate(),
      level: level,
      type: type,
      msg: msg
    };

    if (arguments.length >= 4) {
      log.route = req._pathname;
      log.ip = req._ip;
      log.req = {
        session: req._session,
        headers: req.headers
      };
    }

    var out = JSON.stringify(log);
    // console.log(out);

    this.writeToConsole(log);

    this.writeLog(out, "main");
  }
}

module.exports = logger;
