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

// Green flag ~6:00 AM PT on race Saturday of Baja 400 week (Sep 12, 2026).
var NEXT_RACE_TS = new Date("2026-09-12T06:00:00-07:00").getTime();

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
  var prev = 0, totalGal = 0, lastMpg = NaN, legs = [];
  entries.forEach(function (e) {
    var mile = Number(e.mile), gal = Number(e.gallons);
    var dist = mile - prev;
    var mpg = gal > 0 ? dist / gal : NaN;
    legs.push({ entry: e, mile: mile, dist: dist, gal: gal, mpg: mpg });
    totalGal += gal;
    prev = mile;
    if (isFinite(mpg)) lastMpg = mpg;
  });
  var totalMiles = entries.length ? Number(entries[entries.length - 1].mile) : 0;
  var avgMpg = totalGal > 0 ? totalMiles / totalGal : NaN;
  return { legs: legs, totalGal: totalGal, totalMiles: totalMiles, avgMpg: avgMpg, lastMpg: lastMpg };
}

function renderFuel() {
  var s = fuelStats();
  $("statAvgMpg").textContent = fmt(s.avgMpg);
  $("statLastMpg").textContent = fmt(s.lastMpg);
  $("statRange").textContent = isFinite(s.avgMpg) ? Math.floor(s.avgMpg * FUEL_CELL_GALLONS) : "–";
  $("statTotal").textContent = fmt(s.totalGal, 1);

  $("fuelTableBody").innerHTML = s.legs.map(function (l, i) {
    return "<tr><td>" + (i + 1) + "</td><td>" + fmt(l.mile, 1) + "</td><td>" + fmt(l.dist, 1) +
      "</td><td>" + fmt(l.gal, 1) + "</td><td><strong>" + fmt(l.mpg) + "</strong></td><td>" +
      esc(l.entry.note || "") + '</td><td><button class="btn btn-ghost btn-small" data-fdel="' +
      esc(l.entry.id) + '">✕</button></td></tr>';
  }).join("") || '<tr><td colspan="7" class="muted">No pits logged yet for this race.</td></tr>';

  document.querySelectorAll("[data-fdel]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      Store.deleteItem(fuelListName(), btn.dataset.fdel);
    });
  });
  renderFob();
}

$("fuelAdd").addEventListener("click", function () {
  var mile = parseFloat($("fuelMile").value);
  var gal = parseFloat($("fuelGallons").value);
  if (!isFinite(mile) || mile < 0) { $("fuelMile").focus(); return; }
  if (!isFinite(gal) || gal <= 0) { $("fuelGallons").focus(); return; }
  Store.addItem(fuelListName(), { mile: mile, gallons: gal, note: $("fuelNote").value.trim() });
  $("fuelMile").value = ""; $("fuelGallons").value = ""; $("fuelNote").value = "";
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
    $("gpsList").innerHTML = files.map(function (f) {
      return '<a class="gps-item" href="gps/' + esc(f.file) + '" download>' +
        '<span class="gps-icon">🛰️</span><span><span class="gps-name">' + esc(f.name) +
        '</span><br><span class="gps-meta">' + esc(f.file) + (f.desc ? " · " + esc(f.desc) : "") +
        "</span></span></a>";
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
   Footer status
   ============================================================ */

$("connStatus").textContent = Store.connected
  ? "● team sync on"
  : "○ offline mode — see SETUP.md to enable team sync";

})();
