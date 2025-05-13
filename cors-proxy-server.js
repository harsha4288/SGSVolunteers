// cors-proxy-server.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3005;

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'X-Client-Info'],
}));

// Extract Supabase URL from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not defined in .env.local');
  process.exit(1);
}

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Create proxy middleware
const supabaseProxy = createProxyMiddleware({
  target: supabaseUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/supabase': '', // Remove the '/supabase' prefix when forwarding
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add any necessary headers
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    // Add apikey header if present
    if (req.headers.apikey) {
      proxyReq.setHeader('apikey', req.headers.apikey);
    }
    
    // Log proxy request
    console.log(`Proxying to: ${supabaseUrl}${req.url.replace(/^\/supabase/, '')}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// Apply the proxy middleware to all routes starting with /supabase
app.use('/supabase', supabaseProxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'CORS proxy server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`CORS proxy server running at http://localhost:${PORT}`);
  console.log(`Proxying requests from http://localhost:${PORT}/supabase to ${supabaseUrl}`);
  console.log('Use this proxy by updating your Supabase client configuration.');
});
