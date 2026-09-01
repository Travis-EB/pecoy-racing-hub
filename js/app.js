/* ============================================================
   PeCoy Racing Hub — app logic
   Works offline (localStorage) until Firebase is configured,
   then everything syncs live for the whole team.
   ============================================================ */
(function () {
"use strict";

var FUEL_CELL_GALLONS = 89; // usable

/* ---------------- verified 2026 season data ---------------- */

var RESULTS = {
  sf250: {
    label: "King Shocks 39th San Felipe 250 — March 2026",
    rows: [
      [1, "297", "Jorge Sampietro", "4:47:46.180"],
      [2, "253", "Ray Griffith", "4:50:49.130"],
      [3, "285", "Justin Davis", "4:51:25.423"],
      [4, "282", "Brent Fox", "4:55:36.625"],
      [5, "236", "Michael Marsal", "4:59:48.357"],
      [6, "212", "Travis Pecoy", "5:01:38.548"],
      [7, "242", "Bryce Swaim", "5:02:19.843"],
      [8, "219", "Pierce Herbst", "5:04:31.367"],
      [9, "241", "Stephen Beal", "5:14:59.314"],
      [10, "215", "Trey Gibbs", "5:15:40.096"],
      [11, "237", "Patrick Wieland", "6:09:42.250"],
      [12, "280", "Justin Montesalvo", "6:10:26.155"],
      [13, "247", "Dan Bonnor", "6:11:44.226"],
      [14, "263", "EJ Herbst", "6:15:04.455"],
      [15, "270", "Jimmy Diaz", "6:21:34.051"],
      [16, "230", "Neal Drickey", "7:26:13.463"],
      [17, "273", "Apdaly Lopez", "7:35:59.851"],
      [18, "299", "Charles Dorrance", "7:42:29.402"],
      [19, "294", "Vincent Munoz", "8:06:57.475"],
      [20, "275", "Luis Angel Huerta", "8:25:58.961"],
      [21, "267", "Jose Leon", "8:26:39.271"],
      [22, "257", "Alfred Fisher", "8:40:50.274"],
      [23, "246", "Ben Hagle", "9:59:24.816"],
      [24, "284", "Jose Antonio Contreras", "12:24:07.042"]
    ],
    dnf: ["Jason McNeil", "Eliott Watson", "Colton Hustead", "Jack Olliges",
      "Ryan Hancock", "Travis Williams", "Joe Delucie", "Ethan Hagle",
      "Jose David Ruvalcaba Adame", "Miles Wyatt", "Victor Calderon",
      "Michael Belitz", "Isidro Ochoa", "Jose Mendez", "Abel Magdiel Soto Leyva"]
  },
  b500: {
    label: "BFGoodrich Tires 58th Baja 500 — June 2026",
    rows: [
      [1, "215", "Trey Gibbs", "10:58:29.591"],
      [2, "282", "Brent Fox", "10:48:07.648"],
      [3, "242", "Bryce Swaim", "10:56:50.628"],
      [4, "212", "Travis Pecoy", "10:55:49.802"],
      [5, "285", "Justin Davis", "10:55:06.884"],
      [6, "227", "Jack Olliges", "11:04:01.877"],
      [7, "299", "Charles Dorrance", "11:07:53.532"],
      [8, "236", "Michael Marsal", "12:10:29.200"],
      [9, "273", "Apdaly Lopez", "12:30:58.444"],
      [10, "270", "Jimmy Diaz", "11:34:15.284"],
      [11, "237", "Patrick Wieland", "11:36:14.666"],
      [12, "220", "Boris Said Jr", "11:44:36.257"],
      [13, "223", "Kyle Murray", "13:45:11.837"],
      [14, "228", "Ryan Hancock", "13:32:39.646"],
      [15, "230", "Neal Drickey", "15:27:22.437"],
      [16, "275", "Luis Angel Huerta", "17:18:32.511"],
      [17, "281", "Sergio Rangel", "17:20:42.956"],
      [18, "268", "Doug Dillard", "17:32:39.032"]
    ],
    dnf: ["EJ Herbst", "Isidro Ochoa", "Jose David Ruvalcaba", "Stephen Beal",
      "Ray Griffith", "Jorge Sampietro", "Eliott Watson", "Pierce Herbst"]
  }
};

// Official SCORE points through Round 2 (Baja 500), Trophy Truck Spec.
var DEFAULT_STANDINGS = [
  ["282", "Brent Fox", 244], ["215", "Trey Gibbs", 243], ["285", "Justin Davis", 238],
  ["242", "Bryce Swaim", 236], ["212", "Travis PeCoy", 234], ["236", "Michael Marsal", 230],
  ["237", "Patrick Wieland", 221], ["299", "Charles Dorrance", 218], ["270", "Jimmy Diaz", 218],
  ["273", "Apdaly Lopez", 217], ["230", "Neal Drickey", 212], ["275", "Luis Angel Huerta", 207],
  ["297", "Jorge Sampietro", 172], ["253", "Ray Griffith", 166], ["227", "Jack Olliges", 155],
  ["219", "Pierce Herbst", 154], ["241", "Stephen Beal", 153], ["263", "EJ Herbst", 148],
  ["228", "Ryan Hancock", 147], ["220", "Boris Said Jr", 114], ["223", "Kyle Murray", 113],
  ["281", "Sergio Rangel", 109], ["268", "Doug Dillard", 108], ["280", "Justin Montesalvo", 105],
  ["247", "Dan Bonnor", 104], ["294", "Vincent Munoz", 98], ["267", "Jose Leon", 96],
  ["257", "Alfred Fisher", 95], ["246", "Ben Hagle", 94], ["284", "Jose Antonio Contreras", 93],
  ["209", "Jose Ruvalcaba Adame", 80], ["233", "Eliott Watson", 80], ["290", "Isidro Ochoa", 80],
  ["205", "Joe Delucie", 35], ["210", "Kolton Hustead", 35], ["213", "Victor Calderon", 35],
  ["229", "Jose Mendez", 35], ["234", "Jason McNeil", 35], ["245", "Ethan Hagle", 35],
  ["248", "Miles Wyatt", 35]
].map(function (d, i) { return { pos: i + 1, truck: d[0], driver: d[1], points: d[2] }; });

// 4-wheel green flag: Sat Sep 12, 2026, 10:00 AM PT (per official course map).
var NEXT_RACE_TS = new Date("2026-09-12T10:00:00-07:00").getTime();

// Official course distances (pro classes), used for fuel projections.
var RACE_DISTANCE = { baja400: 423.16, baja1000: null, practice: null };

/* ---------------- tiny helpers ---------------- */

function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function fmt(n, d) { return isFinite(n) ? n.toFixed(d == null ? 2 : d) : "–"; }
function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate(); // Firestore Timestamp
  return new Date(ts);
}
function timeLabel(ts) {
  var d = tsToDate(ts);
  if (!d) return "";
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
         d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/* ============================================================
   Store — one API, two backends (Firestore / localStorage)
   ============================================================ */

var Store = {
  connected: false,
  db: null,
  _localWatchers: {},

  init: function () {
    if (window.FIREBASE_CONFIG && window.firebase) {
      try {
        firebase.initializeApp(window.FIREBASE_CONFIG);
        this.db = firebase.firestore();
        this.connected = true;
      } catch (e) {
        console.warn("Firebase init failed, running offline:", e);
      }
    }
  },

  // ----- lists (chat, notices, fuel_x, hotels_x) -----
  watchList: function (name, cb) {
    if (this.connected) {
      this.db.collection(name).orderBy("ts", "asc").limit(500)
        .onSnapshot(function (snap) {
          var items = [];
          snap.forEach(function (doc) {
            var d = doc.data(); d.id = doc.id; items.push(d);
          });
          cb(items);
        }, function (err) { console.warn("watch " + name, err); cb([]); });
    } else {
      this._localWatchers[name] = cb;
      cb(this._localGet(name, []));
    }
  },
  addItem: function (name, obj) {
    if (this.connected) {
      obj.ts = firebase.firestore.FieldValue.serverTimestamp();
      return this.db.collection(name).add(obj);
    }
    obj.ts = Date.now();
    obj.id = "L" + Date.now() + Math.floor(Math.random() * 1e4);
    var items = this._localGet(name, []);
    items.push(obj);
    this._localSet(name, items);
    return Promise.resolve();
  },
  deleteItem: function (name, id) {
    if (this.connected) return this.db.collection(name).doc(id).delete();
    var items = this._localGet(name, []).filter(function (x) { return x.id !== id; });
    this._localSet(name, items);
    return Promise.resolve();
  },

  // ----- single docs (pitplan_x, standings) -----
  watchDoc: function (name, cb) {
    if (this.connected) {
      this.db.collection("docs").doc(name)
        .onSnapshot(function (doc) { cb(doc.exists ? doc.data() : null); },
                    function (err) { console.warn("watch doc " + name, err); cb(null); });
    } else {
      this._localWatchers["doc:" + name] = cb;
      cb(this._localGet("doc:" + name, null));
    }
  },
  setDoc: function (name, obj) {
    if (this.connected) return this.db.collection("docs").doc(name).set(obj);
    this._localSet("doc:" + name, obj);
    return Promise.resolve();
  },
  getDoc: function (name) { // one-shot read (used for on-demand file content)
    if (this.connected) {
      return this.db.collection("docs").doc(name).get()
        .then(function (doc) { return doc.exists ? doc.data() : null; });
    }
    return Promise.resolve(this._localGet("doc:" + name, null));
  },
  deleteDoc: function (name) {
    if (this.connected) return this.db.collection("docs").doc(name).delete();
    try { localStorage.removeItem("pch_doc:" + name); } catch (e) {}
    return Promise.resolve();
  },

  // ----- localStorage plumbing -----
  _localGet: function (name, fallback) {
    try {
      var raw = localStorage.getItem("pch_" + name);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  },
  _localSet: function (name, val) {
    try { localStorage.setItem("pch_" + name, JSON.stringify(val)); } catch (e) {}
    var cb = this._localWatchers[name] || this._localWatchers["doc:" + name.replace(/^doc:/, "")];
    if (this._localWatchers[name]) this._localWatchers[name](val);
    else if (this._localWatchers["doc:" + name]) this._localWatchers["doc:" + name](val);
  }
};

Store.init();

var OFFLINE_NOTE = "Offline mode — saved on this device only. Connect Firebase (see SETUP.md) to sync with the team.";
var ONLINE_NOTE = "Live — synced with the whole team.";
function setSyncNote(id) {
  var el = $(id);
  if (!el) return;
  el.textContent = Store.connected ? ONLINE_NOTE : OFFLINE_NOTE;
  el.className = "sync-note" + (Store.connected ? " on" : "");
}

/* ============================================================
   Tabs
   ============================================================ */

var tabs = document.querySelectorAll(".tab");
tabs.forEach(function (btn) {
  btn.addEventListener("click", function () {
    tabs.forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
    $("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "chat") scrollChat(true);
  });
});

/* ============================================================
   Countdown
   ============================================================ */

function tickCountdown() {
  var ms = NEXT_RACE_TS - Date.now();
  if (ms < 0) ms = 0;
  var s = Math.floor(ms / 1000);
  $("cdDays").textContent = Math.floor(s / 86400);
  $("cdHours").textContent = Math.floor(s % 86400 / 3600);
  $("cdMins").textContent = Math.floor(s % 3600 / 60);
  $("cdSecs").textContent = s % 60;
}
tickCountdown();
setInterval(tickCountdown, 1000);

/* ============================================================
   Season — results + standings
   ============================================================ */

function renderResults(key) {
  var data = RESULTS[key];
  var html = data.rows.map(function (r) {
    var hl = r[1] === "212" ? ' class="hl"' : "";
    return "<tr" + hl + "><td>" + r[0] + "</td><td>#" + r[1] + "</td><td>" +
      esc(r[2]) + "</td><td>" + r[3] + "</td></tr>";
  }).join("");
  html += data.dnf.map(function (n) {
    return '<tr class="dnf"><td>DNF</td><td></td><td>' + esc(n) + "</td><td>—</td></tr>";
  }).join("");
  $("resultsBody").innerHTML = html;
  $("resultsFootnote").textContent = data.label +
    " — positions per official SCORE results (penalties applied by SCORE; order may differ from raw elapsed times).";
}
document.querySelectorAll(".rtab").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".rtab").forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    renderResults(btn.dataset.race);
  });
});
renderResults("sf250");

