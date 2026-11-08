"use strict";

// ---------------- config (same as the PC version) ----------------
const WINNING_SCORE = 11;
const USE_EXPLICIT = true;
const MAX_SCORE = 99;

const SOUNDS = {
  go: "audio/321go.wav",
  easports: "audio/EASports.wav",
  nice: "audio/nice.wav",
  stop: USE_EXPLICIT ? "audio/stop_drinking_explicit.wav" : "audio/stop_drinking.wav",
};

// ---------------- state ----------------
const state = {
  home: 0,
  away: 0,
  serve: "away",        // who is serving: "away" | "home"
  firstServer: "away",  // who served first this game
  pending: null,        // seconds of a timer waiting to be started, or null
  pendingIsWin: false,  // pending timer is the post-game chug (resets scores)
  busy: false,          // blinking or timer running: ignore input
};

const $ = (id) => document.getElementById(id);
const el = {
  board: $("board"),
  home: $("home-score"),
  away: $("away-score"),
  timer: $("timer"),
  splash: $("splash"),
  timerButtons: [...document.querySelectorAll("#controls button[data-timer]")],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- audio ----------------
// Web Audio with pre-decoded buffers gives instant, reliable playback on iOS.
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioCtx ? new AudioCtx() : null;
const buffers = {};

// Play through the silent switch (Safari 16.4+).
if (navigator.audioSession) {
  try { navigator.audioSession.type = "playback"; } catch (_) {}
}

async function loadSounds() {
  if (!audioCtx) return;
  await Promise.all(Object.entries(SOUNDS).map(async ([name, url]) => {
    try {
      const data = await (await fetch(url)).arrayBuffer();
      buffers[name] = await new Promise((res, rej) =>
        audioCtx.decodeAudioData(data, res, rej));
    } catch (e) {
      console.warn("could not load", url, e);
    }
  }));
}
const soundsLoaded = loadSounds();

// iOS can suspend or "interrupt" the audio context at any time (idle, calls,
// switching apps). Resume it on every touch, and play a silent buffer the first
// time so the context is unlocked inside a real user gesture.
let unlocked = false;
function unlockAudio() {
  if (!audioCtx) return;
  if (audioCtx.state !== "running") audioCtx.resume().catch(() => {});
  if (!unlocked) {
    const src = audioCtx.createBufferSource();
    src.buffer = audioCtx.createBuffer(1, 1, 22050);
    src.connect(audioCtx.destination);
    src.start(0);
    unlocked = true;
  }
}
["pointerdown", "touchstart", "touchend", "click", "keydown"].forEach((type) =>
  document.addEventListener(type, unlockAudio, { capture: true, passive: true }));

// Plays a sound and resolves when it finishes (like the blocking playsound()).
async function play(name) {
  const buf = buffers[name];
  if (!audioCtx || !buf) return;
  if (audioCtx.state !== "running") {
    try {
      await Promise.race([audioCtx.resume(), sleep(300)]);
    } catch (_) {}
  }
  return new Promise((resolve) => {
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.onended = resolve;
    src.start();
    // safety net in case onended never fires
    setTimeout(resolve, buf.duration * 1000 + 500);
  });
}

// ---------------- screen wake lock ----------------
let wakeLock = null;
async function keepAwake() {
  try {
    if ("wakeLock" in navigator && document.visibilityState === "visible") {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (_) {}
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    keepAwake();
    if (audioCtx && audioCtx.state !== "running") audioCtx.resume();
  }
});

// ---------------- rendering ----------------
// The Seven Segment font is proportional ("1" is much narrower than "8"), so
// a centered countdown jumps sideways as digits change. Give every digit a
// fixed-width box instead.
function showSeconds(seconds) {
  el.timer.innerHTML = [...seconds.toFixed(1)]
    .map((c) => (c === "." ? "." : `<span class="digit">${c}</span>`))
    .join("");
}

function render() {
  el.home.textContent = state.home;
  el.away.textContent = state.away;
  if (state.pending !== null) {
    showSeconds(state.pending);
  } else {
    el.timer.textContent = state.serve === "home" ? "  ->" : "<-  ";
  }
  el.timerButtons.forEach((b) =>
    b.classList.toggle("active", !state.pendingIsWin && Number(b.dataset.timer) === state.pending));
  el.board.classList.toggle("busy", state.busy);
  if (window.onBoardChange) window.onBoardChange();
}

// ---------------- game logic ----------------
const toggleServe = () => { state.serve = state.serve === "home" ? "away" : "home"; };
const serveChangesAt = (total) => total % 2 === 0 || total > 20;

function addPoint(team) {
  if (state[team] >= MAX_SCORE) return;
  if (state.home === 0 && state.away === 0) state.firstServer = state.serve;
  state[team] += 1;
  if (serveChangesAt(state.home + state.away)) toggleServe();
  afterScoreChange();
}

function removePoint(team) {
  if (state[team] <= 0) return;
  if (serveChangesAt(state.home + state.away)) toggleServe();
  state[team] -= 1;
  afterScoreChange();
}

async function afterScoreChange() {
  render();
  const { home, away } = state;

  if ((home === 9 && away === 6) || (home === 6 && away === 9)) play("nice");

  if ((home >= WINNING_SCORE || away >= WINNING_SCORE) && Math.abs(home - away) > 1) {
    state.busy = true;
    state.pending = 5;
    state.pendingIsWin = true;
    await sleep(250);
    render();
    await blink(home > away ? el.home : el.away, 5);
    state.busy = false;
    render();
  }
}

async function blink(scoreEl, times) {
  for (let i = 0; i < times; i++) {
    scoreEl.style.visibility = "hidden";
    await sleep(250);
    scoreEl.style.visibility = "visible";
    await sleep(250);
  }
}

async function runTimer() {
  const seconds = state.pending;
  const isWin = state.pendingIsWin;
  state.busy = true;
  render();

  await play("go");

  const end = performance.now() + seconds * 1000;
  await new Promise((resolve) => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((end - performance.now()) / 100) / 10);
      showSeconds(left);
      if (left > 0) requestAnimationFrame(tick); else resolve();
    };
    tick();
  });

  await play("stop");

  if (isWin) {
    state.home = 0;
    state.away = 0;
    state.serve = state.firstServer;
  }
  state.pending = null;
  state.pendingIsWin = false;
  state.busy = false;
  render();
}

