# Deployment Secrets Configuration

Since environment variables are sensitive and should not be committed to the repository, they must be configured manually in the deployment platform dashboards.

## Render (Backend)

1. Go to your **Service Settings**.
2. Navigate to the **Environment** tab.
3. Add the following environment variables:

| Key | Value | Description |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Connection string from Neon PostgreSQL |
| `JWT_SECRET` | `...` | A secure 64-character random string |
| `NODE_ENV` | `production` | Set the environment to production |

## Vercel (Frontend)

1. Go to your **Project Settings**.
2. Navigate to **Environment Variables**.
3. Add the following environment variable:

| Key | Value | Description |
|-----|-------|-------------|
| `REACT_APP_API_URL` | `https://your-render-service.onrender.com` | The URL of your deployed Render backend |
