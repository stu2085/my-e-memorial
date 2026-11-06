-- Run in Supabase SQL Editor before deploying opening-screen code.
-- Additive only. Existing presentations retain their current opening defaults.
ALTER TABLE public.celebration_presentations
  ADD COLUMN IF NOT EXISTS intro_title text NOT NULL DEFAULT 'Celebration of Life',
  ADD COLUMN IF NOT EXISTS intro_message text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS intro_font text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS intro_color text NOT NULL DEFAULT '#FDE68A';

-- Defaults and validation match the editing API.
ALTER TABLE public.celebration_presentations
  ADD CONSTRAINT celebration_intro_title_length_check
    CHECK (char_length(intro_title) BETWEEN 1 AND 60),
  ADD CONSTRAINT celebration_intro_message_length_check
    CHECK (char_length(intro_message) <= 140),
  ADD CONSTRAINT celebration_intro_font_check
    CHECK (intro_font IN ('classic', 'elegant', 'modern')),
  ADD CONSTRAINT celebration_intro_color_check
    CHECK (intro_color IN ('#FDE68A', '#FFFFFF', '#BAE6FD', '#FBCFE8'));
