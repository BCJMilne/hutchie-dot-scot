<!-- markdown-extras: markdown-in-html -->

## Hutchie.scot's NodeJS Webserver

You've come across the README.md descriptor for the NodeJS server built to serve the webpages of Hutchie.scot. 

This project is designed so that you can replace all of `includes/` and `public/` with your own content and it will just work.

## Legal thingy

This is a side project catering to my own webserver.

You are free to use any part of this code yourself (why you'd want to, I don't know) without permission, however I will take **no** responsibility for **any** issues that may arise.

## Features

### Templating

When serving `.html` files from `public/`,  the file will automatically be searched for include tags in the form of `{{filename.html}}`.
These files are located in `includes/` and are not normally served.
If a file matching `filename.html` is found in `includes/`, the placeholder will be replaced by the contents of said file.

This is also slowing including placeholder variables, such as `$time` and `$githash`.

### Route Actions

Actions per route can be defined in `routes.json` which allow things such as browser redirections, transparent internal redirections (transparently serving a different page) and logging of data. Paths are defined as such:

```
{
    "path": "/t/twitter",
    "actions": [
        {
            "type": "url-redirect",
            "value": "/"
        }
    ]
}
```

- Currently available actions are:
    - `log-variable`: A strangely specific command to log a given url parameter
    - `external-redirect`: Redirects to the contents of the given url parameter
    - `url-redirect`: Redirect the user to a given page
    - `internal-redirect`: Transparently serve another (relative) URL

## Changelog

#### **Version 1.8** _2019 / 12 / 25_ -- We're back

##### Changes

- Redesigned entire site again, this time even more modular and following suit with gov.uk design styles, because they are pretty
- Added SVG graphing demo
- Added git commit placeholder
- Added stats page
- Added log_reader.js class for getting stats
- Added various stats options to api
- Removed `mysql` and `marked` as dependencies

##### Bugs

- Fixed logs overriding. Used .getDay instead of .getDate which was returning an int that represents the day of the week, NOT the date.
- Fixed incorrect month logged: months are indexed from 0!
- Now created logs dir if not found
- Now copies `constants.example.js` to `constants.js` if the latter is not found

#### **Version 1.7** _2019 / 10 / 31_ -- CV and bugs

##### Added

- Updated main pages to mimic CV

##### Bugs

- Fixed quick page requests sending files without placeholders filled

#### **Version 1.6** _2019 / 10 / 06_ -- Logs

##### Added

- Persistent log file in `/logs`
- Completely re-wrote log handler
    - Logger is now a `class` which must be instantiated
    - Now logs in JSON
    - Can log in to file or to console only
- Added another two route `action`s: 
    - `log-variable`: A strangely specific command to log a given url parameter
    - `external-redirect`: Redirects to the contents of the given url parameter

##### Cleaning

- Moved request handling to a seperate `handling.js` file

#### **Version 1.5** _2019 / 10 / 04_ -- Configurable route

##### Added

- Implemented a `routes.json` file which can configure actions to take on certain paths, such as:
    - `url-redirect`: Redirect the user to another page
    - `internal-redirect`: Transparently serve another (relative) URL
- Added a new placeholder: `$time` which will be replaced by the current time.
- Revamped `/projects`. Looking snazzy.

##### Bugs

- Fixed logging the wrong IP from behind a proxy. Should now return the IP in order of `X-forwarded-for` header, `X-Real-IP` or `connection.remoteAddress`, whichever exists first in that order.

##### Cleaning

- Removed `source_id` table from database, as `client_data` logs landing page
- Discovered `.endsWith()` and `.startsWith()`. Wow. Technology.
- Optimised JS code for changing themes

#### **Version 1.4** _2019 / 10 / 04_ -- Regression

- I've been attempting to re-create this in Python, but it is performing too badly.
- We've made away with child processes as spinning up a Node program for every request produces far too much overhead.

#### **Version 1.3** _2019 / 09 / 28_ -- Children

##### Added

- Massively expanded `README` to stroke my fragile ego
- Created configurable `HTTP_PORT` in `constants.js`
- ~~Suddenly decided to attempt to optimise the server by implementing child processes~~
    - ~~Each request is handled by a new child process, potentially offloading the work to another core~~
    - ~~This server can now handle multiple requests at once and requests are non-blocking!~~
    - (Removed in **Version 1.4**)

#### **Version 1.2** _2019 / 09 / 27_

##### Added

- Modularised logging
    - Expanded colours
    - Made much more readable
    - Can now import logger and log messages via `.info`, `.vital`, `.critical`, etc
    - CONFIGURABLE LOGGING LEVEL: Can now set logging level via `--logging-level=[log_level_no]`
- Now checks if requested file is a directory and serves the index.html file in that directory if so

##### Bugs

- Fixed error on Google Chrome not sending cookies with request for web manifest metadata, corrected by adding `crossorigin="use-credentials"` to `<link ... >`

#### **Version 1.1** _2019 / 09 / 25_ -- Templates

##### Added

- Added basic template / placeholder functionality using `{{filename.html}}`
- Added basic sessions
- Added basic database module using mysql and config file
    - Currently only logs new sessions into predefined and existing table
- Added session cookies

#### **Version 1.0** _2019 / 09 / 24_ -- Initial Release

##### Added

- Basic delivery of static pages

### Contact

Feel free to contact me if you have a word to say about this project, be it good or bad. I'm very open to criticism.

[GitHub @ BCJMilne](https://github.com/BCJMilne)   
[hutchie.scot](https://hutchie.scot)  
