const fs        = require("fs"),
url           = require('url'),
Logger        = require("./log_handler.js"),
{ execSync }  = require('child_process');

const logger    = new Logger("Handler");

var htmlDir;
var incDir;
var tempDir = `${__dirname}/templates/`;

//
// Experimental function for templating pages
//
function fillTemplate(hcont) {
  logger.info(1, "Templating", `Filling template`)
  hcont = JSON.parse(hcont);
  
  var template = hcont.template;
  
  var html = fs.readFileSync(tempDir + template, 'utf8');
  
  if (!(html)) {
    logger.log(5, "Templating", `Invalid template requested: ${tempDir + template}`);
  } else {
    logger.log(1, "Templating", `Loaded file: ${tempDir + template}`);
    
    var regex = /\$\$[^ \n]*\$\$/gi;
    var match;
    
    try {
      while ((match = regex.exec(html)) != null) {
        tag = match[0].substring(2, match[0].length - 2);
        html = replaceBetween(html, match.index, match[0].length + match.index, hcont[tag]);
      }
      // console.log("Filling done");
      return html;
    } catch (err) {
      logger.info(5, "Templating", `Error encountered while filling template: \n ${err}`);
      return html;
    }
    
  }
}

//
// Function for filling html placeholders in the form {{placeholder}}
//
function fillPlaceholders(html, req) {
  var regex = /\{\{[^ \n]*\}\}/gi;
  var match;
  var flag_replaced = false;
  
  // While there are matches...
  try {
    while ((match = regex.exec(html)) != null) {
      flag_replaced = true;
      command = match[0].substring(2, match[0].length - 2);
      
      if (command == "$time") {
        // Current datetime
        
        var currentDate = getWholeDate();
        html = replaceBetween(html, match.index, match[0].length + match.index, currentDate);
      }
      
      else if(command == "$githash") {
        // First 7 chars of the server's commit version
        
        var commitHash = execSync(`git --git-dir=${__dirname}/.git rev-parse --short=7 HEAD`);
        html = replaceBetween(html, match.index, match[0].length + match.index, commitHash);
      }
      
      else if(command == "$clientip") {
        // Client's IP address
        
        html = replaceBetween(html, match.index, match[0].length + match.index, req._ip);
      }
      
      else {
        // Otherwise, we assume the placeholder is requesting a file
        
        if (fs.existsSync(incDir + command, 'utf8')) {
          var filler = fs.readFileSync(incDir + command, 'utf8');
          var ext = command.split(`.`).pop();
          switch (ext) {
            // case 'md':
            //   // Markdown file, so format the markdown
            
            //   logger.info(1, "Templating", `Markdown include request, formatting`);
            //   filler = marked(filler);
            //   break;
          }
          html = replaceBetween(html, match.index, match[0].length + match.index, filler);
        } else {
          logger.info(4, "Templating", `Invalid include request: ${command}`);
          html = replaceBetween(html, match.index, match[0].length + match.index, "Unknown");
        }
      }
    }
  } catch (err) {
    logger.info(5, "Templating", `Error encountered while filling placeholders: \n ${err}`);
    return html;
  }
  
  // Call itself until there are no placeholders left
  // Required due to the way the regex function works, e.g. 
  // placeholders too close to each other will be skipped
  if(flag_replaced) {
    html = fillPlaceholders(html, req);
    return html;
  } else  {
    return html;
  }
}

// Place new content in the middle of a string
function replaceBetween(original, start, end, content) {
  return original.substring(0, start) + content + original.substring(end);
};

// Get the current date
function getWholeDate() {
  var d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1)}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}

