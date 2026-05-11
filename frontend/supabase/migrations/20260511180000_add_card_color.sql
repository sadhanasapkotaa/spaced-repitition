-- Add color column to cards for visual labelling
alter table public.cards
  add column color text null;