var standingsData = DEFAULT_STANDINGS;
var standingsEditing = false;

function renderStandings() {
  var body = $("standingsBody");
  if (standingsEditing) {
    body.innerHTML = standingsData.map(function (r, i) {
      return "<tr data-i='" + i + "'>" +
        '<td><input value="' + esc(r.pos) + '" data-f="pos" style="min-width:44px;width:56px"></td>' +
        '<td><input value="' + esc(r.truck) + '" data-f="truck" style="min-width:54px;width:70px"></td>' +
        '<td><input value="' + esc(r.driver) + '" data-f="driver"></td>' +
        '<td><input value="' + esc(r.points) + '" data-f="points" style="min-width:54px;width:80px"></td></tr>';
    }).join("") +
    '<tr><td colspan="4"><button class="btn btn-ghost btn-small" id="standingsAddRow">+ row</button></td></tr>';
    var add = $("standingsAddRow");
    if (add) add.addEventListener("click", function () {
      collectStandingsInputs();
      standingsData.push({ pos: standingsData.length + 1, truck: "", driver: "", points: "—" });
      renderStandings();
    });
  } else {
    body.innerHTML = standingsData.map(function (r) {
      var hl = String(r.truck) === "212" ? ' class="hl"' : "";
      return "<tr" + hl + "><td>" + esc(r.pos) + "</td><td>#" + esc(r.truck) + "</td><td>" +
        esc(r.driver) + "</td><td>" + esc(r.points) + "</td></tr>";
    }).join("");
  }
}
function collectStandingsInputs() {
  var rows = $("standingsBody").querySelectorAll("tr[data-i]");
  var out = [];
  rows.forEach(function (tr) {
    var r = {};
    tr.querySelectorAll("input").forEach(function (inp) { r[inp.dataset.f] = inp.value.trim(); });
    if (r.driver || r.truck) out.push(r);
  });
  standingsData = out;
}
$("standingsEdit").addEventListener("click", function () {
  if (standingsEditing) {
    collectStandingsInputs();
    Store.setDoc("standings", { rows: standingsData, updated: Date.now() });
    standingsEditing = false;
    this.textContent = "Edit";
  } else {
    standingsEditing = true;
    this.textContent = "Save";
  }
  renderStandings();
});
Store.watchDoc("standings", function (doc) {
  if (doc && doc.rows && doc.rows.length) standingsData = doc.rows;
  if (!standingsEditing) renderStandings();
});

