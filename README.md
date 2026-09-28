# ContentFlow CMS

A headless Content Management System built with React, TypeScript, Express, and PostgreSQL. ContentFlow allows you to create dynamic content types, manage entries, and consume content through a secured public REST API.

## Getting Started

### Prerequisites

- Node.js (v20+)
- npm
- Docker & Docker Compose

### 1. Environment Setup

Copy `.env.example` to `.env` in both root and `server/`:

```bash
cp .env.example .env
cp .env.example server/.env
```

### 2. Start PostgreSQL Database

For local development with Docker:

```bash
docker compose up -d
```

### 3. Run Database Migrations

For local PostgreSQL:

```bash
cd server
npm run migrate
cd ..
```

If you are using Neon PostgreSQL (Cloud):

In PowerShell:

```powershell
cd server
$env:DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
npx knex --knexfile knexfile.ts migrate:latest --env production
cd ..
```

In Bash:

```bash
cd server
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require" npx knex --knexfile knexfile.ts migrate:latest --env production
cd ..
```

### 4. Start the Application

In one terminal, start the backend server:

```bash
cd server
npm run dev
```

In another terminal, start the frontend client:

```bash
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Swagger Docs: http://localhost:5000/api-docs

## API Reference

ContentFlow provides a public, read-only REST API for fetching published content into any frontend or application.

### Authentication

All public API requests require an API token sent in the `Authorization` header:

```text
Authorization: Bearer cf_xxx
```

Tokens can be created and managed in the admin dashboard under Settings > API Tokens.

- Missing token: `401 Unauthorized`
- Invalid or deleted token: `401 Unauthorized`

### Endpoints

#### 1. List Entries

```text
GET /api/:apiId
```

Fetches a paginated list of entries for the specified content type.

Available query parameters:

- `page` (`?page=2`) : Which page to get (default: `1`)
- `pageSize` (`?pageSize=10`) : Entries per page, maximum 100 (default: `10`)
- `sort` (`?sort=title:asc`) : Sort by a field in `asc` or `desc` order
- `filters[field][equals]` (`?filters[status][equals]=published`) : Exact match filter
- `filters[field][contains]` (`?filters[title][contains]=tomato`) : Text contains value (text fields only)

Example request:

```text
GET /api/articles?page=1&pageSize=10&sort=published_on:desc&filters[title][contains]=tomato
Authorization: Bearer cf_xxx
```

Example response (`200 OK`):

Every list response includes the entries in `data` and pagination details in `meta` so the developer knows whether more pages are available:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Tomato growing guide",
      "published_on": "2026-09-28",
      "views": 890,
      "created_at": "2026-09-28T04:10:00.000Z",
      "updated_at": "2026-09-28T04:20:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### 2. Get Single Entry

```text
GET /api/:apiId/:entryId
```

Fetches a single entry by its numeric ID.

Example request:

```text
GET /api/articles/1
Authorization: Bearer cf_xxx
```

Example response (`200 OK`):

```json
{
  "data": {
    "id": 1,
    "title": "Tomato growing guide",
    "content": "Master the art of cultivating sweet summer tomatoes...",
    "published_on": "2026-09-28",
    "created_at": "2026-09-28T04:10:00.000Z",
    "updated_at": "2026-09-28T04:20:00.000Z"
  }
}
```

### Response Status Codes

- `200 OK` : Request was successful and returned content data.
- `400 Bad Request` : Invalid parameter value or attempting `contains` on non-text fields.
- `401 Unauthorized` : Missing, invalid, or revoked API token.
- `404 Not Found` : Unknown content type API ID or entry ID.
- `500 Server Error` : Server encountered an unexpected error.

## Running Tests

To run the automated tests for the public API and query parameters (T-API-06):

```bash
cd server
npm test src/tests/public-api.test.ts
```
