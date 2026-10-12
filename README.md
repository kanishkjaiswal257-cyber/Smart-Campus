# Smart Campus

Smart Campus is organized as a React/Vite client and a Node.js API server.

## Client

```powershell
cd client
npm install
npm run dev
```

Set `VITE_API_URL` in `client/.env` to the API base URL.

## Server

```powershell
cd server
npm install
npm run dev
```

Configure the database, JWT, email, and Cloudinary values in `server/.env`
before connecting those services.

The page, component, and server feature modules are scaffold placeholders ready
for implementation.
