# Netlify Deployment & Database Seeding Guide
## AutoDealership Enterprise Platform (Master System Spec v22.0)

This guide provides end-to-end instructions for initializing the Netlify Database, running database migrations and seeds, configuring environment variables, and deploying the application to Netlify.

---

## Prerequisites

1. **Node.js**: Version 20.x or higher installed locally.
2. **Netlify CLI**: Installed globally via `npm install -g netlify-cli`.
3. **Netlify Account**: Access to [Netlify Dashboard](https://app.netlify.com).

---

## Step 1: Provision Netlify Database

### Option A: Via Netlify Dashboard
1. Log in to [Netlify Dashboard](https://app.netlify.com).
2. Create or select your site project.
3. Go to **Extensions / Integrations** -> **Netlify Database**.
4. Click **Enable / Connect Database**.
5. Copy the generated PostgreSQL connection string (`NETLIFY_DATABASE_URL`).

### Option B: Via Netlify CLI
```bash
# Login to Netlify CLI
netlify login

# Link your local project directory to your Netlify site
netlify link

# Create Netlify Database extension instance
netlify extension:create database
```

---

## Step 2: Initialize Database Schema & Seed Data

Once you have your `NETLIFY_DATABASE_URL`, execute the schema push and database seed locally or via CI/CD.

### 1. Configure Local Environment for Seeding
In your `.env` or temporary shell environment, set your `NETLIFY_DATABASE_URL`:
```bash
export NETLIFY_DATABASE_URL="postgresql://<username>:<password>@<host>/<dbname>?sslmode=require"
```

### 2. Clean Database Wipe, Push & Seed (Recommended)
To completely drop obsolete schema tables, push fresh DDL v22 structures, and populate full enterprise seed data in 1 step:
```bash
npm run db:reset
```

Alternatively, if you only want to push updated schema or re-seed:
```bash
# Push latest schema tables
npm run db:push

# Truncate and seed initial data
npm run db:seed
```

> **Default Seed User Credentials**:
> - **Super Admin**: `admin@autodealer.vn` / `Admin@123`
> - **Manager HN**: `manager.hn@autodealer.vn` / `Admin@123`
> - **Manager HCM**: `manager.hcm@autodealer.vn` / `Admin@123`
> - **Sale Consultant**: `sale1@autodealer.vn` / `Admin@123`
> - **Customer Account**: `customer1@gmail.com` / `Admin@123`

---

## Step 3: Configure Netlify Production Environment Variables

In **Netlify Dashboard** -> **Site Settings** -> **Environment Variables** (or via `netlify env:set`), configure the following required variables:

| Variable Name | Description / Example Value |
| :--- | :--- |
| `NETLIFY_DATABASE_URL` | `postgresql://<user>:<pass>@<host>/<db>?sslmode=require` |
| `DATABASE_URL` | Same as `NETLIFY_DATABASE_URL` |
| `NEXTAUTH_SECRET` | 64-char random key (generate via `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://<your-site-name>.netlify.app` |
| `AUTH_TRUST_HOST` | `true` |
| `KMS_SECRET_KEY` | 32+ char secret key for PII encryption (AES-256-GCM) |
| `MOCK_OTP_CODE` | `888888` |
| `MOCK_GATEWAY_SECRET` | `gw_sec_prod_99887766554433221100` |
| `MOCK_BANK_API_KEY` | `bank_api_key_prod_123456789` |
| `NODE_ENV` | `production` |

---

## Step 4: Verify Netlify Build Configuration (`netlify.toml`)

Ensure `netlify.toml` in your repository root is configured as follows:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
```

---

## Step 5: Deploy to Netlify Server

### Option A: Deployment via Git Push (Recommended)
1. Commit all project files and push to GitHub/GitLab:
   ```bash
   git add .
   git commit -m "feat: setup Netlify database & seed configuration"
   git push origin main
   ```
2. Netlify will automatically trigger a build, run static analysis, and deploy the Next.js App Router project.

### Option B: Direct Deployment via Netlify CLI
```bash
# Build and deploy directly to production
netlify deploy --build --prod
```

---

## Step 6: Post-Deployment Verification

1. Open your deployed URL: `https://<your-site-name>.netlify.app`.
2. **Auth Verification**: Navigate to `/login` and log in with `admin@autodealer.vn` / `Admin@123`.
3. **Vehicle Catalog**: Verify `/catalog` loads variants and images from Netlify Database.
4. **Checkout & Mock Payment**: Test booking deposit on `/catalog/1` -> `/checkout` -> `/checkout/result`.
5. **Portal & Audit Logs**: Log in as Admin and verify `/portal/audit-logs` and PII decryption.

---

## Troubleshooting & Maintenance Commands

- **Check Database Migration Status**:
  ```bash
  npx drizzle-kit studio
  ```
- **Re-run Seed Script**:
  ```bash
  npm run db:seed
  ```
- **Inspect Netlify Build Logs**:
  ```bash
  netlify logs:build
  ```
