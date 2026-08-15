# Erudio Books - Client

React (SPA) application that consumes the REST API from the [Spring Boot Server](../) for
authentication and book management.

This project was migrated from [Create React App](https://github.com/facebook/create-react-app)
(deprecated) to [Vite](https://vitejs.dev/).

## Stack

- [React 19](https://react.dev/)
- [React Router v7](https://reactrouter.com/)
- [Vite](https://vitejs.dev/) as the build tool and dev server
- [Axios](https://axios-http.com/) for API consumption
- [React Icons](https://react-icons.github.io/react-icons/)

## Prerequisites

- Node.js 18+ (latest LTS recommended)
- The Spring Boot server API running at `http://localhost:8080`
  (see `src/services/api.js` to adjust the `baseURL` if needed)

## Installation

```bash
npm install
```

## Available Scripts

In the project directory, you can run:

### `npm start` / `npm run dev`

Starts the Vite development server.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page automatically reloads (Hot Module Replacement) on every saved edit.

### `npm run build`

Builds the app for production to the `dist` folder.\
The bundle is optimized with tree-shaking, minification, and hashed filenames
for cache busting.

### `npm run preview`

Serves the contents of `dist` locally, useful for testing the production
build before deploying.

### `npm test`

Runs tests with [Vitest](https://vitest.dev/).

## Project Structure

```
client/
├── index.html          # HTML entry point (root, instead of public/)
├── vite.config.js       # Vite configuration
├── public/
│   └── favicon.ico
└── src/
    ├── main.jsx          # React entry point (createRoot)
    ├── App.jsx
    ├── routes.jsx        # Route definitions (react-router-dom v7)
    ├── global.css
    ├── assets/
    ├── pages/
    │   ├── Login/
    │   ├── Books/
    │   └── NewBook/
    └── services/
        └── api.js        # Axios instance (API baseURL)
```

## Learn More

- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://react.dev/)
- [React Router Documentation](https://reactrouter.com/)

### Environment Variables

If the project starts using environment variables, Vite requires the
`VITE_` prefix (instead of Create React App's `REACT_APP_`), accessed via
`import.meta.env.VITE_MY_VARIABLE`.

### Deployment

After running `npm run build`, the contents of the `dist` folder are static
and can be deployed to any static file hosting service (Netlify, Vercel,
GitHub Pages, S3, Nginx, etc).