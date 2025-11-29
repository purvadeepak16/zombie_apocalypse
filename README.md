# zombie_apocalypse
Zombie Apocalypse Survival Game - A REST API powered survival game  where players make decisions to survive 14 days in a zombie apocalypse.  Built with React (Frontend), Node.js/Express (Backend), and features  randomized outcomes, state management, and a leaderboard system.

# Tech Stack
Frontend: React, Tailwind CSS, Lucide Icons
Backend: Node.js, Express.js, CORS, Body-Parser
Storage: In-Memory Database
Communication: REST API with JSON
# Installation
# Backend
```bash
cd zombie-apocalypse-api
npm install
node server.js
```
# Frontend 
```bash
cd zombie-apocalypse-frontend
npm start
```
# API Endpoints
```bash
POST /api/survivors - Create new survivor
GET /api/survivors/:id - Get survivor status
POST /api/survivors/:id/decisions - Make decision
GET /api/leaderboard - Get top scores
POST /api/leaderboard - Add score
```
