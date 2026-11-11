ALTER TABLE public.celebration_presentations
  DROP CONSTRAINT celebration_intro_font_check,
  ADD CONSTRAINT celebration_intro_font_check
    CHECK (intro_font IN ('classic', 'elegant', 'modern', 'storybook', 'typewriter', 'bold'));
