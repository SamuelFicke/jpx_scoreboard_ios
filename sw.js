// Caches everything so the scoreboard works offline once installed.
// Bump VERSION whenever you change any file so phones pick up the update.
const VERSION = "jpx-v1";
const FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.webmanifest",
  "fonts/harryp.ttf",
  "fonts/seven-segment.ttf",
  "images/ea_sports.jpg",
  "images/apple-touch-icon.png",
  "images/icon-192.png",
  "images/icon-512.png",
  "audio/321go.wav",
  "audio/EASports.wav",
  "audio/nice.wav",
  "audio/stop_drinking.wav",
  "audio/stop_drinking_explicit.wav",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
