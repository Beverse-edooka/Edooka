-- Store pre-rendered certificate PNG as base64 text.
-- Allows /api/og/certificate/[certNumber] to serve the image from a single DB
-- read (<10 ms) instead of a canvas re-render (3-8 s cold start).
-- Column is nullable so existing rows continue to work (they fall back to live render).
ALTER TABLE "certificates"
  ADD COLUMN IF NOT EXISTS "png_data" text;
