const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with updated CSP configuration for APIs
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for development to avoid API issues
}));

// Enable CORS with specific configuration
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST'], // Allow these methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
}));

// Compress all responses
app.use(compression());

// Environment variables for frontend
const ENV_VARS = {
  ORS_API_KEY: process.env.ORS_API_KEY || '',
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || '',
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || ''
};

// Middleware to inject environment variables into HTML
app.use((req, res, next) => {
  // Only intercept HTML requests
  if (req.path.endsWith('.html') || req.path === '/' || req.path === '') {
    const filePath = path.join(__dirname, 'public', req.path === '/' || req.path === '' ? 'index.html' : req.path);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return next(); // Continue to static file serving if file not found
      }
      
      // Replace placeholders with actual values
      let modifiedHtml = data;
      Object.keys(ENV_VARS).forEach(key => {
        modifiedHtml = modifiedHtml.replace(
          new RegExp(`%%${key}%%`, 'g'), 
          ENV_VARS[key]
        );
      });
      
      res.send(modifiedHtml);
    });
  } else {
    next();
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for all other routes for SPA capability
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
  
  // Log environment status
  console.log('\nEnvironment variables:');
  console.log(`- ORS_API_KEY: ${ENV_VARS.ORS_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`- MAPBOX_ACCESS_TOKEN: ${ENV_VARS.MAPBOX_ACCESS_TOKEN ? '✅ Set' : '❌ Not set'}`);
  console.log(`- UNSPLASH_ACCESS_KEY: ${ENV_VARS.UNSPLASH_ACCESS_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`- GROQ_API_KEY: ${ENV_VARS.GROQ_API_KEY ? '✅ Set' : '❌ Not set'}`);
}); 