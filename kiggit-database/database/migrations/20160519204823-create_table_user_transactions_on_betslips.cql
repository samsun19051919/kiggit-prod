CREATE TABLE user_transactions_on_betslips(
    user_id      uuid,
    betslip_id   uuid,
    amount       int,
    PRIMARY KEY (user_id, betslip_id));

