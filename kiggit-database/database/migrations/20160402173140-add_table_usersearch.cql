CREATE TABLE user_search(
    prefix           text,
    suffix           text,
    fulltext         text,
    user_id          uuid,
    PRIMARY KEY (prefix, suffix, user_id)
);