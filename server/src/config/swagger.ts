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
        tags: [
            { name: 'Authentication', description: 'Admin authentication and login' },
            { name: 'Content Types', description: 'Content type schema management' },
            { name: 'Content Entries', description: 'Content entry management' },
            { name: 'Media', description: 'Media uploads and asset library' },
            { name: 'API Tokens', description: 'API token generation and management' },
            { name: 'Public Content', description: 'Public content delivery API for consuming published content' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Admin JWT access token',
                },
                apiTokenAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    description: 'Public API token (starts with cf_)',
                },
            },
        },
    },
    apis: [routesPath, './src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);