GPS / COURSE FILES
==================

Drop .gpx / .kml course files in this folder, then list them in
manifest.json so they show up on the hub's GPS Files tab.

manifest.json format (JSON array):

[
  {
    "file": "baja400-2026-course.gpx",
    "name": "Baja 400 2026 - Official Course",
    "desc": "SCORE release v1, Sep 2026"
  },
  {
    "file": "baja400-pits.kml",
    "name": "Baja 400 - Pit Locations",
    "desc": "BFG + chase points"
  }
]

After editing, redeploy the site (drag the folder to Netlify Drop again,
or push to GitHub if using GitHub Pages).
