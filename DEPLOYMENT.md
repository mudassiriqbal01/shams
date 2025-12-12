# VERV BMS Deployment Guide

This guide details the steps to deploy the VERV Business Management System (BMS) to the cloud using a zero-cost stack:
- **Database:** Neon (PostgreSQL)
- **API Backend:** Render (NestJS)
- **Frontend:** Vercel (React)

## Prerequisites
- GitHub Account
- Accounts on [Neon](https://neon.tech), [Render](https://render.com), and [Vercel](https://vercel.com)
- Git installed locally

---

## Section 1: Neon Setup (Database)

1. **Create Project:**
   - Log in to [Neon Console](https://console.neon.tech).
   - Click "New Project".
   - Name it `verv-bms`.
   - Choose the region closest to your users.
   - Click "Create Project".

2. **Get Connection String:**
   - On the Dashboard, look for the "Connection Details" section.
   - Copy the "Connection string" (e.g., `postgresql://user:password@ep-xyz.region.neon.tech/neondb`).
   - Save this securely.

3. **Initialize Database:**
   - Go to the "SQL Editor" in the Neon sidebar.
   - Open the file `migration.sql` from this repository.
   - Copy the contents and paste them into the Neon SQL Editor.
   - Run the query to create tables and seed initial data.

---

## Section 2: Render Setup (Backend API)

1. **Connect Repository:**
   - Log in to [Render Dashboard](https://dashboard.render.com).
   - Click "New +" -> "Web Service".
   - Connect your GitHub repository `mudassiriqbal01/shams`.

2. **Configure Service:**
   - **Name:** `verv-bms-api`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:api`
   - **Plan:** Free

3. **Environment Variables:**
   - Scroll down to "Environment Variables" and add:
     - `DATABASE_URL`: (Paste connection string from Neon)
     - `JWT_SECRET`: (Generate a secure random string)
     - `NODE_ENV`: `production`

4. **Deploy:**
   - Click "Create Web Service".
   - Render will start the first build.
   - Once live, copy the service URL (e.g., `https://verv-bms-api.onrender.com`).

5. **Setup Webhook (for CI/CD):**
   - Go to "Settings" -> "Deploy Hook".
   - Copy the Deploy Hook URL.
   - Add this to your GitHub Repository Secrets as `RENDER_DEPLOY_HOOK_URL`.

---

## Section 3: Vercel Setup (Frontend)

1. **Import Project:**
   - Log in to [Vercel Dashboard](https://vercel.com/dashboard).
   - Click "Add New..." -> "Project".
   - Import the `mudassiriqbal01/shams` repository.

2. **Configure Project:**
   - **Framework Preset:** Create React App (or Other if custom)
   - **Root Directory:** `apps/web` (Important!)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist` (or `build` depending on your setup)

3. **Environment Variables:**
   - Add the following:
     - `REACT_APP_API_URL`: (Paste the Render API URL from Section 2)

4. **Deploy:**
   - Click "Deploy".
   - Vercel will build and deploy the frontend.

5. **Setup Webhook (Optional for manual triggers):**
   - Go to Settings -> Git -> Deploy Hooks.
   - Create a hook and save the URL as `VERCEL_DEPLOY_HOOK_URL` in GitHub Secrets.

---

## Section 4: Environment Variables Checklist

Ensure these are set in the respective platforms. **NEVER** commit them to Git.

| Variable | Platform | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Render, Neon | PostgreSQL connection string |
| `JWT_SECRET` | Render | Secret key for signing tokens |
| `NODE_ENV` | Render | Set to `production` |
| `REACT_APP_API_URL` | Vercel | URL of the deployed Render API |
| `MAIL_SERVER` | GitHub Secrets | SMTP Server for notifications |
| `MAIL_USERNAME` | GitHub Secrets | SMTP Username |
| `MAIL_PASSWORD` | GitHub Secrets | SMTP Password |

---

## Section 5: Verification

1. **API Health Check:**
   - Visit `https://<your-render-url>/api/health`.
   - Expect: `{"status":"ok"}`.

2. **Frontend Access:**
   - Visit `https://<your-vercel-url>`.
   - Ensure the app loads and can communicate with the API (check Network tab for calls to Render).

3. **Database Connectivity:**
   - Log in to the app (if login implemented) and verify data is fetched from Neon.

---

## Section 6: Troubleshooting

- **Build Failures:** Check the "Logs" tab in Render or Vercel. Ensure dependencies are listed in `package.json`.
- **Database Errors:** Verify `DATABASE_URL` is correct and the IP is not blocked (Neon allows all by default, but check settings).
- **CORS Issues:** If frontend cannot talk to backend, ensure NestJS CORS is enabled and allows the Vercel domain.

---

## Section 7: Monitoring

- **Render:** View "Logs" and "Events" tabs for the service.
- **Vercel:** View "Deployments" and "Logs" for build and runtime errors.
- **Neon:** Monitor database storage and compute usage in the Neon Console.
- **Email:** Check `mudassir@vervhq.com` for deployment status emails.
