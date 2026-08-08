# BubbleLens — Bubble Sort Visualizer

A modern, responsive Bubble Sort visualizer with a dark blue/purple
glassmorphism UI, live stats, adjustable array size & speed, and a
step-by-step explanation panel.

## Folder structure

```
bubble-sort-visualizer/
├── app.py                  # Flask server (serves the app + small JSON APIs)
├── requirements.txt
├── templates/
│   └── index.html          # Main page markup
└── static/
    ├── css/
    │   └── style.css       # Dark theme, glassmorphism, responsive layout
    └── js/
        └── script.js       # Bubble sort algorithm + animation + controls
```

## Run it

1. (Optional) create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate      # Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the server:
   ```bash
   python app.py
   ```
4. Open **http://127.0.0.1:5000** in your browser.

## No Flask? No problem

Everything that actually sorts and animates — the algorithm, the bar
rendering, the stats, the explanation panel — is plain HTML/CSS/JS in
`templates/index.html`, `static/css/style.css`, and `static/js/script.js`.
Flask here is only the delivery mechanism (it renders the template and
serves the static files). If you don't want to run Python at all, you
can open `templates/index.html` directly in a browser (the CSS/JS
paths use Flask's `url_for`, so for a no-server setup, copy `index.html`
next to the `static/` folder and change the two `{{ url_for(...) }}`
tags to plain relative paths, e.g. `static/css/style.css`). All
animations are done with CSS transitions/keyframes, so no JS
animation library is required either way.

## Features

- Adjustable array size (10–120 bars) and sort speed (5 levels)
- Generate Array / Start / Pause / Resume / Reset controls
- Color-coded bars: default, comparing (yellow), swapping (red), sorted (green)
- Live stats: current pass, comparisons, swaps, execution time
- Bubble Sort time & space complexity reference card
- Step-by-step explanation panel with a scrolling log
- Fully responsive: desktop, tablet, and mobile layouts
- Dark theme with blue → violet → magenta gradient and glassmorphism panels

## Optional server-side endpoints

- `GET /api/generate-array?size=40&min=5&max=100` — returns a random array as JSON
- `GET /api/complexity` — returns Bubble Sort's complexity facts as JSON

These aren't required by the front-end (which generates arrays client-side
for instant feedback) but are there if you want to extend the app to be
more server-driven.