/* ============================================================
   Pit strategy
   ============================================================ */

var pitRows = [];
var pitRace = "baja400";

function pitDocName() { return "pitplan_" + pitRace; }

function renderPitTable() {
  var body = $("pitTableBody");
  if (!pitRows.length) pitRows = [{ mile: "", gal: "", crew: "", notes: "" }];
  body.innerHTML = pitRows.map(function (r, i) {
    return "<tr data-i='" + i + "'>" +
      "<td>" + (i + 1) + "</td>" +
      '<td><input type="number" inputmode="decimal" value="' + esc(r.mile) + '" data-f="mile" placeholder="mile"></td>' +
      '<td><input type="number" inputmode="decimal" value="' + esc(r.gal) + '" data-f="gal" placeholder="gal"></td>' +
      '<td><input value="' + esc(r.crew) + '" data-f="crew" placeholder="crew / chase"></td>' +
      '<td><input value="' + esc(r.notes) + '" data-f="notes" placeholder="notes"></td>' +
      '<td><button class="btn btn-ghost btn-small" data-del="' + i + '">✕</button></td></tr>';
  }).join("");
  body.querySelectorAll("[data-del]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      collectPitInputs();
      pitRows.splice(Number(btn.dataset.del), 1);
      renderPitTable();
    });
  });
}
function collectPitInputs() {
  var rows = $("pitTableBody").querySelectorAll("tr[data-i]");
  var out = [];
  rows.forEach(function (tr) {
    var r = {};
    tr.querySelectorAll("input").forEach(function (inp) { r[inp.dataset.f] = inp.value; });
    out.push(r);
  });
  pitRows = out;
}
$("pitAddRow").addEventListener("click", function () {
  collectPitInputs();
  pitRows.push({ mile: "", gal: "", crew: "", notes: "" });
  renderPitTable();
});
$("pitSave").addEventListener("click", function () {
  collectPitInputs();
  Store.setDoc(pitDocName(), { rows: pitRows, updated: Date.now() });
  this.textContent = "Saved ✓";
  var b = this;
  setTimeout(function () { b.textContent = "Save Plan"; }, 1500);
});
function watchPitPlan() {
  Store.watchDoc(pitDocName(), function (doc) {
    pitRows = (doc && doc.rows) ? doc.rows : [];
    renderPitTable();
  });
}
$("pitRaceSelect").addEventListener("change", function () {
  pitRace = this.value;
  watchPitPlan();
});
watchPitPlan();
setSyncNote("pitSyncNote");

/* ============================================================
   Fuel calculator
   ============================================================ */

var fuelRace = "baja400";
var fuelEntries = [];

