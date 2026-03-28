# Cedex Frontend

React + Vite frontend for Cedex policy/cession workflows.

## Local Run

1. Install deps:
```bash
npm install
```

2. Create env file:
```bash
cp .env.example .env
```

3. Start:
```bash
npm run dev -- --host 127.0.0.1
```

## Vercel Deploy (Exact Settings)

Use these values when importing this repo into Vercel:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Environment variable (Project Settings -> Environment Variables):

- Key: `VITE_API_BASE_URL`
- Value: `https://<your-backend-domain>/api`

Example:

- `VITE_API_BASE_URL=https://cedex-api.onrender.com/api`

Notes:

- SPA routing is handled by `vercel.json` rewrite to `index.html`.
- If backend is not public, hosted frontend login/data calls will fail until `VITE_API_BASE_URL` points to a reachable API.
