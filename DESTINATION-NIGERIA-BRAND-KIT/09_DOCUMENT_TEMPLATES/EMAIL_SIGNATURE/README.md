# Email signature

- `DN_email-signature.html` is the master: a table layout with inline styles. It has been checked to render in browsers. Gmail, Outlook (desktop and web) and Apple Mail all accept this pattern, but test it in your own clients before rolling it out.
- `DN_email-logo_500px.png` is the logo, served at 150 px wide for sharp display on high-DPI screens. Host it on the official domain and replace `LOGO_URL`.
- The signature uses system fonts (Georgia, Arial) because email clients don't load brand web fonts.
- **Gmail:** Settings → Signature → paste the rendered signature (open the preview HTML in a browser, select all, copy).
- **Outlook:** File → Options → Mail → Signatures → paste the rendered signature.
- **Apple Mail:** Settings → Signatures → paste. Untick "Always match my default message font".
- Add only verified official social accounts. Never add a personal phone number without consent.
