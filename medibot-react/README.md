# MediBot / KAIZY — React Frontend

This is a 1:1 React port of `new_template_widget.html` (the floating "Ask
KAIZY" chat widget) plus the three standalone pages (`privacy.html`,
`cookies.html`, `terms.html`). Same look, same classes/CSS, same behavior
(category → product → chat flow, login/signup + OTP, guest inquiry + OTP,
chat history, my requests, cookie banner + preferences, maximize/minimize/
end chat). The Flask backend (`app.py`, `db_helper.py`, `agent.py`, etc.) is
unchanged except for two small, additive edits described below.

## Project layout

```
src/
  api/client.js          fetch wrapper (apiPost/apiGet/fetchBootstrapData)
  components/
    ChatWidget.jsx        the whole widget: state, modals, chat logic
    ChatWidget.css         ported 1:1 from the widget's <style> block
  pages/
    PrivacyPolicy.jsx / CookiePolicy.jsx / Terms.jsx   ported from the .html files
    PolicyPages.css / Terms.css
  App.jsx                 routes: "/" (widget), "/privacy", "/cookies", "/terms"
```

## Running it

### 1. Backend (unchanged, two small additions)

The only backend changes are in the provided `app.py`:

1. `flask_cors` import + `CORS(app, ...)` are enabled (they were already
   commented out in your original file, and `flask-cors` is already in
   `requirement.txt`).
2. One new route, `GET /api/bootstrap`, which returns the same
   `categories` / `products_by_category` data that `index()` used to inject
   into the Jinja template — React fetches this once on load instead.

Everything else (`/chat`, `/inquiry`, `/api/login`, `/api/signup`,
`/api/generate-otp`, `/api/verify-otp`, `/api/chat-history`,
`/api/user-requests`, `/cookie-consent`, session/OTP logic, DB layer, LLM
agent) is byte-for-byte your original code.

Run it exactly as before:
```bash
pip install -r requirement.txt
python app.py
```
(Assumes it listens on `http://localhost:5000` — adjust `BACKEND_URL` in
`vite.config.js` if not.)

### 2. Frontend

```bash
cd medibot-react
npm install
npm run dev
```
Open `http://localhost:5173`.

During development, Vite proxies `/chat`, `/inquiry`, `/cookie-consent`,
`/accept_terms`, `/admin`, `/api`, and `/static` straight to the Flask
backend (see `vite.config.js`). Because of this, requests are same-origin
from the browser's perspective, so the Flask session cookie (used for auth,
OTP, and chat history) works with **no CORS or SameSite changes needed** —
this is the simplest and most robust setup.

### 3. Production

Build the static frontend:
```bash
npm run build
```
This outputs `dist/`. Simplest deployment: serve `dist/` behind the same
reverse proxy / domain as the Flask backend (so all requests stay
same-origin, exactly like dev). If you instead deploy the React app on a
completely different domain than Flask, set these env vars on the backend
so cross-site cookies work over HTTPS:
```bash
export FRONTEND_ORIGIN="https://your-react-app.example.com"
export SESSION_COOKIE_SAMESITE="None"
export SESSION_COOKIE_SECURE="true"   # requires HTTPS
```

## Notes / things to double check

- **`IMG.png` avatar**: the widget requests it from `/static/IMG.png`,
  which is proxied to Flask's existing `static/` folder — no asset copying
  needed, as long as `IMG.png` is still there.
- **`settings.py`** contains a plaintext DB password committed to the repo.
  Worth moving to an environment variable / secrets manager regardless of
  frontend framework.
- **`terms.html`'s contact link** had a typo (`mailto:support@mail.com.com`
  with visible text `support@mail.com`) — ported as-is to `Terms.jsx` for
  fidelity; fix the `href` in `src/pages/Terms.jsx` if you'd like.
- Bot/AI responses and the "Selected: X" strings are rendered with
  `dangerouslySetInnerHTML`, same trust model as the original (the original
  also injected them as raw HTML via `innerHTML`).
