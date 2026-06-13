# 🏆 FIFA World Cup 2026 — Angular App

Angular 22 frontend — no backend, no database. Calls worldcup26.ir APIs directly from the browser.

## Pages
| Route | API used | Token needed? |
|---|---|---|
| `/fixtures` | `GET /get/games` | ❌ No |
| `/groups` | `GET /get/groups` | ✅ Yes |
| `/teams` | `GET /get/teams` | ✅ Yes |
| `/teams/:name` | `GET /get/team/?name=` | ✅ Yes |

## Run in IntelliJ IDEA

1. **Open** the project folder in IntelliJ IDEA
2. IntelliJ will auto-detect `package.json` — click **"Run npm install"** in the prompt, or run manually:
   ```
   npm install
   ```
3. In the terminal or npm scripts panel, run:
   ```
   npm start
   ```
   or directly:
   ```
   ng serve
   ```
4. Open **http://localhost:4200** in your browser

> **Tip:** In IntelliJ, open the npm panel (View → Tool Windows → npm) to run `start`, `build` etc. with one click.

## Add your API token

Open `src/app/services/worldcup.service.ts` and set:
```ts
private readonly TOKEN = 'your_token_here';
```
The token is automatically added to all protected endpoint requests.

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to **vercel.com** → New Project → Import repo
3. Set:
   - **Framework**: Angular
   - **Build command**: `ng build --configuration production`
   - **Output directory**: `dist/worldcup26-angular/browser`
4. Deploy ✅

`vercel.json` is already included — it handles Angular routing so direct URLs don't 404.

## Deploy to Netlify

Add a `netlify.toml` at the root:
```toml
[build]
  command = "ng build --configuration production"
  publish = "dist/worldcup26-angular/browser"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
Then connect your GitHub repo on netlify.com.

## Project structure
```
src/app/
├── models/
│   └── worldcup.models.ts        ← Match, Team, Group, Stadium interfaces
├── services/
│   └── worldcup.service.ts       ← all API calls (add token here)
├── components/
│   └── navbar/                   ← sticky top nav
└── pages/
    ├── fixtures/                  ← /fixtures
    ├── groups/                    ← /groups
    ├── teams/                     ← /teams
    ├── team-detail/               ← /teams/:name
```
