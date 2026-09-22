# ContentFlow CMS

A Mini Headless CMS built with React, TypeScript, Vite, and Tailwind CSS.

## Prerequisites

Make sure the following are installed on your system:

- Node.js
- npm
- Git

You can verify the installations with:

```bash
node --version
npm --version
git --version
```

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the client directory:

```bash
cd ContentFlow/client
```

Install the project dependencies:

```bash
npm install
```

## Run the Development Server

Start the development server:

```bash
npm run dev
```

Vite will display the local development URL in the terminal. Open that URL in your browser.

Example:

```text
http://localhost:5173
```

## Lint

Run ESLint to check the project for code quality issues:

```bash
npm run lint
```

## Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
client/
├── public/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── components.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## Available Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |

## Development Notes

- Run `npm install` after cloning the project.
- Use `npm run dev` during development.
- Run `npm run lint` before committing changes.
- Run `npm run build` to verify that the project builds successfully.