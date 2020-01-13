const   fs      = require("fs"),
        Logger  = require("./loghandler.js");

var logger = new Logger("Logreader");

class logreader    {
    
    constructor()    {
        logger = new Logger("Logreader");
        logger.info(3, "Setup", "Logreader configured");

        this.requestsCount  = 0;
        this.sessionsCount  = 0;
        this.days           = 0;
        this.sessions       = {};
        this.pageSources    = {};
        this.agents         = {};
        this.rawAgents      = {};
        this.refreshTimer   = setInterval(this.refreshData.bind(this), 300000);
        
        this.agentBrowser   = {};
        
        this.refreshData();
    }

    setLogLevel(logLevel)   {
        logger.setLogLevel(logLevel);
    }
    
    getDate() {
        var d = new Date();
        var dateString = `${d.getFullYear()}-${(d.getMonth() + 1)}-${d.getDate()}`;
        return dateString;
    }
    
    // Place new content in the middle of a string
    replaceBetween(original, start, end, content) {
        return original.substring(0, start) + content + original.substring(end);
    }
    
    escapeHTML(html)    {
        
        for(var index = 0; index < html.length; index++)    {
            switch(html.charAt(index))   {
                case "&":
                html = this.replaceBetween(html, index, index + 4, " ");
                break;
                case "<":
                html = this.replaceBetween(html, index, index + 3, " ");
                break;
                case ">":
                html = this.replaceBetween(html, index, index + 3, " ");
                break;
                case "\"":
                html = this.replaceBetween(html, index, index + 5, " ");
                break;
                case "\'":
                html = this.replaceBetween(html, index, index + 5, " ");
                break;
                case "/":
                html = this.replaceBetween(html, index, index + 5, " ");
                break;  
                default:
                break;
            }
        };
        
        return html;
    }
    
    async refreshData()   {
        this.requestsCount  = 0;
        this.sessionsCount  = 0;
        this.days           = 0;
        this.sessions       = {};
        this.pageSources    = {};
        this.agents         = {};
        this.rawAgents      = {};
        this.agentBrowser   = {};

        logger.info(2, "Analytics", "Refreshing data from logs");

        fs.readdirSync(__dirname + "/logs/").forEach(file => {
            if(file.startsWith("main-"))    {
                this.days++;
                
                var buff = fs.readFileSync(__dirname + "/logs/" + file, "utf8");
                var logs = buff.split('\n');
                // console.log(`Reading: ${file}`);
                logs.forEach(log => {

                    try {

                        if( ! (log == "") ) {
                            
                            log = JSON.parse(log);
                            if(log.type == "Request")   {
                                this.requestsCount++;
                                
                                if(this.sessions[log.req.session])   {
                                    this.sessions[log.req.session]++;
                                }   else    {
                                    this.sessions[log.req.session] = 1;
                                }
                                // console.log(log);
                                
                                if(! ( log.req.headers.referer )) log.req.headers.referer = "unknown / external";
                                
                                if( this.pageSources[log.route] && this.pageSources[log.route][log.req.headers.referer] ) {
                                    this.pageSources[log.route][log.req.headers.referer]++;
                                }   else if( this.pageSources[log.route] && ! ( this.pageSources[log.route][log.req.headers.referer] ) )    {
                                    this.pageSources[log.route][log.req.headers.referer] = 1;
                                }   else    {
                                    this.pageSources[log.route] = { [log.req.headers.referer]: 1 };
                                }
                                
                                if(! ( log.req.headers['user-agent'] )) {
                                    var tempAgent = "Unknown Agent";
                                    log.req.headers['user-agent'] = "Unknown Agent";
                                }   else    {
                                    var tempAgent = this.escapeHTML(log.req.headers['user-agent']);
                                }
                                
                                if(this.agents[tempAgent])   {
                                    this.agents[tempAgent]++;
                                    this.rawAgents[log.req.headers['user-agent']]++;
                                }   else    {
                                    this.agents[tempAgent] = 1;
                                    this.rawAgents[log.req.headers['user-agent']] = 1;
                                }

                                this.procAgents(log.req.headers['user-agent']);
                            }
                        
                        }
                    }   catch(e)    {
                        logger.log(5, "Analytics", `Error reading log: ${e}`);
                    }
                })
            }   else    {
                // console.log(`Skipping: ${file}`);
            }
            
        });
        
        for(var sesh in this.sessions){
            this.sessionsCount++;
            // console.log(sesh + ": " + no);
        }
        
        // console.log(this.agentBrowser);

    }
    
    procAgents(agent)  {
        
        var bFirefox        = new RegExp(/Firefox\//);
        var bSeamonkey      = new RegExp(/Seamonkey\//);
        var bChrome         = new RegExp(/Chrome\//);
        var bChromium       = new RegExp(/Chromium\//);
        var bSafari         = new RegExp(/Safari\//);
        var bOPR            = new RegExp(/OPR\//);
        var bOpera          = new RegExp(/Opera\//);
        var bIE             = new RegExp(/; MSIE /);
        var bBot            = new RegExp(/bot/i);
        var bValidation     = new RegExp(/validation server/);
        var bPython         = new RegExp(/python-requests/);
        var bPythonUrllib   = new RegExp(/Python-urllib/i);
        var bCurl           = new RegExp(/curl\//);
        var detected        = "";
        
        // As defined by https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
        
        if( bFirefox.test(agent) && !(bSeamonkey.test(agent)) )    {
            detected = "Firefox";
        }   else if( bSeamonkey.test(agent) )   {
            detected = "Seamonkey";
        }   else if( bChrome.test(agent) && !( bChromium.test(agent) ) )   {
            detected = "Chrome";
        }   else if( bChromium.test(agent) )    {
            detected = "Chromium";
        }   else if( bSafari.test(agent) && !( bChrome.test(agent) && !(bChromium.test(agent))) )   {
            detected = "Safari";
        }   else if( ( bOpera.test(agent) || bOPR.test(agent) ) )   {
            detected = "Opera";
        }   else if( bIE.test(agent) )  {
            detected = "Internet Explorer"
        }   else if( bBot.test(agent) ) {
            detected = "Bot"
        }   else if( bValidation.test(agent) ) {
            detected = "Validation Server"
        }   else if( bPython.test(agent) || bPythonUrllib.test(agent)) {
            detected = "Python"
        }   else if( bCurl.test(agent) ) {
            detected = "Curl"
        }   else    {
            detected = "Unknown"
            // console.log(agent);
        }
        
        if(this.agentBrowser[detected])   {
            this.agentBrowser[detected]++;
        }   else    {
            this.agentBrowser[detected] = 1;
        }
        
        
    }
    
    getDaysServing()   {
        return this.days;
    }
    
    getRequestsCount()   {
        return this.requestsCount;
    }
    
    getSessionsCount()   {
        return this.sessionsCount;
    }
    
    getSessions()   {
        return this.sessions;
    }
    
    getAverageRequests()    {
        return (this.requestsCount / this.days);
    }
    
    getAverageSessions()    {
        return (this.sessionsCount / this.days);
    }
    
    getAgents() {
        return this.agentBrowser;
    }
    
}

module.exports = logreader;