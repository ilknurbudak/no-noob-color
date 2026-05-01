# Deployment guide

End-to-end checklist for shipping no noob color to production.

## Stack overview

```
   browser  ──HTTPS──►  Vue (Vercel/Netlify)
                            │
                            └─/api──►  FastAPI (Render/Fly/HF)
                                          │
                                          └─REST──►  PocketBase (Fly/Render)
```

Three independently deployable services. PocketBase is stateful (SQLite
file); the rest are stateless.

---

## Frontend — Vercel (recommended)

```sh
cd web
vercel link    # one-time
vercel --prod
```

`web/vercel.json` already configured with SPA rewrite + immutable asset caching.

**Env vars to set in Vercel dashboard:**

| Var | Example | Purpose |
|---|---|---|
| `VITE_PB_URL` | `https://pb.nonoob.color` | PocketBase realtime SSE endpoint |
| `VITE_PLAUSIBLE_DOMAIN` | `nonoob.color` | optional analytics |

The frontend auto-detects the API URL — by default it tries
`/api`, `localhost:8000`, `127.0.0.1:8000` in order. For production,
add a Vercel rewrite to your API host:

```json
"rewrites": [
  { "source": "/api/(.*)", "destination": "https://api.nonoob.color/$1" }
]
```

## Frontend — Netlify (alternative)

```sh
cd web
npm run build
netlify deploy --prod --dir dist
```

Add `web/_redirects`:

```
/api/*  https://api.nonoob.color/:splat  200
/*      /index.html                      200
```

## Frontend — HuggingFace Spaces

`web` deploys to Static Spaces:

```sh
cd web && npm run build
# In your HF Space repo, copy dist/ contents and push
```

---

## API — Render.com (free tier)

`api/render.yaml` already configured. Just:

1. Push repo to GitHub
2. <https://dashboard.render.com> → New → Blueprint → connect repo, point to `api/render.yaml`
3. Wait ~3 min for first build

Free plan spins down after 15 min idle (~30s cold start). Plenty for prototype traffic.

**Env vars:**
- `POCKETBASE_URL` — your PB host
- `OPENAI_API_KEY` (optional)
- `APIFY_API_TOKEN` (optional)

## API — Fly.io

```sh
cd api
fly launch    # follow prompts, pick region
fly secrets set POCKETBASE_URL=https://pb.your-app.fly.dev
fly deploy
```

The Dockerfile in `api/` works as-is.

## API — HuggingFace Spaces (Docker SDK)

1. Create new Space, choose **Docker**
2. Copy `api/` contents to the Space
3. Rename `api/space-README.md` → `README.md`
4. Push; HF builds from Dockerfile

---

## PocketBase — Fly.io (recommended for stateful services)

```sh
mkdir pb-prod && cd pb-prod
# Copy ../pocketbase/pb_migrations to ./pb_migrations
fly launch --image ghcr.io/muchobien/pocketbase:0.22.4 \
  --no-deploy --name nnc-pb
fly volumes create pb_data --size 1
fly secrets set PB_ENCRYPTION_KEY="$(openssl rand -hex 32)"
fly deploy
```

Mount `/pb_data` to the volume in `fly.toml`. Upload migrations on first
boot — they run automatically.

## PocketBase — self-hosted

The single Go binary needs ~50 MB RAM and a directory it can write to.
Any VPS works. Use a reverse proxy (Caddy / nginx) for TLS:

```caddyfile
pb.nonoob.color {
  reverse_proxy localhost:8090
}
```

---

## Domain (#94)

Suggested: **nonoob.color** (the .color TLD is appropriate and
cheap — Namecheap, Porkbun, Cloudflare ~$10/yr).

DNS records (Cloudflare):

| Name | Type | Value |
|---|---|---|
| `@` | A | Vercel/Netlify IP (or CNAME flatten) |
| `www` | CNAME | `cname.vercel-dns.com` |
| `api` | CNAME | `your-api.onrender.com` |
| `pb` | CNAME | `your-pb.fly.dev` |

Set Cloudflare SSL to **Full (strict)**. Done.

---

## OAuth setup (#81 Google, #82 GitHub)

PocketBase admin → Settings → Auth providers. Currently configurable but
not wired into the frontend.

### Google

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID (web)
2. Authorized redirect URI: `https://pb.nonoob.color/api/oauth2-redirect`
3. Copy Client ID + Secret into PocketBase admin
4. Enable Google in the Auth providers list

### GitHub

1. GitHub → Settings → Developer settings → OAuth Apps → New
2. Authorization callback URL: `https://pb.nonoob.color/api/oauth2-redirect`
3. Copy Client ID + Secret into PocketBase admin

**Frontend wiring (todo):** AuthDialog needs OAuth buttons that call
`pb.collection('users').authWithOAuth2()`. Add a Google + GitHub
button row above the email/password form. Estimated 30 lines of Vue.

---

## Mobile (#95-101)

Capacitor wraps the existing Vue app into iOS + Android. Setup:

```sh
cd web
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "no noob color" com.nonoob.color
npx cap add ios
npx cap add android
npm run build
npx cap copy
npx cap open ios   # opens Xcode
```

Plugins to add for native features:

- `@capacitor/camera` — direct photo capture
- `@capacitor/filesystem` — read photo library
- `@capacitor/share` — iOS share sheet integration
- `@capacitor/push-notifications` — APNs / FCM

iOS build needs an Apple Developer account ($99/yr). Android Play Store: $25 one-time.

---

## CI/CD

`.github/workflows/ci.yml` runs typecheck + build on every PR / push to main. Extend with:

```yaml
deploy:
  needs: [web, api]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  steps:
    - uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-args: '--prod'
    - run: curl -X POST $RENDER_DEPLOY_HOOK
```

---

## Cost estimate

| Item | Free? | Paid |
|---|---|---|
| Vercel | yes (hobby) | $20/mo Pro |
| Render API | yes (cold start) | $7/mo always-on |
| Fly PB | yes ($5 credit) | ~$2/mo VM + storage |
| Domain | — | $10-15/yr |
| Plausible | — | $9/mo (or self-host free) |
| Apple Dev | — | $99/yr |

**Minimum production setup: $0** (free tiers, accept cold starts).
**Comfortable production: ~$15/mo** + domain.
