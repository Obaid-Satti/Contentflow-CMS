# ContentFlow CMS

A self-hosted, headless Content Management System built with **React**, **TypeScript**, **Express**, and **PostgreSQL**. ContentFlow lets you define dynamic content schemas, manage entries through an admin dashboard, store media via Cloudinary, and deliver content to any frontend through a secured public REST API.

## Features

- **Content Type Builder** — Define custom schemas with typed fields. Changes are reflected instantly in the admin UI and public API.
- **Content Manager** — Create, edit, search, sort, and delete entries for any content type through a paginated table view.
- **Media Library** — Upload images and files to Cloudinary, manage alt text, and attach media to content entries via a `media` field type.
- **Public REST API** — Read-only API secured by API tokens with support for pagination, sorting, and field filtering.
- **API Token Management** — Generate named tokens (prefixed `cf_`) to authenticate public API consumers. Tokens are hashed at rest and shown only once on creation.
- **Swagger Docs** — Interactive API documentation available at `/api-docs`.
- **First-admin Registration** — Registration is open only until the first admin account is created, then locked.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TanStack Query, React Router |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 17 via Knex.js (query builder + migrations) |
| Media Storage | Cloudinary (signed upload) |
| Auth | JWT (admin sessions), hashed API tokens (public API) |
| API Docs | Swagger UI (OpenAPI 3.0) |
| Testing | Vitest |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker & Docker Compose](https://www.docker.com/) (for the local PostgreSQL database)
- A free [Cloudinary](https://cloudinary.com/) account

---

### 1. Clone the Repository

```bash
git clone https://github.com/Obaid-Satti/Contentflow-CMS.git
cd Contentflow-CMS
```

---

### 2. Environment Setup

Copy the example env file to the project root **and** into the `server/` directory:

```bash
# Linux / macOS
cp .env.example .env
cp .env.example server/.env
```

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
Copy-Item .env.example server/.env
```

Then open both `.env` files and fill in your values — at minimum set `CLOUDINARY_URL`:

```env
# Application
PORT=5000
NODE_ENV=development

# PostgreSQL / Knex
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=contentflow
DB_PASSWORD=change_me
DB_NAME=contentflow

# PostgreSQL Docker container
POSTGRES_USER=contentflow
POSTGRES_PASSWORD=change_me
POSTGRES_DB=contentflow

# Cloudinary (required for media uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

> Your `CLOUDINARY_URL` is in the [Cloudinary Console](https://console.cloudinary.com/) under **Dashboard → API Keys**.

---

### 3. Start the Database

```bash
docker compose up -d
```

---

### 4. Install Dependencies

```bash
# Server
cd server && npm install && cd ..

# Client
cd client && npm install && cd ..
```

---

### 5. Run Database Migrations

```bash
cd server
npm run migrate
cd ..
```

#### Using Neon (Cloud PostgreSQL) instead of Docker

```powershell
# PowerShell
cd server
$env:DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
npx knex --knexfile knexfile.ts migrate:latest --env production
cd ..
```

```bash
# Bash
cd server
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require" npx knex --knexfile knexfile.ts migrate:latest --env production
cd ..
```

---

### 6. Start the Application

Open **two terminals** and run each dev server:

```bash
# Terminal 1 — Backend
cd server && npm run dev
```

```bash
# Terminal 2 — Frontend
cd client && npm run dev
```

| Service | URL |
|---|---|
| Admin dashboard | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Swagger / API docs | http://localhost:5000/api-docs |

On first visit you will be prompted to create the initial admin account. Registration is automatically disabled once an admin exists.

---

## Field Types

When building a content type, you can add fields of the following types:

| Type | Description | Supports `unique` |
|---|---|---|
| `short_text` | Single-line string | ✅ |
| `long_text` | Multi-line text (textarea) | — |
| `number` | Finite numeric value (integer or decimal) | — |
| `boolean` | `true` / `false` toggle | — |
| `date` | Calendar date in `YYYY-MM-DD` format | — |
| `email` | Validated email address | ✅ |
| `enumeration` | Dropdown — choose from a predefined list of options | — |
| `media` | Reference to an uploaded file from the Media Library | — |

Fields can be marked as **required**. `short_text` and `email` fields can additionally be marked as **unique**, which enforces a database-level unique constraint.

---

## API Reference

ContentFlow exposes a public, read-only REST API for delivering content to any application or frontend.

### Authentication

All public API requests require an API token in the `Authorization` header:

```
Authorization: Bearer cf_xxxxxxxxxxxxx
```

Tokens are created in the admin dashboard under **Settings → API Tokens**. The plaintext token is shown only once on creation — store it securely.

| Scenario | HTTP Status |
|---|---|
| Missing token | `401 Unauthorized` |
| Invalid or revoked token | `401 Unauthorized` |

---

### Endpoints

#### List Entries

```
GET /api/:apiId
```

Fetches a paginated list of entries for a content type identified by its `apiId`.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number to retrieve |
| `pageSize` | integer | `10` | Entries per page (max `100`) |
| `sort` | string | `updated_at:desc` | Sort field and direction — e.g. `title:asc` |
| `filters[field][equals]` | string | — | Exact match filter — e.g. `?filters[status][equals]=published` |
| `filters[field][contains]` | string | — | Case-insensitive text search (text fields only) — e.g. `?filters[title][contains]=tomato` |

**Example request**

```
GET /api/articles?page=1&pageSize=10&sort=published_on:desc&filters[title][contains]=tomato
Authorization: Bearer cf_xxxxxxxxxxxxx
```

**Example response** (`200 OK`)

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

---

#### Get Single Entry

```
GET /api/:apiId/:entryId
```

Fetches a single entry by its numeric ID. `media` fields are automatically expanded to include the full file URL and metadata.

**Example request**

```
GET /api/articles/1
Authorization: Bearer cf_xxxxxxxxxxxxx
```

**Example response** (`200 OK`)

```json
{
  "data": {
    "id": 1,
    "title": "Tomato growing guide",
    "content": "Master the art of cultivating sweet summer tomatoes...",
    "cover_image": {
      "id": 3,
      "url": "https://res.cloudinary.com/.../image.jpg",
      "file_name": "tomato.jpg",
      "mime": "image/jpeg",
      "alt_text": "A ripe tomato on the vine"
    },
    "published_on": "2026-09-28",
    "created_at": "2026-09-28T04:10:00.000Z",
    "updated_at": "2026-09-28T04:20:00.000Z"
  }
}
```

---

### Response Status Codes

| Code | Meaning |
|---|---|
| `200 OK` | Request successful |
| `400 Bad Request` | Invalid parameter or `contains` filter applied to a non-text field |
| `401 Unauthorized` | Missing, invalid, or revoked API token |
| `404 Not Found` | Unknown content type `apiId` or entry ID |
| `500 Server Error` | Unexpected server error |

---

## Running Tests

Run the automated test suite for the public API (pagination, sorting, filtering, authentication):

```bash
cd server
npm test src/tests/public-api.test.ts
```

---

## Project Structure

```
ContentFlow/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/           # Content Types, Content Manager, Media Library, Settings
│       ├── services/        # API service functions (Axios + TanStack Query)
│       ├── components/      # Shared UI components
│       └── context/         # Auth context and JWT management
├── server/                  # Express backend
│   └── src/
│       ├── controllers/     # Route handler logic
│       ├── models/          # Database query functions (Knex)
│       ├── routes/          # Express routers with Swagger annotations
│       ├── middleware/       # JWT auth, API token auth
│       ├── schemas/         # Zod validation schemas
│       └── database/        # Knex connection, migrations, seed data
├── docker-compose.yml       # PostgreSQL 17 container
└── .env.example             # Environment variable template
```

---

## License

MIT
