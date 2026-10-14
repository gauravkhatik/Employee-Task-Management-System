# Roots Media Marketing MERN Assignment

This project is a complete employee and task management application built with the MERN stack. It includes a Node.js + Express backend with MongoDB/Mongoose, and a React frontend with routing, dashboard analytics, list views, forms, filters, and CSV export.

## Features

- Employee CRUD with pagination, search, filtering, and sorting
- Task CRUD with validation and status transitions
- Dashboard with server-calculated metrics
- CSV export for tasks matching current filters
- Responsive UI for mobile, tablet, and desktop screens
- Backend enforcement of all business rules
- URL-synced filters, search, sorting, and page state

## Tech Stack

- Backend: Node.js, Express, Mongoose, MongoDB
- Frontend: React, Vite, React Router
- Database: MongoDB (local MongoDB or in-memory MongoDB for development)

## Local Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd ../client
   npm install
   ```
4. Start the backend:
   ```bash
   cd ../backend
   PORT=5001 npm run dev
   ```
5. Start the frontend:
   ```bash
   cd ../client
   npm run dev
   ```
6. Open the frontend at http://localhost:5173

## Environment Variables

- `PORT`: Backend port (default: 5001)
- `MONGO_URI`: MongoDB connection string. If omitted, the backend starts an in-memory MongoDB instance for local development.
- `CLIENT_URL`: Allowed frontend origin for CORS

## API Overview

### Employee endpoints

- `GET /api/employees`
- `GET /api/employees/:id`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`

### Task endpoints

- `GET /api/tasks`
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `PUT /api/tasks/:id/status`
- `DELETE /api/tasks/:id`
- `GET /api/tasks/export/csv`

### Dashboard endpoints

- `GET /api/dashboard`

## Data Model and Relationships

### Employee

- `employeeId`: unique company employee ID
- `fullName`: employee full name
- `email`: unique email, normalized to lowercase
- `phone`: phone number
- `department`: Development, Design, QA, HR, Sales
- `role`: employee role/title
- `joiningDate`: date of joining
- `status`: Active, Inactive, or On Leave
- `skills`: string array
- `leaveStart`, `leaveEnd`: used only when the employee is on leave

### Task

- `taskId`: auto-generated task identifier
- `title`: task title
- `description`: details
- `assignedEmployee`: employee reference
- `employeeSnapshot`: stored copy of employee details so task history stays meaningful after employee deletion
- `department`: task department
- `priority`: Low, Medium, High, Critical
- `status`: Todo, In Progress, Completed, Cancelled
- `startDate`, `dueDate`: task timeline
- `createdDate`: date created
- `completedDate`: set automatically by the backend only when status becomes Completed

## Employee Deletion Behavior

Employee deletion is blocked when they still have any Todo or In Progress tasks. This prevents invalid assignments and keeps active workload consistent. For historical tasks, the app keeps a snapshot of employee information so the task still displays meaningful employee data even after the employee is removed.

## Validation Notes

### 1. Where status transitions are validated and why
Status transitions are validated in the backend at the task status update route and before task updates. This is the authoritative source, because a user can bypass frontend validation and the server must enforce the same rules consistently.

### 2. Why Completed Date comes from the backend
The backend sets the `completedDate` when a task transitions to `Completed`. This ensures the value is generated only once, cannot be manipulated from the frontend, and stays consistent with the actual business status.

### 3. How inactive / on-leave assignment is blocked
When creating or updating a task, the backend checks the assigned employee status and the task start date. Inactive employees are always rejected. Employees on leave are rejected only when the task start date falls within the leave date range, inclusive.

### 4. Why filtering and pagination are on the backend
The assignment requires server-side filtering, sorting, and pagination so all queries are consistent, scalable, and exportable. It also ensures the same filters used by the UI can be recreated from the URL and applied to the CSV export.

### 5. Why filters live in the URL
Using URL query params makes the current view shareable, reload-safe, and consistent with browser history. Refreshing or reopening a copied URL should restore the exact filtered/sorted page state.

### 6. What can go wrong if two requests assign a 4th active task at the same time
Without concurrency protection, two requests can both read the same employee workload count and both believe there is capacity for one more active task. That leads to a race condition where the employee ends up with four active tasks, violating the rule. The backend should enforce this with atomic checks or server-side transactional logic.

## Assumptions

- A task can be assigned only to a valid active employee at the time of creation or update.
- CSV export returns all tasks matching the active server filters, not just the visible current page.
- The application does not include authentication because the assignment explicitly says no auth is required.
- For local development, an in-memory MongoDB instance is used automatically when `MONGO_URI` is not present.

## Separate Deployment (two Vercel projects)

Deploy the frontend and backend as **two Vercel projects** from the same Git repository. Do not commit `.env` files or local MongoDB data.

Create a MongoDB Atlas cluster first. You will need the connection string before deploying the API.

### 1. Vercel Backend (`backend`)

In Vercel: **Add New → Project → import this repo**.

- Project name: something like `roots-media-api`
- Root Directory: `backend` (click Edit, then select `backend`)
- Framework Preset: Vercel should detect **Express**
- Build Command: leave default (none required)
- Install Command: `npm install`

Set these environment variables on the backend project (Settings → Environment Variables):

- `NODE_ENV`: `production`
- `MONGO_URI`: MongoDB Atlas connection string
- `MONGO_DB_NAME`: `roots_media` (optional if the URI already includes a database name)
- `CLIENT_URL`: the frontend origin, such as `https://your-app.vercel.app` (comma-separated if you have production and preview URLs)

Deploy the backend, then open `https://<your-api>.vercel.app/api/health`. You should see `{ "ok": true, ... }`. Copy that project URL.

The API must be **public**. In the backend project go to **Settings → Deployment Protection** and turn **Vercel Authentication off** (or protect Preview only). If the frontend gets login redirects, CORS errors, or 401s, this setting is still on. Use the Production domain from **Settings → Domains**, not a `*-projects.vercel.app` preview URL.

### 2. Vercel Frontend (`client`)

Add a **second** project from the same repo.

- Project name: something like `roots-media-web`
- Root Directory: `client`
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

Set this environment variable for Production and Preview (Vite inlines it at **build** time, so change it and redeploy if the API URL changes):

- `VITE_API_URL`: `https://<your-api>.vercel.app/api`

After the frontend URL is known, update the backend `CLIENT_URL` to that exact origin (no trailing slash) and redeploy the backend so CORS allows the browser.

`client/vercel.json` rewrites unknown paths to `index.html` so React Router deep links work. Locally, Vite still proxies `/api` to `http://localhost:5001`.

### 3. MongoDB Atlas

Create a database user with only the permissions the application needs. Vercel serverless functions do not use a single static IP, so Atlas Network Access typically needs `0.0.0.0/0` (allow from anywhere) unless you use a plan with static outbound IPs. Restrict that user to this database only. Rotate any credential that has been exposed.
