"""
Bubble Sort Visualizer — Flask Backend
========================================
This is a lightweight Flask server whose only job is to serve the
front-end (HTML/CSS/JS). All sorting logic and animation happen
client-side in JavaScript for smooth, real-time visualization —
Flask is used here as the delivery layer and as a place to grow
server-side features (e.g. saving custom arrays, exposing the sort
as an API) if needed later.

Run with:
    python app.py

Then open http://127.0.0.1:5000 in your browser.
"""

from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)


@app.route("/")
def index():
    """Serve the main visualizer page."""
    return render_template("index.html")


@app.route("/api/generate-array")
def generate_array():
    """
    Optional server-side random array generator.
    The front-end can call this endpoint instead of generating the
    array in JS, useful if you want the backend to be the single
    source of truth (e.g. for future features like saved arrays,
    leaderboard-style comparisons, etc).

    Query params:
        size (int): number of bars, default 30, clamped 5-150
        min  (int): minimum bar value, default 5
        max  (int): maximum bar value, default 100
    """
    size = request.args.get("size", 30, type=int)
    min_val = request.args.get("min", 5, type=int)
    max_val = request.args.get("max", 100, type=int)

    # Clamp values to sane bounds so the UI never breaks
    size = max(5, min(size, 150))
    min_val = max(1, min_val)
    max_val = max(min_val + 1, max_val)

    array = [random.randint(min_val, max_val) for _ in range(size)]
    return jsonify({"array": array, "size": size})


@app.route("/api/complexity")
def complexity():
    """
    Returns Bubble Sort's time/space complexity facts.
    Kept server-side so the info panel content can be updated
    in one place without touching the front-end JS.
    """
    return jsonify({
        "name": "Bubble Sort",
        "best": "O(n)",
        "average": "O(n\u00b2)",
        "worst": "O(n\u00b2)",
        "space": "O(1)",
        "stable": True,
        "in_place": True,
        "description": (
            "Bubble Sort repeatedly steps through the array, compares "
            "adjacent elements, and swaps them if they are in the wrong "
            "order. Each full pass 'bubbles' the largest unsorted value "
            "to its correct position at the end of the array."
        )
    })


if __name__ == "__main__":
    # debug=True enables auto-reload during development.
    # Turn this off (or use a proper WSGI server) in production.
    app.run(debug=True)
