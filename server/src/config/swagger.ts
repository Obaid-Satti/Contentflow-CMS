import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJSDoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesPath = path.resolve(__dirname, '../routes/*.{ts,js}');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ContentFlow API',
            version: '1.0.0',
            description: 'API documentation for ContentFlow CMS',
        },
        servers: [
            {
                url: '/',
                description: 'Current environment',
            },
            {
                url: 'http://localhost:5000',
                description: 'Local Development Server',
            },
        ],
    },
    apis: [routesPath, './src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);