const   fs = require('fs'),
        tc = require("./termcolors.js");;

class logger    {

    constructor(newName)    {
        this.NAME       = newName;
        this.LOGLEVEL   = 1;
        this.LOGDIR     = `${__dirname}/logs`;

        if (!fs.existsSync(this.LOGDIR)){
            fs.mkdirSync(this.LOGDIR);
            this.logConfigChange( { "name": this.NAME, "config": "Created log dir", loglevel: this.LOGLEVEL } );
        }

        var msg = { "name": this.NAME, 
                    "config": "Created", 
                    "loglevel": this.LOGLEVEL,
                    "logdir": this.LOGDIR };

        this.logConfigChange(msg);

    }

    writeLog(log, file) {
        fs.appendFile(`${this.LOGDIR}/${file}-${this.getDate()}.log`, `${log}\n`, function (err) {
            if(err) {
                console.error(`Error writing log to file: ${err}`);
            }
        });
    }

    getDate() {
        var d = new Date();
        var dateString = `${d.getFullYear()}-${(d.getMonth() + 1)}-${d.getDate()}`;
        return dateString;
    }

    getWholeDate() {
        var d = new Date();
        var dateString = `${d.getFullYear()}-${(d.getMonth() + 1)}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
        return dateString;
    }

    setLogLevel(newLevel) {
        this.LOGLEVEL = newLevel;
        var msg = { "name": this.NAME, "config": "Log level", loglevel: this.LOGLEVEL };
        this.logConfigChange(msg);
    }

    setLogDir(newDir)   {
        this.LOGDIR = newDir;
        var msg = { "name": this.NAME, "config": "Log dir", logdir: this.LOGDIR };
        this.logConfigChange(msg);
    }

    logConfigChange(log)  {
        log.time = this.getWholeDate();
        var out = JSON.stringify(log);
        // console.log(out);

        // console.log(`[${JSON.stringify(log["time"]).replace(/\"/g, "").padEnd(19, " ")}] ${tc.BG_BLUE}${JSON.stringify(log["name"]).replace(/\"/g, "").padEnd(13, " ")}${tc.RESET} ${JSON.stringify(log)}`);

        this.writeLog(out, "setup");
    }

    info(level, type, msg)  {
        var log = { 
            "name": this.NAME,
            "time": this.getWholeDate(),
            "level": level,
            "type": type,
            "msg": msg
        };

        // var out = JSON.stringify(log);
        // console.log(out);

        console.log(`[${JSON.stringify(log["time"]).replace(/\"/g, "").padEnd(19, " ")}] ${tc.BG_GREEN}${JSON.stringify(log["level"]).padStart(2, " ")}${tc.RESET} ${tc.BG_BLUE}${JSON.stringify(log["name"]).replace(/\"/g, "").padEnd(10, " ")}${tc.RESET} ${tc.BG_GREEN}${JSON.stringify(log["type"]).replace(/\"/g, "").padEnd(10, " ")}${tc.RESET} ${log.msg}`);

    }

    log(level, type, msg, req)  {
        var log = { 
            "name": this.NAME,
            "time": this.getWholeDate(),
            "level": level,
            "type": type,
            "msg": msg
        };

        if(arguments.length >= 4) {
            log.route = req._pathname;
            log.ip = req._ip;
            log.req = {
                "session": req._session,
                "headers": req.headers,
            };
        };

        var out = JSON.stringify(log);
        // console.log(out);

        console.log(`[${JSON.stringify(log["time"]).replace(/\"/g, "").padEnd(19, " ")}] ${tc.BG_GREEN}${JSON.stringify(log["level"]).padStart(2, " ")}${tc.RESET} ${tc.BG_BLUE}${JSON.stringify(log["name"]).replace(/\"/g, "").padEnd(10, " ")}${tc.RESET} ${tc.BG_GREEN}${JSON.stringify(log["type"]).replace(/\"/g, "").padEnd(10, " ")}${tc.RESET} ${log.msg}`);

        this.writeLog(out, "main");
    }
  
}

module.exports = logger;