# TechQuiz Application 🚀

A full-stack MERN Technical Quiz Application with Real-Time functionalities.

## Features
- **Student Portal**: Register, Login, Take Quiz (Timer, Auto-submit).
- **Admin Portal**: Secure Login, Real-time Dashboard (Socket.io).
- **Live Updates**: Score updates and active participant count.
- **Security**: JWT Authentication, Bcrypt Password Hashing.

## Tech Stack
- MongoDB, Express.js, React, Node.js
- Socket.io for Real-time communication
- Vite for Frontend tooling

## Folder Structure
- `/backend`: Node.js API Server
- `/frontend`: React Client Application

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed locally or Atlas URI

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file with:
# PORT=5000
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
npm start
```
The backend runs on http://localhost:5000.
It will automatically seed 2 Admin accounts:
- kit28.24bad188@gmail.com / yuva2503
- kit28.24bad133@gmail.com / sam0820

And 10 Sample Questions.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend runs on http://localhost:5173.

## Deployment Guide

### Backend (Render)
1. Create a new Web Service on Render connected to your Git repo.
2. Set Root Directory to `backend`.
3. Set Build Command: `npm install`.
4. Set Start Command: `node server.js`.
5. Add Environment Variables (MONGO_URI, JWT_SECRET).

### Frontend (Vercel)
1. Import project to Vercel.
2. Set Root Directory to `frontend`.
3. Set Build Command: `npm run build`.
4. Set Output Directory: `dist`.
5. Update API URL in frontend code to point to Render backend URL.

## API Endpoints
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/quiz` (Protected)
- POST `/api/quiz/submit` (Protected)
- GET `/api/admin/dashboard` (Admin Protected)
