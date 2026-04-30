A full-stack project management platform designed to help teams organize projects, manage tasks, and track progress efficiently. It features a modern React frontend and a Node.js + Express backend powered by Prisma ORM.
Live URL Link : 
https://team-task-manager-tn7h.onrender.com/


Features
User Authentication (Login / Signup)
Dashboard with project insights
Project Management (Create, View, Manage)
Task Management within projects
Clean UI with sidebar navigation
Fast frontend built with Vite + React
Database powered by Prisma (SQLite in development)
Tech Stack
Frontend
React (Vite)
Tailwind CSS
Context API for state management
Backend
Node.js
Express.js
Prisma ORM
Database
SQLite (development)
Project Structure
Ethara.AI/
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # UI components (Layout, Sidebar, Modal)
│   │   ├── pages/           # Pages (Dashboard, Projects, Auth, etc.)
│   │   ├── contexts/        # Auth context
│   │   ├── utils/           # API helpers
│   │   └── main.jsx
│   └── package.json
│
├── server/                  # Backend API
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   └── server.js        # Entry point
│   ├── prisma/
│   │   ├── schema.prisma    # DB schema
│   │   └── dev.db           # SQLite DB
│   └── package.json
│
└── railway.toml             # Deployment config
Installation & Setup
1. Clone the repository
git clone https://github.com/your-username/ethara-ai.git
cd ethara-ai
2. Setup Backend
cd server
npm install
Configure Environment Variables

Create a .env file based on .env.example:

DATABASE_URL="file:./dev.db"
JWT_SECRET=your_secret_key
PORT=5000
Run Prisma
npx prisma generate
npx prisma migrate dev
Start Backend Server
npm run dev
3. Setup Frontend
cd ../frontend
npm install
npm run dev

Frontend runs on:

http://localhost:5173

Backend runs on:

http://localhost:5000
API Overview
Auth Routes
POST /api/auth/signup
POST /api/auth/login
Project Routes
GET /api/projects
POST /api/projects
GET /api/projects/:id
Task Routes
GET /api/tasks
POST /api/tasks
PUT /api/tasks/:id
DELETE /api/tasks/:id
Dashboard
GET /api/dashboard
Authentication
Uses JWT-based authentication
Protected routes require a valid token
Middleware handles authorization
UI Highlights
Responsive layout with sidebar navigation
Modal components for interactions
Clean dashboard visualization
Structured project and task views
Development Notes
SQLite is used for local development
Prisma schema defines models for:
Users
Projects
Tasks
API follows MVC pattern:
Routes → Controllers → Database
