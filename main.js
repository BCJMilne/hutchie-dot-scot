const url   = require('url'),
fs          = require('fs'),
http        = require('http'),
Logger      = require("./loghandler.js"),
Logreader   = require("./logreader.js"),
handler     = require("./handler.js"),
readline    = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

if(!fs.existsSync(__dirname + "/constants.js"))    {
    fs.copyFileSync(__dirname + "/defaults/constants.example.js", __dirname + "/constants.js", (err) => {
        if (err) throw err;
    });
}

const constants  = require("./constants.js");

var port    = 3344,
htmlDir     = __dirname + "/public",
incDir      = __dirname + "/includes/",
logDir      = __dirname + "/logs";

var argv        = process.argv.slice(2);

var logLevel    = 3;

const logger    = new Logger("Main");
const logreader = new Logreader();

function showHelp() {
    console.log("This will, eventually, be the help page.");
}

function splitArgv(arg) {
    var parts = arg.split('=');
    return parts;
}

function jsonError(text)
{
    var json = JSON.stringify( { error: text } );
    logger.log(5, "API", json);
    return(json);
}

if(constants.HTTP_PORT) { port = constants.HTTP_PORT; }

for(var x = 0; x < argv.length; x++)   {
    var tempArg = splitArgv(argv[x]);
    switch(tempArg[0]) {
        case "--logging-level":
        if(tempArg[1])  {
            logLevel = tempArg[1];
        }   else    {
            logger.log(6, "Setup", `Missing value for ${tempArg[0]}, using default`);
        }
        break;
        case "--port":
        if(tempArg[1])  {
            port = tempArg[1];
        }   else    {
            logger.log(6, "Setup", `Missing value for ${tempArg[0]}, using default: ${port}`);
        }
        case "--help":
        showHelp();
        process.exit(0);
        case "-h":
        showHelp();
        process.exit(0);
    }
}

logger.setLogLevel(logLevel);
logger.setLogDir(logDir);

logreader.setLogLevel(logLevel);

handler.setHtmlDir(htmlDir);
handler.setIncDir(incDir);
handler.setLogLevel(logLevel);

logger.info(1, "Setup", `Variables loaded`);

function getWholeDate() {
    var d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1)}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}

function parseCookies(req) {
    var list = {},
    rc = req.headers.cookie;
    
    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    
    return list;
}

// Generate a new session ID
// Form:
// xxxxx-xxxxx-xxxxx-xxxxx-[datetime in base64]
function getNewSessionId() {
    var id               = '',
    idPiece          = '',
    length           = 5,
    characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    charactersLength = characters.length;
    
    for( var x = 0; x < length; x++)    {
        idPiece = '';
        for( var i = 0; i < length; i++ ) {
            idPiece += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        if(x != 4)  {
            id = id += idPiece + "-";
        }   else    {
            id = id += idPiece;
        }
    }
    
    
    id += `-${Buffer.from(getWholeDate()).toString('base64')}`;
    
    return id;
}

// Figure out if the client has an existing session or we 
// need to assign a new session id
function processSession(req, callback)   {
    try {
        var cookies = parseCookies(req);
        if(cookies.session == undefined)    {
            logger.info(1, "Session", "Processing new session");
            var sessionId = getNewSessionId();
            logger.info(2, "Session", `New session logged: ${sessionId}`);
            callback(false, sessionId);
        }   else    {
            callback(true, cookies.session);
        }
    }   catch(err)   {
        logger.log(6, "Session", `Error encountered while processing session:\n ${err}`);
        callback(true, "XXX");
    }
}

// Get the most accurate IP address
function getIp(req)    {
    if(req.headers['x-forwarded-for'])    {
        var clientIp  = req.headers['x-forwarded-for'].split(',')[0];
    }   else if(req.headers['X-Real-IP'])   {
        var clientIp = req.headers['X-Real-IP'];
    }   else    {
        var clientIp = req.connection.remoteAddress;
    }
    return clientIp;
}

//
// Main server which handles UI and API calls
//

http.createServer(function (req, res)  {
    try {
        var urlObj    = new url.URL(`http://test.test${req.url}`);
        
        req._pathname = urlObj.pathname,
        req._tokens   = req._pathname.split("/");
        req._ip       = getIp(req);
        
        // res.setHeader('Content-Security-Policy', `default-src 'self' https://*.hutchie.scot/ 'unsafe-inline'; object-src 'none';`);
        
        processSession(req, function(exists, sessionId)   {
            if( ! (exists)) {
                res.setHeader('Set-Cookie', `session=${sessionId};Path=/`);
            }
            req._session = sessionId;
        });
        logger.log(2, "Request", `New request`, req);
        
        // Strip trailing slash
        if(req._pathname.endsWith("/")) {
            req._pathname = req._pathname.substring(0, req._pathname.length -1);
        }
        
        // Handle API call
        if(req._tokens[1] == "api")
        {
            var apiCall = req._tokens[2];
            res.writeHead(200, {'Content-Type': 'application/json'});
            
            try {
                switch(apiCall) {
                    case "stats":
                    switch(req._tokens[3])  {
                        case "days-serving":
                        res.write( `{ "days": ${logreader.getDatesServing()} }` );
                        break;
                        case "requests-count":
                        res.write( `{ "requests": ${logreader.getRequestsCount()} }` );
                        break;
                        case "sessions-count":
                        res.write( `{ "sessions": ${logreader.getSessionsCount()} }` );
                        break;
                        case "avg-sessions":
                        res.write( `{ "sessions": ${logreader.getAverageSessions()} }` );
                        break;
                        case "avg-requests":
                        res.write( `{ "requests": ${logreader.getAverageRequests()} }` );
                        break;
                        case "agents":
                        res.write( JSON.stringify(logreader.getAgents()) );
                        break;
                        case "all":
                        var json = {};
                        json['days'] = logreader.getDaysServing();
                        json['requests-count']  = logreader.getRequestsCount();
                        json['sessions-count']  = logreader.getSessionsCount();
                        json['avg-sessions']    = logreader.getAverageSessions();
                        json['avg-requests']    = logreader.getAverageRequests();
                        json['agents']          = JSON.stringify(logreader.getAgents());
                        // json['pages']           = JSON.stringify(logreader.getPages());
                        // json['failed-pages']    = JSON.stringify(logreader.failedPages());
                        res.write( JSON.stringify(json) );
                        break;
                        default:
                        res.write(jsonError("No query"));
                        break;
                    }
                    break;
                    
                    default:
                    // res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.write(jsonError("No query"));
                    break;
                }
                res.end();
            }
            catch(exception)
            {
                logger.log(6, "API Handling", `Failed while handling api req: ${exception}`, req);
                res.write(jsonError( { "Invalid query": [req._tokens] } ));
                res.end();
            }
            
            //
            // GUI
            //  Serves static files
            //
            
        }
        else
        {
            // Pass request to the handler
            handler.handleStatic(req, res);
        }
    }
    catch(exception)
    {
        logger.log(6, "Handling", `Failed while handling req: ${exception}`, req);
        res.writeHead(302, {
            'Location': '/pagenotfound'
        });
        res.end();
    }
}).listen(port, function() {
    logger.info(3, "Setup", `HTTP Running on port ` + port);
});

rl.on('line', (input) => {
    console.log(`[COM]: ${input}`);
});