function fuelListName() { return "fuel_" + fuelRace; }

function sortedFuel() {
  return fuelEntries.slice().sort(function (a, b) { return Number(a.mile) - Number(b.mile); });
}

function fuelStats() {
  var entries = sortedFuel();
  var prev = 0, totalGal = 0, lastMpg = NaN, legs = [], totalSz = 0;
  entries.forEach(function (e) {
    var mile = Number(e.mile), gal = Number(e.gallons);
    var dist = mile - prev;
    var sz = Math.min(Math.max(Number(e.sz) || 0, 0), Math.max(dist, 0)); // SZ can't exceed the leg
    var race = dist - sz;
    var mpg = gal > 0 ? dist / gal : NaN;
    legs.push({ entry: e, mile: mile, dist: dist, sz: sz, race: race, gal: gal, mpg: mpg });
    totalGal += gal;
    totalSz += sz;
    prev = mile;
    if (isFinite(mpg)) lastMpg = mpg;
  });
  var totalMiles = entries.length ? Number(entries[entries.length - 1].mile) : 0;
  var avgMpg = totalGal > 0 ? totalMiles / totalGal : NaN;
  var s = { legs: legs, totalGal: totalGal, totalMiles: totalMiles, totalSz: totalSz,
            avgMpg: avgMpg, lastMpg: lastMpg };
  var split = solveSplit(legs);
  s.racePace = split.racePace;
  s.szPace = split.szPace;
  s.splitStatus = split.status;
  return s;
}

// Separate race-pace economy from speed-zone economy.
// Each leg burns: gallons = raceMiles/racePace + szMiles/szPace
// Let a = gal per race mile, b = gal per SZ mile — least squares through the origin.
function solveSplit(legs) {
  var usable = legs.filter(function (l) { return l.gal > 0 && l.dist > 0; });
  if (usable.length < 2) return { status: usable.length ? "need2" : "none" };
  if (!usable.some(function (l) { return l.sz > 0; })) return { status: "nosz" };

  var Srr = 0, Sss = 0, Srs = 0, Srg = 0, Ssg = 0;
  usable.forEach(function (l) {
    Srr += l.race * l.race; Sss += l.sz * l.sz; Srs += l.race * l.sz;
    Srg += l.race * l.gal;  Ssg += l.sz * l.gal;
  });
  var det = Srr * Sss - Srs * Srs;
  // Near-zero determinant = every leg has the same race/SZ mix, so the two
  // rates can't be told apart from this data.
  if (Math.abs(det) < 1e-9 || Sss === 0) return { status: "degenerate" };

  var a = (Srg * Sss - Ssg * Srs) / det; // gal per race mile
  var b = (Ssg * Srr - Srg * Srs) / det; // gal per speed-zone mile
  if (!(a > 0) || !(b > 0)) return { status: "unstable" };

  var racePace = 1 / a, szPace = 1 / b;
  // Speed zones should be the thriftier miles; if the math says otherwise the
  // sample is too noisy to trust rather than a real finding.
  if (szPace <= racePace) return { status: "noisy", racePace: racePace, szPace: szPace };
  return { status: "ok", racePace: racePace, szPace: szPace };
}

var SPLIT_MESSAGES = {
  none: "",
  need2: "Log a second pit with speed-zone miles to separate race pace from speed-zone pace.",
  nosz: "Add speed-zone miles to your pit entries and the calculator will split race pace from speed-zone pace.",
  degenerate: "Every leg has the same speed-zone mix, so the two rates can't be separated yet — they'll split once a leg differs.",
  unstable: "Not enough spread in the data yet to separate the two rates reliably.",
  noisy: "The split came out with speed zones burning more than race pace — that's almost certainly noise in a small sample, so only the blended number is shown."
};

function renderFuel() {
  var s = fuelStats();
  $("statAvgMpg").textContent = fmt(s.avgMpg);
  $("statLastMpg").textContent = fmt(s.lastMpg);
  $("statRange").textContent = isFinite(s.avgMpg) ? Math.floor(s.avgMpg * FUEL_CELL_GALLONS) : "–";
  $("statTotal").textContent = fmt(s.totalGal, 1);

  var showSplit = s.splitStatus === "ok";
  $("statRacePace").textContent = showSplit ? fmt(s.racePace) : "–";
  $("statSzPace").textContent = showSplit ? fmt(s.szPace) : "–";
  $("splitNote").innerHTML = showSplit
    ? "Speed-zone miles are running <strong>" + fmt(s.szPace / s.racePace * 100 - 100, 0) +
      "% better</strong> than race pace (" + fmt(s.szPace) + " vs " + fmt(s.racePace) +
      " mi/gal) across " + fmt(s.totalSz, 0) + " speed-zone miles logged."
    : (SPLIT_MESSAGES[s.splitStatus] || "");

  $("fuelTableBody").innerHTML = s.legs.map(function (l, i) {
    return "<tr><td>" + (i + 1) + "</td><td>" + fmt(l.mile, 1) + "</td><td>" + fmt(l.dist, 1) +
      "</td><td>" + fmt(l.race, 1) + "</td><td>" + (l.sz > 0 ? fmt(l.sz, 1) : "<span class='muted'>–</span>") +
      "</td><td>" + fmt(l.gal, 1) + "</td><td><strong>" + fmt(l.mpg) + "</strong></td><td>" +
      esc(l.entry.note || "") + '</td><td><button class="btn btn-ghost btn-small" data-fdel="' +
      esc(l.entry.id) + '">✕</button></td></tr>';
  }).join("") || '<tr><td colspan="9" class="muted">No pits logged yet for this race.</td></tr>';

  document.querySelectorAll("[data-fdel]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      Store.deleteItem(fuelListName(), btn.dataset.fdel);
    });
  });
  renderProjection(s);
  renderFob();
}

