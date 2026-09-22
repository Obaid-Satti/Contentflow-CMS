import express from 'express';
import { db } from './database/connection.js';

const app = express();

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({
      status: 'ok',
      message: 'ContentFlow API is running',
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'ContentFlow API is running, but database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default app;