// Parse the client's query
function parseURLQuery(query) {
  var list = {};
  
  query && query.split('&').forEach(function (cookie) {
    var parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  
  return list;
}

module.exports = {
  
  setHtmlDir: function (newDir) {
    htmlDir = newDir;
  },
  
  setIncDir: function (newDir) {
    incDir = newDir;
  },
  
  setLogLevel: function (newLevel) {
    logger.setLogLevel(newLevel);
  },
  
  // The primary code
  //
  // Handles decision making
  handleStatic: function (req, res, pathname) {
    
    // Required if we wish to transparently change the file being served
    if (pathname) req._pathname = pathname;
    
    var sSnip = `${req._session.substring(0, 5)}`;  // First portion of the client's session ID for logging purposes
    var fullURL = `http://test.test${req.url}`;     // Required for use with url library
    var pURL = url.parse(fullURL);
    var goahead = true;
    
    try {
      // Load routes
      var routeFile = fs.readFileSync(`${__dirname}/routes.json`);
      var routes = JSON.parse(routeFile);
      
      // ==========================================
      //  Check against routes
      //  
      logger.info(1, "Routing", `${sSnip} Checking against routes...`);
      for (var p in routes) {
        if (req._pathname.startsWith(routes[p].path)) {
          logger.info(2, "Routing", `Route match found`);
          for (var a in routes[p].actions) {
            var aType = routes[p].actions[a].type;
            var aVal = routes[p].actions[a].value
            switch (aType) {
              
              
              case "url-redirect":
              logger.info(1, "Routing", `Route called for redirect to ${aVal}`);
              res.writeHead(302, {
                'Location': aVal
              });
              res.end();
              goahead = false;
              
              
              case "internal-redirect":
              logger.info(1, "Routing", `Route called for internal redirect to ${aVal}`);
              this.handleStatic(req, res, `${aVal}`, urlTokens);
              goahead = false;
              
              
              case "external-redirect":
              logger.log(2, "Routing", `Route called for external redirect to ${aVal}`, req);
              if (aVal.startsWith('$')) {
                var logVar = parseURLQuery(pURL.query);
                if (logVar[aVal.slice(1)]) {
                  res.writeHead(302, {
                    'Location': logVar.url
                  });
                  res.end();
                } else {
                  logger.log(4, "Routing", `No URL specified`, req);
                  this.handleStatic(req, res, `/pagenotfound`);
                }
              } else {
                logger.log(4, "Routing", `No URL specified`, req);
              }
              
              goahead = false;
              
              
              case "log-variable":
              var logVar = parseURLQuery(pURL.query);
              if (logVar[aVal]) {
                logger.log(3, "Routing", `Route called for logging of variable ${aVal}, which was ${logVar[aVal]}`, req);
              }
            }
          }
        }
      }
    }
    catch (err) {
      logger.log(6, "Routing", `There was an error handling routes: ${err}`);
    }
    
    // ==========================================
    //  If we need to serve a page, proceed
    //  
    if (goahead) {
      logger.info(1, "Serving", `${sSnip} ... Looking for file...`);
      try {
        // If the file exists with a .html extension, serve it instead.
        // This does mean that example.html.html would override example.html
        if (fs.existsSync(htmlDir + req._pathname + ".html")) {
          logger.info(1, "Serving", `${sSnip} ... Found alternative file, appending .html`);
          this.handleStatic(req, res, `${req._pathname}.html`);
        }
        
        // If the file exists with a .html extension, serve it instead.
        // This does mean that example.html.html would override example.html
        else if (fs.existsSync(htmlDir + req._pathname + ".hcont")) {
          logger.info(1, "Serving", `${sSnip} ... Found template content, appending .hcont`);
          this.handleStatic(req, res, `${req._pathname}.hcont`);
        }
        
        // If the file / directory exists as request, decide what to do...
        else if (fs.existsSync(htmlDir + req._pathname)) {
          
          // If the request file is a directory, attempt to serve the index.html from that directory
          if (fs.lstatSync(htmlDir + req._pathname).isDirectory()) {
            logger.info(1, "Serving", `${sSnip} ... requested directory, so serving index`);
            this.handleStatic(req, res, `${req._pathname}/index.html`);
          }
          else {
            
            // ==========================================
            //  Handling existing files
            
            logger.info(1, "Serving", `${sSnip} ... File exists, attempting to send to client`);
            
            // If the file is HTML, open it and fill any placeholders in the document
            if (req._pathname.endsWith(".html")) {
              fs.readFile(htmlDir + req._pathname, 'utf8', function (err, html) {
                if (err) {
                  logger.log(5, "Serving", err, req);
                } else {
                  // console.log("Filling placeholders");
                  var htmlComplete = fillPlaceholders(html, req);
                  // console.log(htmlComplete);
                  res.end(htmlComplete);
                }
              }.bind(res));
              return;
            }
            
            // If the file is a template content file, open it and fill the requested template
            if (req._pathname.endsWith(".hcont")) {
              fs.readFile(htmlDir + req._pathname, 'utf8', function (err, hcont) {
                if (err) {
                  logger.log(5, "Serving", err, req);
                } else {
                  var templateFilled = fillTemplate(hcont);
                  // console.log("Filling placeholders");
                  var htmlComplete = fillPlaceholders(templateFilled, req);
                  res.end(htmlComplete);
                }
              }.bind(res));
              return;
            }
            
            // If the file is not HTML, serve the raw resource
            else if (req._pathname && req._pathname != "/") {
              fs.readFile(htmlDir + req._pathname, function (err, file) {
                if (err) {
                  logger.log(5, "Serving", err, req);
                } else {
                  res.end(file);
                }
              }.bind(res));
              return;
            }
          }
        }
        
        // If the resource is not found anywhere, serve the 404 page
        else {
          logger.log(4, "Serving", `Unknown file requested: ${req._pathname}`, req);
          
          res.writeHead(302, {
            'Location': '/pagenotfound'
          });
          res.end();
          return;
        }
      }
      catch (err) {
        logger.log(6, "Serving", `Error handing static file: ${err}`, req);
        res.end("A very bad error occured, so we couldn't even show you a nice error page.");
        return;
      }
    }
  }
}