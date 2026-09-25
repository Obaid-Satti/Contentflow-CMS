import cors from 'cors';
import express from 'express';
import { swaggerSpec } from './config/swagger.js';
import adminRoutes from './routes/admin.routes.js';
import apiTokenRoutes from './routes/api-token.routes.js';
import authRoutes from './routes/auth.routes.js';
import contentTypeRoutes from './routes/content-type.routes.js';
import mediaRoutes from './routes/media.routes.js';
import publicContentRoutes from './routes/public-content.routes.js';
const app = express();

const allowedOrigins = new Set(
    [process.env.FRONTEND_URL, ...(process.env.FRONTEND_URLS ?? '').split(',')]
        .map((origin) => origin?.trim())
        .filter((origin): origin is string => Boolean(origin)),
);
const isContentFlowVercelPreview = (origin: string) =>
    /^https:\/\/contentflow-cms-[a-z0-9-]+\.vercel\.app$/i.test(origin);

app.use(
    cors({
        origin: (origin, callback) => {
            callback(null, !origin || allowedOrigins.has(origin) || isContentFlowVercelPreview(origin));
        },
    }),
);

app.use(express.json());

// Swagger documentation (served via CDN for zero-dependency Vercel compatibility)
const SWAGGER_VERSION = '5.18.2';
const SWAGGER_CDN = `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_VERSION}`;

const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ContentFlow API Documentation</title>
  <link rel="stylesheet" type="text/css" href="${SWAGGER_CDN}/swagger-ui.min.css" />
  <link rel="icon" type="image/png" href="${SWAGGER_CDN}/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="${SWAGGER_CDN}/favicon-16x16.png" sizes="16x16" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      background: #fafafa;
    }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_CDN}/swagger-ui-bundle.min.js"></script>
  <script src="${SWAGGER_CDN}/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;

app.get(['/api-docs', '/api-docs/'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(swaggerHtml);
});

app.get(['/api-docs/swagger.json', '/api-docs.json'], (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
});

// Fallbacks for browsers that cached relative paths from previous visits
app.get(['/api-docs/swagger-ui-bundle.js', '/swagger-ui-bundle.js'], (_req, res) => {
    res.redirect(`${SWAGGER_CDN}/swagger-ui-bundle.min.js`);
});
app.get(['/api-docs/swagger-ui-standalone-preset.js', '/swagger-ui-standalone-preset.js'], (_req, res) => {
    res.redirect(`${SWAGGER_CDN}/swagger-ui-standalone-preset.min.js`);
});
app.get(['/api-docs/swagger-ui.css', '/swagger-ui.css'], (_req, res) => {
    res.redirect(`${SWAGGER_CDN}/swagger-ui.min.css`);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/api-tokens', apiTokenRoutes);
app.use('/api/content-types', contentTypeRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api', publicContentRoutes);

export default app;