// ---------------- input ----------------
const SWIPE_PX = 40;
const LONG_PRESS_MS = 550;

// Tap = +1, swipe down or long-press = -1.
function bindTeamZone(zone) {
  const team = zone.dataset.team;
  let start = null;
  let pressTimer = null;

  zone.addEventListener("pointerdown", (e) => {
    start = { x: e.clientX, y: e.clientY, handled: false };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      if (!start || state.busy || state.pending !== null) return;
      start.handled = true;
      removePoint(team);
    }, LONG_PRESS_MS);
  });

  zone.addEventListener("pointerup", (e) => {
    clearTimeout(pressTimer);
    if (!start || start.handled) { start = null; return; }
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (state.busy) return;
    if (state.pending !== null) { runTimer(); return; }
    if (dy > SWIPE_PX && Math.abs(dy) > Math.abs(dx)) removePoint(team);
    else if (Math.abs(dx) < SWIPE_PX && Math.abs(dy) < SWIPE_PX) addPoint(team);
  });

  zone.addEventListener("pointercancel", () => { clearTimeout(pressTimer); start = null; });
}
bindTeamZone($("away-zone"));
bindTeamZone($("home-zone"));

// Tap center = switch serve (or start a pending timer).
$("center-zone").addEventListener("click", () => {
  if (state.busy) return;
  if (state.pending !== null) { runTimer(); return; }
  toggleServe();
  render();
});
// Tapping the title also starts a pending timer.
$("title").addEventListener("click", () => {
  if (!state.busy && state.pending !== null) runTimer();
});

// Timer buttons arm a timer; tap the same one again to cancel it.
el.timerButtons.forEach((b) => b.addEventListener("click", () => {
  if (state.busy || state.pendingIsWin) return;
  const secs = Number(b.dataset.timer);
  state.pending = state.pending === secs ? null : secs;
  render();
}));

function resetScores() {
  Object.assign(state, { home: 0, away: 0, serve: state.firstServer, pending: null, pendingIsWin: false });
  render();
}
$("reset").addEventListener("click", () => {
  if (state.busy) return;
  if (!confirm("Reset the score to 0-0?")) return;
  resetScores();
});

// ---------------- commands from a number pad or phone remote (remote.js) ----------------
// Same rules as touch: while a timer is armed, a point press starts it instead.
const TIMERS = el.timerButtons.map((b) => Number(b.dataset.timer));
function command(cmd) {
  if (!el.splash.classList.contains("hidden") || state.busy) return;
  const [name, arg] = String(cmd).split(":");
  const team = arg === "home" || arg === "away" ? arg : null;
  if (name === "add" && team) {
    if (state.pending !== null) runTimer(); else addPoint(team);
  } else if (name === "sub" && team) {
    if (state.pending === null) removePoint(team);
  } else if (name === "serve") {
    if (state.pending !== null) runTimer(); else { toggleServe(); render(); }
  } else if (name === "go") {
    if (state.pending !== null) runTimer();
  } else if (name === "timer" && TIMERS.includes(Number(arg)) && !state.pendingIsWin) {
    state.pending = state.pending === Number(arg) ? null : Number(arg);
    render();
  } else if (name === "reset") {
    resetScores();
  }
}
window.board = {
  app: "jpx",
  title: "JPX",
  command,
  snapshot: () => ({
    app: "jpx", title: "JPX", home: state.home, away: state.away, serve: state.serve, busy: state.busy,
    pending: state.pending, pendingIsWin: state.pendingIsWin, gameOver: false, timers: TIMERS,
  }),
};

// Keep iOS from zooming / scrolling on double taps and pinches.
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());

// ---------------- splash ----------------
el.splash.addEventListener("click", async () => {
  if (el.splash.classList.contains("started")) return;
  el.splash.classList.add("started");
  keepAwake();
  await soundsLoaded;
  await sleep(250);
  play("easports");
  await sleep(3750);
  el.splash.classList.add("hidden");
});

render();

// ---------------- offline support ----------------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
