import express from 'express';
import app from './src/app.js';

// Vercel detects Express from this file (project root) and uses the
// default export as the serverless handler. Do not call app.listen() here.
void express;

export default app;