// Race-distance projection: what the whole race costs at the pace we're seeing.
function renderProjection(s) {
  var el = $("fuelProjection");
  var dist = RACE_DISTANCE[fuelRace];
  if (!dist) { el.innerHTML = ""; return; }
  if (!isFinite(s.avgMpg) || s.avgMpg <= 0) {
    el.innerHTML = "<strong>" + dist + " mi</strong> race distance. Log a pit to project total fuel needed.";
    return;
  }

  var courseSz = parseFloat($("courseSz").value);
  var useSplit = s.splitStatus === "ok" && isFinite(courseSz) && courseSz > 0 && courseSz < dist;
  var needed, basis;
  if (useSplit) {
    // Split projection: race miles and speed-zone miles burn at their own rates.
    needed = (dist - courseSz) / s.racePace + courseSz / s.szPace;
    basis = "Splitting <strong>" + fmt(dist - courseSz, 0) + " race mi</strong> at " +
      fmt(s.racePace) + " and <strong>" + fmt(courseSz, 0) + " speed-zone mi</strong> at " +
      fmt(s.szPace) + " mi/gal, ";
  } else {
    needed = dist / s.avgMpg;
    basis = "At <strong>" + fmt(s.avgMpg) + " mi/gal</strong> blended, ";
  }

  var fills = Math.max(0, Math.ceil((needed - FUEL_CELL_GALLONS) / FUEL_CELL_GALLONS));
  var remaining = Math.max(0, dist - s.totalMiles);
  var remainingGal = remaining / (useSplit ? s.racePace : s.avgMpg);
  el.innerHTML = basis + "the full <strong>" + dist +
    " mi</strong> needs about <strong>" + fmt(needed, 1) + " gal</strong> — " +
    "a full 89-gal cell plus <strong>" + fmt(needed - FUEL_CELL_GALLONS, 1) + " gal</strong> " +
    "(minimum <strong>" + fills + "</strong> refuel" + (fills === 1 ? "" : "s") + ").<br>" +
    "<span class=\"muted\">" + fmt(remaining, 0) + " mi still to run ≈ " + fmt(remainingGal, 1) + " gal." +
    (s.splitStatus === "ok" && !useSplit
      ? " Enter the course's speed-zone miles above for a split projection."
      : "") + "</span>";
}
$("courseSz").addEventListener("input", function () { renderProjection(fuelStats()); });

$("fuelAdd").addEventListener("click", function () {
  var mile = parseFloat($("fuelMile").value);
  var gal = parseFloat($("fuelGallons").value);
  var sz = parseFloat($("fuelSz").value);
  if (!isFinite(mile) || mile < 0) { $("fuelMile").focus(); return; }
  if (!isFinite(gal) || gal <= 0) { $("fuelGallons").focus(); return; }
  Store.addItem(fuelListName(), {
    mile: mile, gallons: gal,
    sz: isFinite(sz) && sz > 0 ? sz : 0,
    note: $("fuelNote").value.trim()
  });
  ["fuelMile", "fuelGallons", "fuelSz", "fuelNote"].forEach(function (id) { $(id).value = ""; });
});

function watchFuel() {
  Store.watchList(fuelListName(), function (items) {
    fuelEntries = items;
    renderFuel();
  });
}
$("fuelRaceSelect").addEventListener("change", function () {
  fuelRace = this.value;
  watchFuel();
});
watchFuel();
setSyncNote("fuelSyncNote");

/* ----- fuel on board ----- */
function renderFob() {
  var mile = parseFloat($("fobMile").value);
  var s = fuelStats();
  var mpgInput = parseFloat($("fobMpg").value);
  var mpg = isFinite(mpgInput) && mpgInput > 0 ? mpgInput : s.avgMpg;
  var fill = $("fobGaugeFill"), txt = $("fobText");

  if (!isFinite(mile)) {
    fill.style.width = "100%"; fill.className = "fuel-gauge-fill";
    txt.className = "fob-text";
    txt.textContent = "Enter the truck's current mile to estimate fuel on board.";
    return;
  }
  if (!isFinite(mpg) || mpg <= 0) {
    txt.className = "fob-text";
    txt.textContent = "Log at least one pit (or type an assumed mi/gal) to calculate.";
    return;
  }
  var lastFillMile = s.legs.length ? s.legs[s.legs.length - 1].mile : 0;
  var milesSinceFill = Math.max(0, mile - lastFillMile);
  var used = milesSinceFill / mpg;
  var remaining = Math.max(0, FUEL_CELL_GALLONS - used);
  var rangeLeft = remaining * mpg;
  var pct = remaining / FUEL_CELL_GALLONS * 100;

  fill.style.width = pct.toFixed(1) + "%";
  fill.className = "fuel-gauge-fill" + (pct < 20 ? " low" : "");
  txt.className = "fob-text" + (pct < 20 ? " warn" : "");
  txt.innerHTML = "Last fill at mile <strong>" + fmt(lastFillMile, 0) + "</strong> · " +
    fmt(milesSinceFill, 0) + " mi since · burned ≈ <strong>" + fmt(used, 1) +
    " gal</strong><br>On board ≈ <strong>" + fmt(remaining, 1) + " gal (" + pct.toFixed(0) +
    "%)</strong> · range left ≈ <strong>" + fmt(rangeLeft, 0) + " mi</strong> at " + fmt(mpg) + " mi/gal";
}
$("fobMile").addEventListener("input", renderFob);
$("fobMpg").addEventListener("input", renderFob);

/* ============================================================
   GPS files
   ============================================================ */

