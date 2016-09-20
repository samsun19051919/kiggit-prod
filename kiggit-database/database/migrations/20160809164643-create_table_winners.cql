CREATE TABLE winners (
    betslip_id  uuid,
    user_id   uuid,
    position int,
    amount int,
    PRIMARY KEY (betslip_id, user_id));
