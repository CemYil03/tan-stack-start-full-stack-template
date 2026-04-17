# Infrastructure

## Deployment

This project is deployed via **Coolify** as a **Docker** container.

### Docker Build

The `Dockerfile` uses a multi-stage build:

1. **deps** — Installs production dependencies with `npm ci`
2. **build** — Copies dependencies, runs `npm run build` (Vite production build via TanStack Start)
3. **runtime** — Copies only the `.output/` bundle into a slim Node.js image

The final image contains only the built server bundle — no source code, no `node_modules`.

```bash
docker build -t app .
docker run -p 3000:3000 -e DATABASE_URL=... app
```

### Environment Variables

The following environment variables must be configured in the deployment environment:

| Variable                   | Required | Description                                                    |
| -------------------------- | -------- | -------------------------------------------------------------- |
| `DATABASE_URL`             | Yes      | PostgreSQL connection string                                   |
| `sessionCookieSecure`      | No       | Set to `"true"` in production to enable Secure + SameSite=None |
| `sessionCookieDomainScope` | No       | Cookie domain scope for cross-subdomain sessions               |

### Database Migrations

Migrations are managed by Drizzle Kit. Run before or during deployment:

```bash
npm run db:migrate
```

Migration files live in the `drizzle/` directory and are committed to version control.

## Continuous Integration (CI, GitHub Actions)

Continuous integration runs on pull requests and pushes to `main`.

Workflow: `.github/workflows/ci.yml`

### Jobs

**codegen** — verifies generated files are up to date (no database required):

1. `npm ci`
2. `npm run graphql:generate`, `npm run routes:generate`, and `npm run db:generate`
3. `git diff --exit-code` on `*.gen.ts` / `*.generated.ts` / `drizzle/` — fails if codegen output differs from what was committed, or if new
   untracked files appear

**check** — static analysis (no database required):

| Step   | Command              |
| ------ | -------------------- |
| Format | `prettier --check .` |
| Lint   | `eslint .`           |
| Spell  | `cspell .`           |
| Types  | `tsc --noEmit`       |
| Usage  | `knip`               |

**test** — runs against a PostgreSQL 17 service container:

1. `npm ci`
2. `drizzle-kit push` (applies schema to the test database)
3. `npm test`

The three jobs run in parallel.

## Continuous Deployment (CD, GitHub Actions)

Continuous deployment runs after CI succeeds on `main`.

Workflow: `.github/workflows/cd.yml`

### How it works

1. Builds a Docker image and pushes it to **GitHub Container Registry** (GHCR) with Docker layer caching
2. Tags the image with the commit SHA and `latest`
3. PATCHes the Coolify application to point to the new image tag
4. Restarts the application via the Coolify API

### Required Secrets

| Secret                 | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `COOLIFY_URL`          | Coolify instance URL (e.g. `https://coolify.example.com`) |
| `COOLIFY_API_TOKEN`    | Coolify API token (Settings → API Tokens)                 |
| `COOLIFY_SERVICE_UUID` | Application UUID (visible in the application URL)         |

## Coolify Deployment Strategy

This template is designed for Coolify v4. The recommended setup uses a **production app** with **preview deployments** for PRs, and an
optional **staging app** if your project requires a persistent pre-production environment.

### Recommended Setup

| Environment | Coolify Resource    | Branch       | Purpose                                     |
| ----------- | ------------------- | ------------ | ------------------------------------------- |
| Production  | Application         | `production` | Live user-facing deployment                 |
| Preview     | Preview Deployments | PR branches  | Ephemeral per-PR environments for review    |
| Staging     | Application (opt.)  | `main`       | Persistent pre-production for smoke testing |

### Production App

The production app tracks the `production` branch and auto-deploys via the CD workflow.

**Setup in Coolify:**

1. Create a new Application (Docker → GHCR)
2. Set the image to `ghcr.io/<owner>/<repo>` with tag `latest` (CD updates this)
3. Configure environment variables (`DATABASE_URL`, `sessionCookieSecure=true`, etc.)
4. Attach a PostgreSQL database resource
5. Set up the custom domain and SSL

