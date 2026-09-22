import swaggerJSDoc from 'swagger-jsdoc';

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
                url: 'http://localhost:5000',
            },
        ],
    },
    apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);