import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { db } from './database/connection.js';
import authRoutes from './routes/auth.routes.js';
import { swaggerSpec } from './config/swagger.js';

const app = express();

app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/swagger.json', (_req, res) => {
    res.json(swaggerSpec);
});

// Auth routes
app.use('/api/auth', authRoutes);

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