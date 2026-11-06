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

Same rules as the PC version: first to 11, win by 2; serve switches every 2 points, then every point
after 10-10; "Nice!" at 9-6; winning flashes the score and arms a 5-second chug, after which a new game starts.

## Updating
After changing any file, bump `VERSION` in `sw.js` so installed phones fetch the new files.
To use the clean "stop drinking" sound, set `USE_EXPLICIT = false` in `app.js`.

## Local testing
`python3 -m http.server 8000` in this folder, then open http://localhost:8000.
