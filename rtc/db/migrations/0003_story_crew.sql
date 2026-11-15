-- Story Mode: Odumodu Blvck is the lead; the player may bring one crew member as an assist.
-- Stored per run so the server replays the exact same fight.
alter table runs add column assist text;
