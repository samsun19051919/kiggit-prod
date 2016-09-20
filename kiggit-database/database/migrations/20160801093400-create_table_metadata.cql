CREATE TABLE meta_data (
    id uuid,
    transaction_fee int,
    PRIMARY KEY (id));

INSERT INTO meta_data (id, transaction_fee) VALUES (22222222-2222-2222-2222-222222222222, 5);