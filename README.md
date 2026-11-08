# jpx_scoreboard_ios

iPhone version of [jpx_scoreboard_pc](https://github.com/SamuelFicke/jpx_scoreboard_pc), built as a web app
you add to your home screen. It runs full-screen and works offline after the first load.

## Install on iPhone
1. Host this folder over HTTPS (e.g. GitHub Pages).
2. Open the URL in **Safari** → Share → **Add to Home Screen**.
3. Launch it from the home screen icon, turn the phone sideways, tap the splash to start.

## Controls
| Action | Gesture |
|---|---|
| +1 point | tap the team's side |
| −1 point | swipe down on the team's side, or long-press it |
| switch serve | tap the middle arrow |
| drink timer | tap **1.0 / 1.5 / 2.0**, then tap anywhere to start (tap the button again to cancel) |
| reset to 0-0 | **reset** |
| phone remote | **remote** (see below) |

Same rules as the PC version: first to 11, win by 2; serve switches every 2 points, then every point
after 10-10; "Nice!" at 9-6; winning flashes the score and arms a 5-second chug, after which a new game starts.

## Playing from the table (remotes)

**Bluetooth number pad.** Pair any Bluetooth numeric keypad with the scoreboard phone (Settings → Bluetooth).
Same keys as the PC version; they work with Num Lock on or off. Any key also starts the app from the splash.

| Key | Action |
|---|---|
| 7 / 1 | away +1 / −1 |
| 9 / 3 | home +1 / −1 |
| 8 | switch serve |
| 4 / 5 / 6 (or the PC keys = / + / 2) | arm the 1.0 / 1.5 / 2.0 s timer (same key again cancels) |
| Enter or 0 | start the armed timer (any +1 key also starts it, like tapping the board) |

**Another phone.** Tap **remote** on the scoreboard to show a QR code, and scan it with any phone's camera. The page
that opens has big +1/−1 buttons, switch serve, the timers, reset, and the live score. Several phones can connect at once.
The **remote** button turns green while a phone is connected. Both phones need internet (Wi-Fi or cell): they find each
other through the free PeerJS server, then talk directly. The QR code stays the same on this phone, so a remote can
be saved to the home screen and reused. **turn off** on the QR screen stops it.

## Updating
After changing any file, bump `VERSION` in `sw.js` so installed phones fetch the new files.
To use the clean "stop drinking" sound, set `USE_EXPLICIT = false` in `app.js`.

## Local testing
`python3 -m http.server 8000` in this folder, then open http://localhost:8000.

## Credits
- Font: [Black Ops One](https://fonts.google.com/specimen/Black+Ops+One), SIL Open Font License 1.1 (see `fonts/black-ops-one-OFL.txt`).
- Phone remote: [PeerJS](https://peerjs.com) (MIT, `vendor/peerjs.LICENSE.txt`) and
  [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase (MIT, license in the file header).
