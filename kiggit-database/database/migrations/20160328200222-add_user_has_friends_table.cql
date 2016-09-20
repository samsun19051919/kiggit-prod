CREATE TABLE user_has_friends(
    user_id     uuid,
    friend_id     uuid,
    since       timestamp,
    PRIMARY KEY (user_id, friend_id));

