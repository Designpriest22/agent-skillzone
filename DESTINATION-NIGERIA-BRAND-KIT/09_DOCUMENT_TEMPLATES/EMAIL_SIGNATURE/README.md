# Email signatures

- One signature per person: `general` (info@), `eddie` and `lulu`. Each HTML file is the master: a table layout with inline styles.
- `DN_email-logo_500px.png` is shown at 132 px wide for sharp display on high-DPI screens. Host it on destinationnigeria.org and replace `LOGO_URL`.
- The signatures use system fonts (Georgia, Arial) because email clients don't load web fonts.
- No roles are shown, because none were supplied. Add a role line to the person's entry in `16_SOURCE_FILES/build/cards.py` once confirmed, then rebuild.
- **Gmail:** Settings → Signature → paste the rendered preview (open it in a browser, select all, copy).
- **Outlook:** File → Options → Mail → Signatures → paste.
- **Apple Mail:** Settings → Signatures → paste, and untick "Always match my default message font".
