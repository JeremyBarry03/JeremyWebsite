# Jeremy Barry Portfolio

Static portfolio site for Jeremy Barry. The live homepage is `index.html`.

## Structure

- `index.html` - page content and semantic markup for the main site.
- `styles/` - CSS split by responsibility:
  - `main.css` imports the site CSS files in order.
  - `site-base.css` defines fonts, tokens, resets, and global canvas styles.
  - `site-intro.css` owns the intro screen.
  - `site-layout.css` owns the homepage sections and components.
  - `site-responsive.css` owns responsive and reduced-motion rules.
- `scripts/` - homepage behavior:
  - `particle-field.js` draws both the intro and main page hexagon particle fields.
  - `site.js` wires controls, intro typing, reveal animation, and project-card clicks.
- `images/` - all image assets, grouped by usage.
- `documents/` - PDFs and report downloads.
- `media/` - video assets.
- `projects/` - source/data files for project artifacts.
- `archive/` - non-live design artifacts retained for reference.

## Local Preview

Serve the folder locally so media and links resolve consistently:

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8766/index.html`.
