# Vercel & Neon Deployment Guide
## AutoDealership Enterprise Platform (Master System Spec v25.0)

This comprehensive guide details the step-by-step procedure for provisioning a **Neon Serverless PostgreSQL** database, initializing schemas, populating enterprise seed data, and deploying the Next.js application to **Vercel**.

---

## Architecture Overview

- **Frontend & Serverless Backend**: Next.js 14 (App Router) deployed to **Vercel Edge / Serverless Functions**.
- **Database**: **Neon Serverless PostgreSQL** using `@neondatabase/serverless` and **Drizzle ORM** (`neon-http` driver for low-latency serverless requests without TCP socket overhead).
- **Authentication**: Auth.js / NextAuth v5 with JWT session tokens and `AUTH_TRUST_HOST=true`.
- **Encryption**: AES-256-GCM KMS simulation for customer CCCD PII data protection.

---

## Step 1: Provision Neon Postgres Database

1. Sign up or log in at [Neon Console](https://console.neon.tech).
2. Click **Create Project**:
   - **Project Name**: `autodealer-db` (or your preferred name)
   - **Postgres Version**: 16 or 17
   - **Region**: Select the region closest to your Vercel deployment (e.g. `ap-southeast-1` Singapore or `us-east-1` / `us-east-2`).
3. After project creation, go to the **Dashboard**:
   - Under **Connection Details**, locate your connection string.
   - **Pooled connection** (includes `-pooler` in the host):
     ```
     postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require
     ```
   - **Direct connection** (uncheck "Connection pooling", no `-pooler` in host):
     ```
     postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/neondb?sslmode=require
     ```

---

## Step 2: Push Schema & Seed Enterprise Data to Neon

Execute the schema migration and seeding script from your local machine to populate your Neon database:

### 1. Set Local Environment Variables
In your local `.env` file, configure your Neon connection strings:

```env
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/neondb?sslmode=require"
NEON_DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require"
```

### 2. Run Database Push & Seed (One Step)
Run the automated clean reset, schema push, and 40-car seed script:

```bash
npm run db:reset
```

Or execute sequentially:

```bash
# Push latest 34 Drizzle schema tables directly to Neon
npm run db:push

# Seed Showrooms, 40 Car Models & Variants, Inventory VINs, Quotas, and Roles
npm run db:seed
```

> **Default Seed User Accounts**:
> - **Super Admin**: `admin@autodealer.vn` / `Admin@123`
> - **Manager (HN)**: `manager.hn@autodealer.vn` / `Admin@123`
> - **Manager (HCM)**: `manager.hcm@autodealer.vn` / `Admin@123`
> - **Sales Consultant**: `sale1@autodealer.vn` / `Admin@123`
> - **Customer Account**: `customer1@gmail.com` / `Admin@123`

---

## Step 3: Deploy to Vercel

### Option A: Deployment via Vercel Dashboard & GitHub (Recommended)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: configure for Vercel and Neon Postgres deployment"
   git push origin main
   ```
2. Log in to [Vercel Dashboard](https://vercel.com).
3. Click **Add New** > **Project** and import your repository.
4. **Framework Preset**: Next.js (auto-detected).
5. **Root Directory**: `./`
6. **Environment Variables**: Expand the section and add the following required variables:

| Variable Name | Environment | Value Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production, Preview, Dev | Neon Pooled connection string (`-pooler`) |
| `DATABASE_URL_UNPOOLED` | Production, Preview, Dev | Neon Direct connection string (without `-pooler`) |
| `NEON_DATABASE_URL` | Production, Preview, Dev | Same as `DATABASE_URL` |
| `AUTH_SECRET` | Production, Preview, Dev | 64-char key (`openssl rand -base64 32`) |
| `NEXTAUTH_SECRET` | Production, Preview, Dev | Same as `AUTH_SECRET` |
| `NEXTAUTH_URL` | Production | `https://your-project-name.vercel.app` (or custom domain) |
| `AUTH_TRUST_HOST` | Production, Preview, Dev | `true` |
| `KMS_SECRET_KEY` | Production, Preview, Dev | 32+ char key for AES-256 PII encryption |
| `MOCK_OTP_CODE` | Production, Preview, Dev | `888888` |
| `MOCK_GATEWAY_SECRET` | Production, Preview, Dev | `gw_sec_prod_99887766554433221100aabbccddeeff` |
| `MOCK_BANK_API_KEY` | Production, Preview, Dev | `bank_api_key_prod_123456789` |
| `NODE_ENV` | Production, Preview | `production` |

7. Click **Deploy**. Vercel will build and deploy your application in under 1 minute.

---

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```
2. Log in to Vercel:
   ```bash
   vercel login
   ```
3. Link project:
   ```bash
   vercel link
   ```
4. Add environment variables:
   ```bash
   vercel env add DATABASE_URL
   vercel env add DATABASE_URL_UNPOOLED
   vercel env add AUTH_SECRET
   vercel env add NEXTAUTH_SECRET
   vercel env add AUTH_TRUST_HOST
   vercel env add KMS_SECRET_KEY
   vercel env add MOCK_OTP_CODE
   vercel env add MOCK_GATEWAY_SECRET
   vercel env add MOCK_BANK_API_KEY
   ```
5. Deploy to Production:
   ```bash
   vercel --prod
   ```

---

### Option C: Connect Neon via Vercel Marketplace Integration

You can also connect Neon directly through Vercel:
1. In your Vercel Project, go to **Storage** > **Connect Store** > **Neon**.
2. Select your Neon project or create a new one.
3. Enable **Branching for Previews**: Each Git Pull Request will automatically receive an isolated Neon database branch!
4. The integration automatically populates `DATABASE_URL` and `POSTGRES_URL`.

---

## Step 4: Post-Deployment Verification

Verify core flows on your Vercel URL (`https://your-project.vercel.app`):

1. **Authentication**:
   - Go to `/login`.
   - Log in using Super Admin: `admin@autodealer.vn` / `Admin@123`.
   - Confirm successful JWT session creation and redirection.
2. **Vehicle Catalog**:
   - Visit `/catalog`.
   - Confirm all 40 models load with pricing, variants, and high-res images.
3. **Checkout & Mock Deposit Payment**:
   - Click a vehicle variant (e.g. `/catalog/1`), select a color, and proceed to `/checkout`.
   - Complete checkout with Mock Bank Transfer or QR Pay.
   - Verify confirmation screen at `/checkout/result`.
4. **CRM & Lead Management**:
   - Visit `/crm` to verify leads assigned to sales consultants.
5. **Inventory & Transfers**:
   - Visit `/inventory` to check showroom quotas and VIN allocations.
6. **Audit Logs & KMS Decryption**:
   - Navigate to `/audit-logs`.
   - Test decrypting masked CCCD / PII data to verify KMS AES-256 decryption.

---

## Maintenance & Troubleshooting

- **Cold Starts**: Neon suspends inactive compute on free tiers. The `@neondatabase/serverless` HTTP driver connects swiftly over HTTP/HTTPS, avoiding TCP handshake timeouts.
- **DDL Changes**: When modifying schema definitions in `src/lib/db/schema/index.ts`, run `npm run db:push` using `DATABASE_URL_UNPOOLED`.
- **Database Studio**: Open the visual database explorer anytime:
  ```bash
  npx drizzle-kit studio
  ```
