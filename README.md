# TaskFlow

A full-stack task management app built with React, Node.js/Express, and MySQL.

## Live Demo
- **Frontend**: https://taskflow-app.vercel.app *(replace with your URL)*
- **Backend API**: https://taskflow-api.onrender.com *(replace with your URL)*

## Features

### Backend
- JWT Authentication (register, login, logout)
- Password reset via email link
- CRUD for 3 resources: Users, Projects, Tasks
- File upload for profile avatar (Multer)
- Server-side validation (express-validator)
- Environment variables via `.env`

### Frontend
- Protected routes with persistent login (JWT in localStorage)
- Dark / Light mode toggle (saved in localStorage)
- Dashboard with charts: pie, bar, line (Recharts)
- Export tasks to CSV or PDF
- Search & filter tasks by status, priority, project
- Client-side form validation
- Fully responsive (mobile + desktop)

## Tech Stack
- **Frontend**: React 18, React Router v6, Recharts, Axios
- **Backend**: Node.js, Express, MySQL2, JWT, Multer, Nodemailer
- **Database**: MySQL

## Local Setup

### Prerequisites
- Node.js 18+
- MySQL running locally

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials and secrets
mysql -u root -p < config/schema.sql
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Set REACT_APP_API_URL=http://localhost:5000/api
npm start
```

## Deployment

### Database → Railway (MySQL)
1. Create new project on Railway
2. Add MySQL plugin
3. Copy the connection variables into your backend `.env`

### Backend → Render
1. Push backend folder to GitHub
2. New Web Service on Render → connect repo
3. Build: `npm install` | Start: `node server.js`
4. Add all `.env` variables in Render dashboard

### Frontend → Vercel
1. Push frontend folder to GitHub
2. Import on Vercel
3. Set `REACT_APP_API_URL` env var to your Render backend URL
4. Deploy

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/auth/avatar | Yes | Upload avatar |
| POST | /api/auth/forgot-password | No | Request reset |
| POST | /api/auth/reset-password | No | Reset password |
| GET | /api/projects | Yes | List projects |
| POST | /api/projects | Yes | Create project |
| PUT | /api/projects/:id | Yes | Update project |
| DELETE | /api/projects/:id | Yes | Delete project |
| GET | /api/tasks | Yes | List tasks (filter/search) |
| GET | /api/tasks/stats | Yes | Dashboard stats |
| POST | /api/tasks | Yes | Create task |
| PUT | /api/tasks/:id | Yes | Update task |
| DELETE | /api/tasks/:id | Yes | Delete task |