fetch("gps/manifest.json")
  .then(function (r) { return r.json(); })
  .then(function (files) {
    if (!files.length) {
      $("gpsList").innerHTML = '<p class="muted">No course files posted yet. GPS files for the Baja 400 will show up here once SCORE releases the course.</p>';
      return;
    }
    var ICONS = { kml: "🛰️", kmz: "🛰️", gpx: "🛰️", pdf: "🗺️", usr: "📡" };
    function itemHtml(f) {
      var ext = String(f.file).split(".").pop().toLowerCase();
      // PDFs preview in a new tab; GPS formats download (browsers can't render them)
      var isPdf = ext === "pdf";
      var attrs = isPdf ? 'target="_blank" rel="noopener"' : "download";
      return '<a class="gps-item" href="gps/' + encodeURIComponent(f.file) + '" ' + attrs + ">" +
        '<span class="gps-icon">' + (ICONS[ext] || "📄") + "</span>" +
        '<span class="gps-body"><span class="gps-name">' + esc(f.name) + "</span>" +
        (f.desc ? '<span class="gps-desc">' + esc(f.desc) + "</span>" : "") +
        '<span class="gps-meta">' + esc(f.file) +
        (f.size ? " · " + esc(f.size) : "") +
        " · " + (isPdf ? "opens in new tab" : "download") + "</span></span></a>";
    }
    // Group files under headings, preserving manifest order.
    var groups = [];
    files.forEach(function (f) {
      var key = f.group || "Files";
      var g = groups.filter(function (x) { return x.key === key; })[0];
      if (!g) { g = { key: key, items: [] }; groups.push(g); }
      g.items.push(f);
    });
    $("gpsList").innerHTML = groups.map(function (g) {
      return '<div class="gps-group"><div class="gps-group-title">' + esc(g.key) + "</div>" +
        g.items.map(itemHtml).join("") + "</div>";
    }).join("");
  })
  .catch(function () {
    $("gpsList").innerHTML = '<p class="muted">Couldn’t load gps/manifest.json — check that the file exists and is valid JSON.</p>';
  });

/* ============================================================
   Chat + notices
   ============================================================ */

function getName(forceAsk) {
  var name = localStorage.getItem("pch_name");
  if (!name || forceAsk) {
    name = (prompt("Name to show in team chat:", name || "") || "").trim();
    if (name) localStorage.setItem("pch_name", name);
  }
  return name;
}
$("chatChangeName").addEventListener("click", function () { getName(true); });

var chatAtBottom = true;
var chatWindow = $("chatWindow");
chatWindow.addEventListener("scroll", function () {
  chatAtBottom = chatWindow.scrollTop + chatWindow.clientHeight >= chatWindow.scrollHeight - 60;
});
function scrollChat(force) {
  if (force || chatAtBottom) chatWindow.scrollTop = chatWindow.scrollHeight;
}

Store.watchList("chat", function (items) {
  var me = localStorage.getItem("pch_name");
  if (!items.length) {
    chatWindow.innerHTML = '<div class="chat-msg system">No messages yet — say something to the team 🏁</div>';
    return;
  }
  chatWindow.innerHTML = items.map(function (m) {
    var mine = me && m.name === me ? " mine" : "";
    return '<div class="chat-msg' + mine + '"><div class="meta"><span class="who">' +
      esc(m.name) + "</span> · " + timeLabel(m.ts) + '</div><div class="bubble">' +
      esc(m.text) + "</div></div>";
  }).join("");
  scrollChat(false);
});

function sendChat() {
  var text = $("chatInput").value.trim();
  if (!text) return;
  var name = getName(false);
  if (!name) return;
  Store.addItem("chat", { name: name, text: text });
  $("chatInput").value = "";
  chatAtBottom = true;
}
$("chatSend").addEventListener("click", sendChat);
$("chatInput").addEventListener("keydown", function (e) { if (e.key === "Enter") sendChat(); });
setSyncNote("chatSyncNote");

/* ----- notice board (home) ----- */
Store.watchList("notices", function (items) {
  var recent = items.slice(-5).reverse();
  $("noticeBoard").innerHTML = recent.length
    ? recent.map(function (n) {
        return '<div class="notice">' + esc(n.text) + '<div class="meta">' +
          esc(n.name) + " · " + timeLabel(n.ts) + "</div></div>";
      }).join("")
    : '<p class="muted">Nothing posted yet. Race-week schedules, tracking links, and meet-up times go here.</p>';
});
$("noticePost").addEventListener("click", function () {
  var text = $("noticeInput").value.trim();
  if (!text) return;
  var name = getName(false);
  if (!name) return;
  Store.addItem("notices", { name: name, text: text });
  $("noticeInput").value = "";
});
$("noticeInput").addEventListener("keydown", function (e) { if (e.key === "Enter") $("noticePost").click(); });

/* ============================================================
   Hotels
   ============================================================ */

var hotelRace = "baja400";
function hotelListName() { return "hotels_" + hotelRace; }

function watchHotels() {
  Store.watchList(hotelListName(), function (items) {
    if (!items.length) {
      $("hotelList").innerHTML = '<p class="muted">No hotel info yet for this race — it’ll be posted here as soon as it’s booked.</p>';
      return;
    }
    $("hotelList").innerHTML = items.map(function (h) {
      return '<div class="hotel-card">' +
        '<button class="btn btn-ghost btn-small hotel-del" data-hdel="' + esc(h.id) + '">✕</button>' +
        "<h3>" + esc(h.name) + "</h3>" +
        (h.address ? '<div class="hotel-row"><b>Where:</b> <a href="https://maps.google.com/?q=' +
          encodeURIComponent(h.address) + '" target="_blank" rel="noopener" style="color:var(--volt)">' + esc(h.address) + "</a></div>" : "") +
        (h.dates ? '<div class="hotel-row"><b>Dates:</b> ' + esc(h.dates) + "</div>" : "") +
        (h.conf ? '<div class="hotel-row"><b>Confirmation:</b> ' + esc(h.conf) + "</div>" : "") +
        (h.who ? '<div class="hotel-row"><b>Staying:</b> ' + esc(h.who) + "</div>" : "") +
        (h.notes ? '<div class="hotel-row"><b>Notes:</b> ' + esc(h.notes) + "</div>" : "") +
        "</div>";
    }).join("");
    document.querySelectorAll("[data-hdel]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (confirm("Remove this hotel entry?")) Store.deleteItem(hotelListName(), btn.dataset.hdel);
      });
    });
  });
}
$("hotelRaceSelect").addEventListener("change", function () {
  hotelRace = this.value;
  watchHotels();
});
watchHotels();
setSyncNote("hotelSyncNote");

