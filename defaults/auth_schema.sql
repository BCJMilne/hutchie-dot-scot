/*
    auth_schema.sql

    Benjamin Milne
*/

CREATE TABLE user (
    user_id             INTEGER PRIMARY KEY,
    user_username       TEXT,
    user_password       TEXT,
    user_created        INTEGER
);

CREATE TABLE access_log (
    access_log_id       INTEGER PRIMARY KEY,
    access_log_time     INTEGER,
    access_log_user_id  INTEGER,
    access_log_success  TEXT,
    FOREIGN KEY (access_log_user_id) REFERENCES user(user_id)
);

CREATE TABLE token (
    token_id            INTEGER PRIMARY KEY,
    token_log_time      INTEGER,
    token_id_user_id    INTEGER,
    token_token         TEXT,
    FOREIGN KEY (token_id_user_id) REFERENCES user(user_id)
);