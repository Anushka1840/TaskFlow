# TaskFlow — Task Management System
A full-stack task management app where users can register, log in, and manage their personal tasks with priorities, due dates, and status tracking.
Live App: https://task-flow-dpfaav0i3-anushka-srivastavas-projects-627481ec.vercel.app
Backend API: https://taskflow-production-70eb.up.railway.app
Demo Login:
Email:    demo@example.com
Password: password123

# Track
Track A — Full-Stack Engineer (Backend API + Web Frontend)

# Tech Used
Backend — Node.js, TypeScript, Express, PostgreSQL, Prisma, JWT, bcrypt, Zod, Helmet, Morgan, express-rate-limit
Frontend — Next.js 14, TypeScript, Tailwind CSS, Axios, React Hook Form, react-hot-toast

# Features

Register and login with JWT authentication. Access tokens expire in 15 minutes, refresh tokens last 7 days and are rotated on every use. Logout deletes the token from the database so it can never be used again.
Full task CRUD — create, edit, delete, and toggle status (Pending → In Progress → Completed).
Tasks have a priority field (Low, Medium, High) — high priority tasks appear first automatically.
Task list supports pagination, search by title, and filtering by status and priority.
Auth routes are rate limited to 10 requests per 15 minutes to prevent brute force attacks.
Helmet.js adds security headers to every response.
Consistent API response format on every endpoint: { success, message, data }


# How to Run Locally
You need Node.js 18+ and PostgreSQL installed.
Create the database first:
bashpsql -U postgres
CREATE DATABASE taskmanagement;
\q
Backend setup:
bashcd backend
npm install
cp .env.example .env
# Edit .env — add your postgres password and any random string for JWT secrets
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
Frontend setup (open a new terminal):
bashcd frontend
npm install
cp .env.local.example .env.local
npm run dev
App runs at http://localhost:3000

# A Few Decisions I Made
I used refresh token rotation so users stay logged in without needing to re-enter their password, while still being able to fully log out. Tokens are stored in localStorage for simplicity — in production I would use httpOnly cookies to prevent XSS.
I chose Prisma because it gives full type safety on database queries and the schema file acts as a single source of truth. Much easier to maintain than writing raw SQL.
I added the priority field even though it wasn't required because every real task management tool needs it and it only took a small amount of extra work.