$("hotelAdd").addEventListener("click", function () {
  var name = $("hName").value.trim();
  if (!name) { $("hName").focus(); return; }
  Store.addItem(hotelListName(), {
    name: name,
    address: $("hAddress").value.trim(),
    dates: $("hDates").value.trim(),
    conf: $("hConf").value.trim(),
    who: $("hWho").value.trim(),
    notes: $("hNotes").value.trim()
  });
  ["hName", "hAddress", "hDates", "hConf", "hWho", "hNotes"].forEach(function (id) { $(id).value = ""; });
  $("hotelFormWrap").open = false;
});

/* ============================================================
   Vehicle paperwork
   ============================================================ */

// Seeded from Baja_400_Vehicle_List.xlsx (Sep 2026).
var VEHICLE_SEED = [
  { id: "v1", name: "Pre runner ME", desc: "Grey RZR Pro R MPI st. wheel", vin: "3NSRGL2K6PG326554", plate: "CTA3AT" },
  { id: "v2", name: "Pre runner BP", desc: "Grey RZR Pro R U.S. flag roof", vin: "3NSRGD2K7RG331495", plate: "EEC389" },
  { id: "v3", name: "White RZR", desc: "White RZR", vin: "3NSRPK2K2TG228092", plate: "" },
  { id: "v4", name: "Chase 1", desc: "White Ford F-350 black interior", vin: "1FT8W3BT3SEC67651", plate: "14905K4" },
  { id: "v5", name: "Chase 2", desc: "White Ford F-350 tan interior", vin: "1FT8W3BT9TEC66389", plate: "14906K4" },
  { id: "v6", name: "Big Tex Trailer", desc: "Big Tex trailer 42'", vin: "16VPX2522F2094965", plate: "4PP3240" },
  { id: "v7", name: "Fast Chase", desc: "Black Ford Raptor w/tire rack", vin: "1FTFW1RG2JFD13208", plate: "14033N2" },
  { id: "v8", name: "Service Body", desc: "White Ford F-350 XLT Service Body", vin: "", plate: "",
    note: "VIN and plate still needed before the border crossing." }
];
var DOC_KINDS = [["reg", "Registration"], ["ins", "Insurance"]];
var BAJA1000_END = new Date("2026-11-15T23:59:59-08:00").getTime();
var FILE_B64_CAP = 950000; // Firestore doc limit is 1 MiB; keep headroom

var vehState = null;

function freshVehState() {
  return { list: VEHICLE_SEED.map(function (v) {
    return { id: v.id, name: v.name, desc: v.desc, vin: v.vin, plate: v.plate, note: v.note || "",
      reg: { inv: false, exp: "" }, ins: { inv: false, exp: "" }, files: [] };
  }) };
}
function saveVehState() { Store.setDoc("vehicles", vehState); }

// exp is "YYYY-MM-DD" from a date input
function expStatus(exp) {
  if (!exp) return { cls: "gray", label: "no date set" };
  var t = new Date(exp + "T23:59:59").getTime();
  if (t < Date.now()) return { cls: "red", label: "EXPIRED " + exp };
  if (t < BAJA1000_END) return { cls: "amber", label: "expires " + exp + " — before Baja 1000 ends" };
  return { cls: "green", label: "valid thru " + exp };
}
function docReady(d) {
  var s = expStatus(d.exp);
  return d.inv && s.cls !== "red" && s.cls !== "gray";
}
function vehReady(v) { return docReady(v.reg) && docReady(v.ins); }

function renderVehicles() {
  if (!vehState) return;
  var ready = vehState.list.filter(vehReady).length, total = vehState.list.length;
  $("readyBar").style.width = (total ? ready / total * 100 : 0) + "%";
  $("readyBar").className = "fuel-gauge-fill" + (ready < total ? " low" : "");
  $("readySummary").textContent = ready + " of " + total + " vehicles border-ready";

  $("vehicleList").innerHTML = vehState.list.map(function (v) {
    var docsHtml = DOC_KINDS.map(function (k) {
      var kind = k[0], label = k[1], d = v[kind];
      var st = expStatus(d.exp);
      var files = (v.files || []).filter(function (f) { return f.kind === kind; });
      var filesHtml = files.map(function (f) {
        return '<span class="vfile">' +
          '<a href="#" data-vview="' + f.id + '">' + esc(f.label) + "</a>" +
          ' <button class="vfile-x" data-vfdel="' + f.id + '" data-vid="' + v.id + '" title="delete">✕</button></span>';
      }).join("");
      return '<div class="vdoc">' +
        '<div class="vdoc-head"><span class="vdoc-title">' + label + '</span>' +
        '<span class="exp-pill ' + st.cls + '">' + esc(st.label) + "</span></div>" +
        '<div class="vdoc-row">' +
          '<label class="chk"><input type="checkbox" data-vinv="' + v.id + ":" + kind + '"' + (d.inv ? " checked" : "") + "> in vehicle</label>" +
          '<input type="date" data-vexp="' + v.id + ":" + kind + '" value="' + esc(d.exp) + '" title="expiration date">' +
          '<label class="btn btn-ghost btn-small upload-btn">📷 upload' +
            '<input type="file" accept="image/*,application/pdf" data-vup="' + v.id + ":" + kind + '" hidden></label>' +
        "</div>" +
        (filesHtml ? '<div class="vfiles">' + filesHtml + "</div>" : "") +
        "</div>";
    }).join("");

    return '<div class="card vcard' + (vehReady(v) ? " vready" : "") + '">' +
      '<div class="vhead">' +
        '<div><span class="vname">' + esc(v.name) + '</span> <span class="muted">' + esc(v.desc) + "</span></div>" +
        '<span class="ready-pill ' + (vehReady(v) ? "green" : "gray") + '">' + (vehReady(v) ? "✓ READY" : "not ready") + "</span>" +
      "</div>" +
      '<div class="vmeta">VIN: <code>' + (v.vin ? esc(v.vin) : "—") + "</code> · Plate: <code>" +
        (v.plate ? esc(v.plate) : "—") + '</code> <button class="btn btn-ghost btn-small" data-vedit="' + v.id + '">edit</button></div>' +
      (v.note ? '<div class="vnote">⚠ ' + esc(v.note) + "</div>" : "") +
      '<div class="vdocs">' + docsHtml + "</div></div>";
  }).join("");

  bindVehicleEvents();
}

