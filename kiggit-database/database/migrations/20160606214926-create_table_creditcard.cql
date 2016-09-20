CREATE TABLE credit_card (
    user_id          uuid,
    credit_card_id   uuid,
    card_holder_name text,
    card_number      text,
    expire_month     text,
    expire_year      text,
    cvc              text,
 PRIMARY KEY (user_id, credit_card_id));