
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import employeeRoutes from './routes/employeeRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import connectDB from './config/db.js';

// Load local environment variables.
// On Vercel, configure variables in Project Settings.
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' });
  dotenv.config();
}

const app = express();

// --------------------------------------------------
// CORS CONFIGURATION
// --------------------------------------------------

const clientUrlSetting = (process.env.CLIENT_URL || '').trim();

const allowAllOrigins = clientUrlSetting === '*';

const allowedOrigins = new Set(
  clientUrlSetting
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin && origin !== '*')
);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
}

function isAllowedOrigin(origin) {
  // Requests without Origin, such as server-to-server requests.
  if (!origin) return true;

  // Explicit wildcard configuration.
  if (allowAllOrigins) return true;

  const normalizedOrigin = origin.replace(/\/+$/, '');

  // Exact origin match.
  if (allowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  // Allow Vercel preview deployments related to a configured frontend.
  let requestHostname;

  try {
    requestHostname = new URL(normalizedOrigin).hostname;
  } catch {
    return false;
  }

  for (const allowedOrigin of allowedOrigins) {
    try {
      const allowedHostname = new URL(allowedOrigin).hostname;

      if (
        !allowedHostname.endsWith('.vercel.app') ||
        !requestHostname.endsWith('.vercel.app')
      ) {
        continue;
      }

      const projectSlug = allowedHostname.replace(/\.vercel\.app$/, '');

      if (
        requestHostname === allowedHostname ||
        requestHostname.startsWith(`${projectSlug}-`)
      ) {
        return true;
      }
    } catch {
      // Ignore invalid configured origins.
    }
  }

  return false;
}


// Register CORS before routes and database middleware.
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    }
  })
);

app.use(express.json());

// --------------------------------------------------
// ROOT & HEALTH CHECK
// --------------------------------------------------

app.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Employee Task Management API',
    health: '/api/health',
  });
});

// --------------------------------------------------
// DATABASE CONNECTION
// --------------------------------------------------

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);

    res.status(503).json({
      success: false,
      message: 'Database unavailable',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'API is running',
  });
});

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --------------------------------------------------
// 404 HANDLER
// --------------------------------------------------

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
});

// --------------------------------------------------
// CENTRAL ERROR HANDLER
// --------------------------------------------------

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const duplicateField = Object.keys(err.keyPattern || {})[0];
  const duplicateMessages = {
    employeeId: 'Employee ID already exists.',
    email: 'Email is already in use.'
  };
  const isDuplicateKeyError = err.code === 11000;
  const statusCode = isDuplicateKeyError
    ? 409
    : err.message === 'Origin not allowed by CORS'
      ? 403
      : err.statusCode || 500;
  const message = isDuplicateKeyError
    ? duplicateMessages[duplicateField] || 'A record with this value already exists.'
    : statusCode < 500
      ? err.message || 'Request failed'
      : statusCode === 503
        ? 'Database unavailable'
        : 'Internal server error';

  if (statusCode >= 500) {
    console.error('Server error:', err.message);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
});

export default app;
