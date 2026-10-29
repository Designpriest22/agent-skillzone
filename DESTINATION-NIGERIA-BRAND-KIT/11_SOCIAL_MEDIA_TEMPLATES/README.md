# 11 Social media templates
Eight template families, each in 4:5 (Instagram feed), 1:1 (Instagram, Facebook, LinkedIn, WhatsApp), 9:16 (Stories, Reels covers, WhatsApp status) and 16:9 1200 × 675 (X, LinkedIn, Facebook link). There are also YouTube thumbnails (1280 × 720), a web banner (1920 × 600), an MPU (300 × 250) and a leaderboard (728 × 90).

1. discover-destination · 2. experience-culture · 3. explore-business · 4. meet-partner · 5. investment-opportunity · 6. national-tourism-week · 7. industry-insight · 8. official-news

**Editing:**
- **Designers:** open the SVG in Figma, Illustrator or Inkscape. The text is live and the photo is a linked image; replace it with licensed photography.
- **Batch:** edit `content.json`, run `python3 16_SOURCE_FILES/build/social.py`, then render with `node render.mjs _jobs/_jobs_social.json`.

**Rules:** do not publish National Tourism Week dates or venues until they are officially confirmed. Every statistic needs a verified source line. Show a partner only with a signed agreement.
