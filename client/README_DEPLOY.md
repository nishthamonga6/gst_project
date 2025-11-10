Deployment checklist for Vercel (frontend)

1. In Vercel project settings -> Environment Variables, set:
   - VITE_API_BASE = https://<your-backend-url>

2. Build & Output
   - Vercel will run `npm run build` (configured in package.json).
   - Output directory: `dist` (configured in `vercel.json`).

3. Backend
   - Deploy your Express backend to a server (Render, Railway, Heroku, or VPS).
   - Ensure the backend's `CLIENT_ORIGIN` env var is set to your Vercel app URL (e.g. https://my-app.vercel.app).
   - Set backend env vars: `MONGO_URI`, `JWT_SECRET`, and any other secrets.

4. CORS & Cookies
   - Server uses cookie-based JWT authentication. Cookies are set for the backend domain and are httpOnly.
   - Make sure fetch requests from the frontend include credentials: e.g., fetch(url, { credentials: 'include' }).
   - Ensure backend CORS allows the Vercel origin and `credentials: true` (already supported if `CLIENT_ORIGIN` is set).

5. Testing
   - After deploying both frontend and backend, set VITE_API_BASE to the backend URL, then visit the Vercel URL.
   - Test signup/login flows and verify that cookies are set and authenticated requests succeed.

Notes
- If you prefer hosting the backend as serverless functions on Vercel, you'll need to adapt the Express app into serverless handlers and move endpoints into Vercel functions.
- The frontend build is a static site produced by Vite; ensure that backend supports persistent sessions or stateless JWT as configured.
