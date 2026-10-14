
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import employeeRoutes from './routes/employeeRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load .env locally. Vercel uses configured environment variables.
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' });
  dotenv.config();
}

const app = express();

// Configure allowed frontend origins.
// CLIENT_URL can contain multiple comma-separated origins.
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
);

// Allow local development.
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
}

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header can include server-to-server
      // requests and health checks.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

// Health check: confirms the API responds.
// It does not independently verify MongoDB connectivity.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Roots Media API is running',
  });
});

// API routes
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Handle unknown API routes.
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// Central error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || (
    err.message === 'Origin not allowed by CORS' ? 403 : 500
  );

  if (statusCode >= 500) {
    console.error('Server error:', err.message);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? 'Internal server error'
        : err.message || 'Request failed',
  });
});

export default app;
