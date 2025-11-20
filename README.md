HOMZON APP - Minimal scaffold
----------------------------

Backend:
- Folder: backend
- Configure .env (copy .env.example -> .env) and set MONGO_URI & JWT_SECRET.
- Run:
    cd backend
    npm install
    npm run dev
  Server runs on http://localhost:4000

Frontend:
- Folder: frontend
- Run:
    cd frontend
    npm install
    npm run dev
  Frontend runs on http://localhost:3000

Notes:
- This scaffold provides the required flows in a minimal form:
  * Admin registers HR (generated ID & password shown in popup)
  * HR registers Supervisor/Employee (generated credentials shown)
  * Login UI switches fields depending on role (admin uses mobile+password; others use ID+password)
  * Dashboard pages per role with simplified/demo actions (attendance, leave, advance)
- You should secure localStorage and implement full auth + role checks in frontend for production.
- For mobile support, use responsive styles or add Tailwind.