**Branch strategy:** Merge `main` → `production` when ready to release. This gives you a manual gate before production deploys.

Alternatively, deploy directly from `main` if you prefer continuous deployment (the current CD workflow does this).

### Preview Deployments

Preview deployments spin up an ephemeral instance for each pull request. They are destroyed when the PR is merged or closed.

**Setup in Coolify:**

1. Open your production Application → **Preview Deployments** tab
2. Enable preview deployments
3. Set the **Base Domain** (e.g. `preview.example.com`) — each PR gets `pr-<number>.preview.example.com`
4. Configure environment overrides for previews (typically a shared preview database or per-PR database)

**Database options for previews:**

| Option                | Pros                       | Cons                                  |
| --------------------- | -------------------------- | ------------------------------------- |
| Shared preview DB     | Simple, low resource usage | PRs can interfere with each other     |
| Per-PR DB (scripted)  | Full isolation             | Requires setup/teardown scripts       |
| Seed-only (ephemeral) | Clean state every deploy   | No persistent test data across pushes |

For most teams, a **shared preview database** with schema push on deploy is sufficient:

```bash
# Add to your preview deploy command or Dockerfile entrypoint
npx drizzle-kit push
```

**GitHub integration:** Coolify v4 posts deployment status checks on PRs automatically when connected via GitHub App.

### Staging App (Optional)

Add a dedicated staging app when you need:

- A stable URL for webhook integrations (OAuth callbacks, payment providers, AI API endpoints)
- Post-merge smoke testing before promoting to production
- A persistent environment for QA or stakeholder review
- Budget-limited API keys separate from production

**Setup in Coolify:**

1. Create a second Application (same GHCR image, different tag or branch)
2. Track the `main` branch (deploys on every merge)
3. Configure staging-specific environment variables and domain
4. Attach a separate PostgreSQL database

**CD workflow for staging + production:**

To deploy to both staging and production, duplicate the CD secrets with a prefix:

| Secret                         | Description                 |
| ------------------------------ | --------------------------- |
| `COOLIFY_SERVICE_UUID_STAGING` | Staging application UUID    |
| `COOLIFY_SERVICE_UUID_PROD`    | Production application UUID |

Then use separate jobs or a matrix in `cd.yml`:

```yaml
strategy:
  matrix:
    include:
      - environment: staging
        uuid_secret: COOLIFY_SERVICE_UUID_STAGING
        branch: main
      - environment: production
        uuid_secret: COOLIFY_SERVICE_UUID_PROD
        branch: production
```

### When to Skip Staging

You likely don't need a staging app if:

- Your team is small (1–3 developers) with good PR review discipline
- You have no external webhook integrations that need a stable URL
- Preview deployments cover your testing needs
- You're comfortable with `main` → production continuous deployment

### Coolify API Tokens

Each environment needs its own set of secrets. Generate API tokens in **Coolify → Settings → API Tokens**. Use separate tokens per
environment for revocability.

### Database Migrations in Deployment

For production and staging, run migrations as part of the deploy process:

```bash
# Option A: Run before restarting (CI/CD step after image push)
DATABASE_URL=<prod-url> npx drizzle-kit migrate

# Option B: Run on container start (entrypoint script)
#!/bin/sh
npx drizzle-kit migrate && node .output/server/index.mjs
```

Option A is safer — if the migration fails, the old container keeps running.

## Storybook (GitHub Pages)

Storybook is deployed to **GitHub Pages** after CI succeeds on `main`.

Workflow: `.github/workflows/storybook.yml`

### How it works

1. Installs dependencies and runs `npm run storybook:build`
2. Uploads the `storybook-static/` output as a Pages artifact
3. Deploys to GitHub Pages via `actions/deploy-pages`

URL: `https://<owner>.github.io/<repo>/`

### Setup

GitHub Pages must be configured in the repository settings:

**Settings → Pages → Source** → set to **GitHub Actions** (not "Deploy from a branch")