function bindVehicleEvents() {
  var root = $("vehicleList");
  root.querySelectorAll("[data-vinv]").forEach(function (el) {
    el.addEventListener("change", function () {
      var p = el.dataset.vinv.split(":");
      findVeh(p[0])[p[1]].inv = el.checked;
      saveVehState(); renderVehicles();
    });
  });
  root.querySelectorAll("[data-vexp]").forEach(function (el) {
    el.addEventListener("change", function () {
      var p = el.dataset.vexp.split(":");
      findVeh(p[0])[p[1]].exp = el.value;
      saveVehState(); renderVehicles();
    });
  });
  root.querySelectorAll("[data-vup]").forEach(function (el) {
    el.addEventListener("change", function () {
      if (el.files && el.files[0]) {
        var p = el.dataset.vup.split(":");
        uploadVehicleFile(p[0], p[1], el.files[0]);
      }
    });
  });
  root.querySelectorAll("[data-vview]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); viewVehicleFile(el.dataset.vview); });
  });
  root.querySelectorAll("[data-vfdel]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (!confirm("Delete this document?")) return;
      var v = findVeh(el.dataset.vid);
      v.files = v.files.filter(function (f) { return f.id !== el.dataset.vfdel; });
      Store.deleteDoc("vfile_" + el.dataset.vfdel);
      saveVehState(); renderVehicles();
    });
  });
  root.querySelectorAll("[data-vedit]").forEach(function (el) {
    el.addEventListener("click", function () {
      var v = findVeh(el.dataset.vedit);
      var vin = prompt("VIN for " + v.name + ":", v.vin); if (vin === null) return;
      var plate = prompt("License plate for " + v.name + ":", v.plate); if (plate === null) return;
      v.vin = vin.trim(); v.plate = plate.trim();
      // clear the fill-me-in note once both are present
      if (v.vin && v.plate && /still needed/.test(v.note || "")) v.note = "";
      saveVehState(); renderVehicles();
    });
  });
}
function findVeh(id) {
  return vehState.list.filter(function (v) { return v.id === id; })[0];
}

/* ----- file upload: compress images client-side to fit one Firestore doc ----- */
function uploadVehicleFile(vid, kind, file) {
  var v = findVeh(vid);
  var isPdf = file.type === "application/pdf";
  var finish = function (dataUrl) {
    if (dataUrl.length > FILE_B64_CAP) {
      alert("That file is too large even after compression. Take a straight-on photo of the document instead of scanning at high resolution.");
      return;
    }
    var id = "f" + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
    var label = (kind === "reg" ? "Registration" : "Insurance") + (isPdf ? " (PDF)" : " (photo)");
    Store.setDoc("vfile_" + id, { data: dataUrl, name: file.name, ts: Date.now() }).then(function () {
      v.files = v.files || [];
      v.files.push({ id: id, kind: kind, label: label, ts: Date.now() });
      saveVehState(); renderVehicles();
    }).catch(function (e) {
      alert("Upload failed: " + e.message);
    });
  };

  if (isPdf) {
    if (file.size > 700 * 1024) {
      alert("PDF is over 700 KB — too big to store. Photograph the document instead, or export a smaller PDF.");
      return;
    }
    var fr = new FileReader();
    fr.onload = function () { finish(fr.result); };
    fr.readAsDataURL(file);
    return;
  }

  // image: draw to canvas, step quality/scale down until under the cap
  var img = new Image();
  var url = URL.createObjectURL(file);
  img.onload = function () {
    URL.revokeObjectURL(url);
    var steps = [[1600, 0.75], [1600, 0.6], [1200, 0.6], [1000, 0.5], [800, 0.4]];
    var out = null;
    for (var i = 0; i < steps.length; i++) {
      var maxDim = steps[i][0], q = steps[i][1];
      var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      var c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      out = c.toDataURL("image/jpeg", q);
      if (out.length <= FILE_B64_CAP) break;
    }
    finish(out);
  };
  img.onerror = function () { URL.revokeObjectURL(url); alert("Couldn't read that image."); };
  img.src = url;
}

function viewVehicleFile(id) {
  Store.getDoc("vfile_" + id).then(function (doc) {
    if (!doc || !doc.data) { alert("File not found — it may have been deleted."); return; }
    // data: URLs can't be opened as a top-level page — convert to a blob URL
    var parts = doc.data.split(",");
    var mime = parts[0].match(/data:(.*?);/)[1];
    var bin = atob(parts[1]);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(blobUrl, "_blank");
  });
}

Store.watchDoc("vehicles", function (doc) {
  if (doc && doc.list && doc.list.length) {
    vehState = doc;
  } else if (!vehState) {
    vehState = freshVehState();
    saveVehState();
  }
  renderVehicles();
});
setSyncNote("vehicleSyncNote");

/* ============================================================
   Footer status
   ============================================================ */

$("connStatus").textContent = Store.connected
  ? "● team sync on"
  : "○ offline mode — see SETUP.md to enable team sync";

})();
