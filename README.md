# BillingQGen

A React + Vite web application for generating billing questions, with GitHub Pages deployment and Replit compatibility.

## Features

- React + Vite frontend
- GitHub Pages deployment
- Replit compatibility
- PWA support for offline access
- Node.js backend with Express

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Running the Backend

```bash
npm install
node server.js
```

The backend will be available at `http://localhost:8000`.

### Environment Configuration

The frontend uses environment variables to determine the API URL. You can configure this in the `frontend/.env` file:

```
# Use this for local development
VITE_API_URL=http://localhost:8000

# Use this for Replit
# VITE_API_URL=https://billingqgen.amrassal1991.repl.co

# Use this for GitHub Pages
# VITE_API_URL=https://amrassal1991.github.io/BillingQGen
```

Uncomment the appropriate line based on your deployment environment.

## Deployment

### GitHub Pages

To deploy to GitHub Pages:

```bash
cd frontend
npm run deploy
```

This will build the frontend and deploy it to GitHub Pages.

### Replit

To run on Replit:

1. Import the repository into Replit
2. Set the run command to `npm install && node server.js`
3. Update the `frontend/.env` file to use the Replit URL

## PWA Support

This application supports Progressive Web App (PWA) features, allowing it to be installed on devices and work offline. To install:

1. Visit the deployed application in a supported browser
2. Look for the "Install" or "Add to Home Screen" option in the browser menu
3. Follow the prompts to install the application

## License

MIT

