CREATE TABLE deposit_transactions (
    user_id           uuid,
    credit_card_id    uuid,
    shopper_email     text,
    shopper_reference text,
    reference         text,
    pspReference      text,
    resultCode        text,
    authCode          text,
    amount            int,
    PRIMARY KEY ((user_id, credit_card_id), pspReference));

