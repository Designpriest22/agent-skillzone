# The Bonfire Experience: event website

A static site with no build step. Upload this folder as it is to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3) or to a web server.

- `index.html`: the event page. It has the hero with a background video, a countdown, the show previs with chapter buttons, the 3D explorer, the stage specs, a render gallery, directions and tickets.
- `stage.html`: the interactive 3D site and stage explorer. It loads inside `index.html` when the visitor asks for it, and it also works full screen on its own. It pulls three.js 0.160 from jsDelivr.
- `assets/`: the web video (720p, about 10 MB), the poster and the render stills.

To preview it locally, run `python3 -m http.server` in this folder and open http://localhost:8000. Opening the files straight from disk won't work, because the 3D explorer uses ES modules.
