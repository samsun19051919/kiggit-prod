CREATE TABLE betslip_leaderboard (
   betslip_id        uuid,
   user_id           uuid,
   user_score        int,
   PRIMARY KEY (betslip_id, user_id));
