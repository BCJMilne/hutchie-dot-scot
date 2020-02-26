/*
    schema.sql

    Benjamin Milne
*/

-- DROP DATABASE   IF     EXISTS hutchie_dot_scot_db;
-- CREATE DATABASE IF NOT EXISTS hutchie_dot_scot_db;
-- USE hutchie_dot_scot_db;

CREATE TABLE log_level (
    log_level_id                INTEGER PRIMARY KEY,
    log_level_name              TEXT
);

CREATE TABLE log (
    log_id              INTEGER PRIMARY KEY AUTOINCREMENT,
    log_source          TEXT,
    log_time            INTEGER,
    log_level           INTEGER,
    log_type            TEXT,
    log_msg_short       TEXT,
    log_route           TEXT,
    log_ip              TEXT,
    log_session         TEXT,
    log_agent           TEXT,
    log_request         TEXT,
    FOREIGN KEY (log_level) REFERENCES log_level(log_level_id)
);

INSERT INTO log_level (log_level_id, log_level_name) VALUES (1, "Info");
INSERT INTO log_level (log_level_id, log_level_name) VALUES (2, "Requests");
INSERT INTO log_level (log_level_id, log_level_name) VALUES (3, "Important");
INSERT INTO log_level (log_level_id, log_level_name) VALUES (4, "Warning");
INSERT INTO log_level (log_level_id, log_level_name) VALUES (5, "Error");
INSERT INTO log_level (log_level_id, log_level_name) VALUES (6, "Critical");
