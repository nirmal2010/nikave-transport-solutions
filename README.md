# NIKAVE Transport Solutions — Fleet Compliance & Tax Renewal Tracking Platform

A modern, cloud-native Fleet Compliance & Statutory Tax Renewal Management platform engineered for Indian commercial logistics operators. Built with **React 19, TypeScript, Tailwind CSS, Zustand**, and optimized for **Vercel** serverless deployment with automated **Vercel Cron** and **Vercel Postgres (Neon)**.

---

## 📋 Table of Contents
1. [Quickstart (30 Seconds)](#-quickstart-30-seconds)
2. [Prerequisites](#-prerequisites)
3. [Setting Up the PostgreSQL Database](#-setting-up-the-postgresql-database)
   - [Method 1: Docker / Podman (Recommended & Automated)](#method-1-docker--podman-compose-recommended)
   - [Method 2: Native PostgreSQL on macOS (Homebrew)](#method-2-native-postgresql-on-macos-homebrew)
   - [Method 3: Free Cloud Database (Neon / Vercel Postgres)](#method-3-free-cloud-database-neon--vercel-postgres)
4. [Environment Variables Configuration](#-environment-variables-configuration)
5. [Running the Application Locally](#-running-the-application-locally)
   - [Option A: Vite Dev Server (Frontend Only)](#option-a-vite-dev-server-frontend-only)
   - [Option B: Vercel CLI (Frontend + Serverless API Functions)](#option-b-vercel-cli-full-stack--serverless-api)
6. [Testing the Cron Job & Notifications Locally](#-testing-the-cron-job--notifications-locally)
7. [Parivahan Vahan Co-Pilot Usage](#-parivahan-vahan-co-pilot-usage)
8. [Database Schema & Audit Rules](#-database-schema--audit-rules)
9. [Deploying to Vercel](#-deploying-to-vercel)

---

## ⚡ Quickstart (30 Seconds)

If you have **Docker** or **Podman** installed:

```bash
# 1. Clone or navigate to the project directory
cd /Users/nirmalrajaak/pieq/dump_yard/nikave-transport-solutions

# 2. Install dependencies
npm install

# 3. Spin up PostgreSQL container (auto-loads schema & seed data)
docker compose up -d
# (Or with Podman: podman-compose up -d)

# 4. Copy environment configuration
cp .env.example .env

# 5. Start the frontend development server
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🛠️ Prerequisites

- **Node.js**: v20.x or higher (`node -v`)
- **npm**: v10.x or higher (`npm -v`)
- **PostgreSQL**: v15 or v16 (Local instance, Docker/Podman, or Cloud Neon/Vercel)

---

## 🗄️ Setting Up the PostgreSQL Database

NIKAVE strictly enforces:
- **ZERO Foreign Key constraints** (`REFERENCES`) across all tables.
- **UUID Primary Keys** (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`).
- **Default Timestamps** (`created_at` and `updated_at` defaults).
- **Dedicated Audit Trail** (`audit_logs`) capturing `previous_value` and `new_value` as JSONB.

Choose **one** of the three methods below:

### Method 1: Docker / Podman Compose (Recommended)
The repository includes a ready-to-use [`docker-compose.yml`](file:///Users/nirmalrajaak/pieq/dump_yard/nikave-transport-solutions/docker-compose.yml) which automatically mounts and executes both [`db/schema.sql`](file:///Users/nirmalrajaak/pieq/dump_yard/nikave-transport-solutions/db/schema.sql) and [`db/seed.sql`](file:///Users/nirmalrajaak/pieq/dump_yard/nikave-transport-solutions/db/seed.sql) on container initialization.

```bash
# Start PostgreSQL container
docker compose up -d
# Or if using Podman:
podman-compose up -d

# Verify container is healthy
docker ps  # or podman ps
```
- **Database**: `nikave_db`
- **Username**: `postgres`
- **Password**: `postgres`
- **Port**: `5432`
- **Connection URL**: `postgresql://postgres:postgres@localhost:5432/nikave_db`

---

### Method 2: Native PostgreSQL on macOS (Homebrew)

If running PostgreSQL installed directly on your Mac:

```bash
# 1. Start PostgreSQL service
brew services start postgresql@16

# 2. Create the database
createdb nikave_db

# 3. Run the schema migration (DDL)
psql -d nikave_db -f db/schema.sql

# 4. Populate with realistic Indian commercial fleet seed data
psql -d nikave_db -f db/seed.sql
```

To verify the tables were created:
```bash
psql -d nikave_db -c "\dt"
```
You should see:
- `audit_logs`
- `notification_logs`
- `tax_payment_logs`
- `tax_threshold_configs`
- `vehicle_tax_compliances`
- `vehicles`

---

### Method 3: Free Cloud Database (Neon / Vercel Postgres)

If you prefer a 100% free serverless cloud database:

1. Sign up for free at **[Neon.tech](https://neon.tech)** (Zero credit card required).
2. Create a new project (e.g. `nikave-fleet`).
3. Copy your Connection String (`postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require`).
4. Execute the schema and seed scripts using `psql`:
   ```bash
   psql "postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require" -f db/schema.sql
   psql "postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require" -f db/seed.sql
   ```
5. Paste this connection string into your `.env` file as `POSTGRES_URL` and `DATABASE_URL`.

---

## ⚙️ Environment Variables Configuration

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit your `.env` file with your settings:
```ini
# ============================================================================
# NIKAVE Database Connection
# ============================================================================
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/nikave_db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nikave_db

# ============================================================================
# Vercel Cron Authentication Secret
# ============================================================================
CRON_SECRET=nikave_cron_secret_key_12345

# ============================================================================
# 100% Free Notification Configuration
# ============================================================================
# 1. CallMeBot Free WhatsApp API:
#    - Add +34 644 68 83 23 to your phone as "CallMeBot"
#    - Send WhatsApp message: "I allow callmebot to send me messages"
#    - You will instantly receive your free API key!
CALLMEBOT_PHONE=+919876543210
CALLMEBOT_API_KEY=your_free_api_key_here

# 2. Android Local SMS Gateway (Optional):
ANDROID_GATEWAY_AUTH_KEY=nikave_device_gateway_key_99
ANDROID_GATEWAY_WEBHOOK_URL=http://localhost:3000/api/sms-queue
```

---

## 🚀 Running the Application Locally

### Option A: Vite Dev Server (Frontend Only)
Fastest way to test the UI, Parivahan Co-Pilot, and local state management:

```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)**. 
- Fast Refresh is enabled.
- Data is preloaded with sample Indian commercial vehicles (Tata Signa, Ashok Leyland, BharatBenz, Eicher Pro, Mahindra Blazo).
- Changes to vehicles, threshold configs, and recorded tax payments automatically create audit logs in the **Transactional Audit Trail** tab.

---

### Option B: Vercel CLI (Full-Stack + Serverless API)
To run both the React frontend **AND** the `/api/*` serverless functions (including the cron runner) on a local serverless environment:

```bash
# 1. Install Vercel CLI globally if not already installed
npm i -g vercel

# 2. Run local Vercel server (auto-binds frontend + /api functions)
vercel dev
```
Open **[http://localhost:3000](http://localhost:3000)**.
- Frontend is served at `http://localhost:3000/`
- Cron checker is served at `http://localhost:3000/api/cron-check-renewals`
- Audit logs API is served at `http://localhost:3000/api/audit-logs`
- SMS Queue API is served at `http://localhost:3000/api/sms-queue`

---

## 🔔 Testing the Cron Job & Notifications Locally

### 1. Test via Browser / Simulator
Navigate to the **"Free WhatsApp & SMS Engine"** tab in the UI:
- Click **"Run Daily Cron Now"** to simulate the daily 08:30 AM IST cron job.
- Click **"Open wa.me Link"** to preview the formatted renewal alert in WhatsApp.
- Enter your free CallMeBot API key and click **"Send Test WhatsApp"** to test background delivery to your mobile phone.

### 2. Test via Terminal / Curl (Serverless API)
When running `vercel dev`:
```bash
curl -X GET "http://localhost:3000/api/cron-check-renewals" \
     -H "Authorization: Bearer nikave_cron_secret_key_12345"
```
**Sample JSON Response:**
```json
{
  "status": "success",
  "timestamp": "2026-11-18T01:30:00.000Z",
  "message": "Daily fleet compliance check completed successfully.",
  "vehiclesScanned": 5,
  "alertsTriggered": 2,
  "dispatchResults": [
    {
      "regNo": "TN-01-AX-4825",
      "taxCode": "MV_TAX",
      "daysDelta": 5,
      "deliveryStatus": "SENT"
    }
  ]
}
```

### 3. Inspecting the Transactional Audit Log
```bash
curl -X GET "http://localhost:3000/api/audit-logs?limit=5"
```

---

## 🏛️ Parivahan Vahan Co-Pilot Usage

The official government tax portal is:
**`https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml`**

1. On any vehicle card, click **"Pay on Vahan"** or **"Tax Helper"** in the top navigation.
2. The modal displays:
   - Registration Number (with 1-click copy).
   - **Chassis Last 5 Digits** (highlighted in gold with 1-click copy).
   - Step-by-step guidance on how to navigate the Vahan portal.
3. Click **"Go to Parivahan Vahan Now"** (opens in new tab).
4. On Vahan:
   - Select State & RTO / enter Registration Number.
   - Click "Pay Your Tax".
   - Paste the copied 5-digit chassis number and solve the visual CAPTCHA.
   - Review auto-calculated MV Tax and Green Tax, complete payment via net banking / UPI, and download Form 53 / 54 receipt.
5. Back in NIKAVE:
   - Click **"Finished Payment? Record in NIKAVE"**.
   - Input the Form 54 receipt number and amount paid.
   - Next expiry date is automatically advanced (e.g. +90 days for quarterly MV Tax), status turns **Compliant (Green)**, and a new record is committed to the **Audit Trail**.

---

## 📊 Database Schema & Audit Rules

| Table Name | Description | Key Columns |
|---|---|---|
| `vehicles` | Fleet master record | `id (UUID)`, `registration_number`, `registration_date`, `chassis_number`, `chassis_last_5`, `engine_number`, `owner_name`, `owner_phone`, `financier_name`, `is_hypothecated` |
| `tax_threshold_configs` | Statutory rules & alert lead times | `id (UUID)`, `tax_code`, `pre_expiry_alert_days`, `grace_period_days`, `post_expiry_alert_days`, `penalty_rate` |
| `vehicle_tax_compliances` | Live renewal dates & statuses | `id (UUID)`, `vehicle_id (UUID)`, `tax_code`, `expiry_date`, `last_paid_amount`, `status`, `days_until_expiry` |
| `tax_payment_logs` | Immutable payment history | `id (UUID)`, `vehicle_id (UUID)`, `vehicle_reg_no`, `paid_date`, `amount`, `receipt_challan_no`, `payment_mode` |
| `notification_logs` | Autogenerated alert history | `id (UUID)`, `vehicle_id (UUID)`, `channel`, `recipient_phone`, `trigger_type`, `days_delta`, `delivery_status` |
| `audit_logs` | State transition audit trail | `id (UUID)`, `entity_name`, `entity_id (UUID)`, `action`, `previous_value (JSONB)`, `new_value (JSONB)`, `performed_by` |

> **Audit Guarantee**: Every mutation records both the pre-image (`previous_value`) and post-image (`new_value`) as JSONB inside an atomic transaction (`BEGIN ... COMMIT`).

---

## 🚢 Deploying to Vercel

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "feat: complete NIKAVE Transport Solutions setup"
git push origin main
```

### Step 2: Deploy on Vercel Dashboard
1. Go to **[vercel.com/new](https://vercel.com/new)** and import your GitHub repository.
2. Under **Storage**, add **Vercel Postgres (Neon)** to your project.
3. In **Settings > Environment Variables**, verify or add:
   - `CRON_SECRET`: Random 32-character secret string.
   - `CALLMEBOT_PHONE`: Your WhatsApp number (e.g. `+919876543210`).
   - `CALLMEBOT_API_KEY`: Your free CallMeBot API key.
4. Click **Deploy**.

Vercel automatically:
- Builds the Vite React SPA (`dist/`).
- Provisions the serverless API routes in `/api`.
- Registers the daily **Vercel Cron** job (`0 3 * * *` = 08:30 AM IST) from [`vercel.json`](file:///Users/nirmalrajaak/pieq/dump_yard/nikave-transport-solutions/vercel.json).

---

## 🛠️ Helpful NPM Scripts

```bash
# Run local Vite dev server
npm run dev

# Run TypeScript typecheck and production build
npm run build

# Preview production build locally
npm run preview

# Spin up local PostgreSQL container
npm run db:up

# Stop local PostgreSQL container
npm run db:down

# Run DDL schema migration
npm run db:schema

# Populate realistic seed data
npm run db:seed
```

---

## 📄 License & Ownership

&copy; 2026 **NIKAVE Transport Solutions**. All Rights Reserved. Engineered for Indian Fleet Logistics & Transport Management.
