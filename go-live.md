# Railway Deployment

## Cost: ~$5/mo

Railway Hobby plan includes $5 usage credit covering API + Web + PostgreSQL.

---

## Feature Flags

All features disabled by default for safe launch:

| Flag | Default | Enable when... |
|------|---------|----------------|
| `BILLING_ENABLED` | `false` | Stripe configured, products created |
| `EMAIL_ENABLED` | `false` | Resend configured, domain verified |
| `PROXY_ENABLED` | `false` | Ready for proxy pass-through feature |

---

## Railway Setup

1. **Create project** at railway.app
2. **Add PostgreSQL** (New → Database → PostgreSQL)
3. **Add API service:**
   - New → GitHub Repo → select mocktail
   - Settings → Root Directory: `apps/api`
   - Build Command: `pnpm install && npx prisma generate && pnpm build`
   - Start Command: `node dist/index.js`
4. **Add Web service:**
   - New → GitHub Repo → select mocktail
   - Settings → Root Directory: `apps/web`
   - Build auto-detected (Vite)
5. **Link DATABASE_URL:**
   - API service → Variables → Add Reference → select PostgreSQL

---

## Environment Variables

### API Service (Minimal Launch)
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=4000
BETTER_AUTH_SECRET=<openssl rand -base64 32>
APP_URL=https://<web-service>.up.railway.app
API_URL=https://<api-service>.up.railway.app

# Feature flags - all false for initial launch
BILLING_ENABLED=false
EMAIL_ENABLED=false
PROXY_ENABLED=false
```

### API Service (Full Features)
```
# Add these when ready:
BILLING_ENABLED=true
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx

EMAIL_ENABLED=true
RESEND_API_KEY=re_xxx

PROXY_ENABLED=true

# OAuth (optional)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

### Web Service
```
VITE_API_URL=https://<api-service>.up.railway.app
VITE_BILLING_ENABLED=false
```

---

## Tiers

| | Free | Pro |
|---|------|-----|
| Price | $0 | $29/mo |
| Projects | 3 | 10 |
| Endpoints/project | 10 | 50 |
| Requests/month | 5,000 | 100,000 |
| Members | 3 | 10 |
| Log retention | 3 days | 30 days |
| Rate limit | 5 req/s | 50 req/s |

---

## External Services

### Stripe (when BILLING_ENABLED=true)
- [ ] Create product + price in Stripe Dashboard
- [ ] Add webhook: `https://<api>.up.railway.app/stripe/webhook`
- [ ] Events: `checkout.session.completed`, `customer.subscription.*`

### Resend (when EMAIL_ENABLED=true)
- [ ] Create account, verify domain
- [ ] Get API key
- [ ] Update from address in code if needed

### Google OAuth (optional)
- [ ] Create OAuth 2.0 Client in Google Cloud Console
- [ ] Redirect: `https://<api>.up.railway.app/auth/callback/google`
- [ ] Origin: `https://<web>.up.railway.app`

### GitHub OAuth (optional)
- [ ] Create OAuth App in GitHub Settings → Developer settings
- [ ] Callback: `https://<api>.up.railway.app/auth/callback/github`

---

## Post-Deploy Checklist

- [ ] `/health` responds OK
- [ ] First user signup works
- [ ] Email verification skipped (EMAIL_ENABLED=false)
- [ ] Can create project & endpoints
- [ ] Mock requests work

### When enabling billing:
- [ ] Stripe webhook test event succeeds
- [ ] Checkout flow works
- [ ] Subscription upgrade works

### When enabling OAuth:
- [ ] Google login works
- [ ] GitHub login works

---

## Custom Domain (Later)

1. Settings → Domains → Add Custom Domain
2. Add CNAME record pointing to Railway
3. Update `APP_URL`/`API_URL` env vars
4. Update OAuth callback URLs
