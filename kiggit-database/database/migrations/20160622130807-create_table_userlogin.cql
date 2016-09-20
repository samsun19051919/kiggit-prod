CREATE TABLE user_login (
    email       text,
    login_time  timestamp,
    from_host   text,
    success     boolean,
    reason      text,
    PRIMARY KEY (email, login_time));
