@echo off
start cmd /k "cd backend && npm start"
start cmd /k "cd frontend && npm run dev"
echo Started Backend and Frontend in separate windows.
