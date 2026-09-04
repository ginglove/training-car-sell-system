# AutoDealership Enterprise Platform

> **Master System Spec v25.0 Ultimate**  
> Complete end-to-end guide for environment configuration, database initialization on **Neon Serverless PostgreSQL**, enterprise data seeding, and deployment to **Vercel**.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Initialization & Schema Migration](#database-initialization--schema-migration)
4. [Enterprise Data Seeding & Credentials](#enterprise-data-seeding--credentials)
5. [Vercel Production Deployment](#vercel-production-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting & Maintenance Commands](#troubleshooting--maintenance-commands)

---

## Prerequisites

Before setting up the project, ensure you have the following installed and configured:

1. **Node.js**: `v20.x` or higher (`node -v`).
2. **Package Manager**: `npm` (bundled with Node.js).
3. **Neon Account**: Access to [Neon Console](https://console.neon.tech) to create a serverless PostgreSQL database.
4. **Vercel Account**: Access to [Vercel Dashboard](https://vercel.com) or Vercel CLI (`npm install -g vercel`).

---

## Environment Configuration

The application requires PostgreSQL connection strings and security keys to run locally and in production.

### Local Configuration (`.env`)

Create or update `.env` in the root directory with the following variables:

```ini
# Neon Postgres Connection Strings
DATABASE_URL=postgresql://[user]:[pass]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://[user]:[pass]@[endpoint].[region].aws.neon.tech/neondb?sslmode=require
NEON_DATABASE_URL=postgresql://[user]:[pass]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require

# NextAuth / Auth.js Configuration
AUTH_SECRET=YWnxXFP6HxITr6v7SOVZGfIPaK3S9K723AWu3fZpF6T7twem1xBydQR9oY3NfwHn
NEXTAUTH_SECRET=YWnxXFP6HxITr6v7SOVZGfIPaK3S9K723AWu3fZpF6T7twem1xBydQR9oY3NfwHn
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Security & KMS PII Encryption Secret (AES-256-GCM)
KMS_SECRET_KEY=#jGf3[{.#@voc^SY1#HfefZk$o1dN%@z?4R_.baVN|V

# Sandbox & Gateway Simulator Secrets
MOCK_OTP_CODE=888888
MOCK_GATEWAY_SECRET=nt0aJZ6Cfjz7GC52aQtU4zex3ws3C80itfM7Xf7C8im
MOCK_BANK_API_KEY=t3a9lfer1JQBuenGEVD7ae0vpujAJjWC

# Environment Scope
NODE_ENV=development
```

### Production Configuration (`.env.production`)

For production deployments on Vercel, `NEXTAUTH_URL` should point to your Vercel production URL (e.g. `https://your-project.vercel.app` or your custom domain).

---

## Database Initialization & Schema Migration

The system uses **Drizzle ORM** configured with Neon PostgreSQL (`@neondatabase/serverless` HTTP driver).

### Method A: One-Step Clean Reset & Seed (Recommended)

To wipe old tables, push fresh DDL v22 schema structures, and seed default data in a single command:

```bash
npm run db:reset
```

### Method B: Step-by-Step Manual Initialization

If you prefer to perform each step individually:

```bash
# 1. (Optional) Wipe public schema completely
npm run db:clean

# 2. Push latest Drizzle schema DDL to PostgreSQL
npm run db:push

# 3. Seed initial database records
npm run db:seed
```

---

## Enterprise Data Seeding & Credentials

Running `npm run db:seed` initializes:
- **Showrooms**: HN, HCM, Đà Nẵng, TP. Vinh.
- **Vehicles & Catalog**: 40 real car models/variants (Ford Everest, Ranger, Mercedes C-Class, etc.) with technical specs and media.
- **Role-Based Users**: Admin, Showroom Managers, Sales Consultants, and Customers.

### Default Seed Accounts

| Role | Username / Email | Password | Scope / Notes |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@autodealer.vn` | `Admin@123` | Full system access & audit logs |
| **Manager (Hà Nội)** | `manager.hn@autodealer.vn` | `Admin@123` | Showroom Cầu Giấy |
| **Manager (HCM)** | `manager.hcm@autodealer.vn` | `Admin@123` | Showroom Quận 7 |
| **Sales Consultant** | `sale1@autodealer.vn` | `Admin@123` | Sales lead & order management |
| **Customer** | `customer1@gmail.com` | `Admin@123` | Portal booking, deposits, loan apps |

---

## Vercel Production Deployment

Detailed guide is available in [`VERCEL_NEON_DEPLOYMENT_GUIDE.md`](./VERCEL_NEON_DEPLOYMENT_GUIDE.md).

### Step 1: Deploy via Vercel Dashboard (Git Integration)

1. Push your repository to GitHub / GitLab:
   ```bash
   git add .
   git commit -m "feat: configure Vercel and Neon Postgres deployment"
   git push origin main
   ```
2. In [Vercel Dashboard](https://vercel.com), select **Add New** > **Project** and import this repository.
3. Configure the **Environment Variables**:
   - `DATABASE_URL`: Neon pooled connection string
   - `DATABASE_URL_UNPOOLED`: Neon direct connection string
   - `AUTH_SECRET` & `NEXTAUTH_SECRET`: Random 64-char secret
   - `AUTH_TRUST_HOST`: `true`
   - `KMS_SECRET_KEY`: 32+ char key for AES-256 PII encryption
   - `MOCK_OTP_CODE`: `888888`
   - `MOCK_GATEWAY_SECRET`: `gw_sec_prod_99887766554433221100aabbccddeeff`
   - `MOCK_BANK_API_KEY`: `bank_api_key_prod_123456789`
4. Click **Deploy**.

### Step 2: Deploy via Vercel CLI (Alternative)

```bash
# 1. Login to Vercel
vercel login

# 2. Link your local project directory
vercel link

# 3. Deploy directly to production
vercel --prod
```

---

## Post-Deployment Verification

1. **Access Site**: Open your Vercel URL (`https://your-project.vercel.app`).
2. **Authentication**: Test login at `/login` with `admin@autodealer.vn` / `Admin@123`.
3. **Vehicle Catalog**: Verify vehicle catalog loads at `/catalog` with 40 real car models.
4. **Booking & Checkout**: Test deposit flow (`/catalog/1` -> `/checkout` -> `/checkout/result`).
5. **Admin Portal**: Verify `/portal/audit-logs` and dashboard analytics.

---

## Troubleshooting & Maintenance Commands

| Action | Command |
| :--- | :--- |
| **Development Server** | `npm run dev` |
| **Production Build** | `npm run build` |
| **Vercel Build Target** | `npm run vercel-build` |
| **Generate Migrations** | `npm run db:generate` |
| **Push Schema DDL to Neon** | `npm run db:push` |
| **Seed Enterprise Data** | `npm run db:seed` |
| **Reset Schema & Re-seed** | `npm run db:reset` |
| **Inspect DB via Drizzle Studio** | `npx drizzle-kit studio` |
| **Vercel Production Deploy** | `vercel --prod` |
| **Vercel Project Logs** | `vercel logs` |