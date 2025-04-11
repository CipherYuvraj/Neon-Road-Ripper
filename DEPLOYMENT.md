# Deployment Guide for Smart Road Trip Planner

This guide provides step-by-step instructions for deploying the Smart Road Trip Planner application to various hosting platforms.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
  - [Vercel Deployment](#vercel-deployment)
  - [Heroku Deployment](#heroku-deployment)
  - [Netlify Deployment](#netlify-deployment)
  - [DigitalOcean App Platform](#digitalocean-app-platform)
  - [Manual VPS Deployment](#manual-vps-deployment)

## Prerequisites

Before deploying, ensure you have:

1. Node.js (v18 or newer) installed
2. npm or yarn package manager
3. All required API keys:
   - OpenRouteService API key
   - Mapbox Access Token
   - Unsplash Access Key
   - Groq API Key (optional, for AI features)

## Environment Variables

This application uses the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | The port on which the server will run | No (defaults to 3000) |
| ORS_API_KEY | Your OpenRouteService API key | Yes |
| MAPBOX_ACCESS_TOKEN | Your Mapbox access token | Yes |
| UNSPLASH_ACCESS_KEY | Your Unsplash access key | Yes |
| GROQ_API_KEY | Your Groq API key for AI features | No |

You'll need to set these environment variables on your deployment platform.

## Deployment Options

### Vercel Deployment

Vercel is recommended for its simplicity and free tier:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the project root directory:
   ```bash
   vercel
   ```

4. Follow the prompts and select the default options.

5. Set environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Environment Variables" section
   - Add all required environment variables

6. For subsequent deployments, use:
   ```bash
   vercel --prod
   ```

### Heroku Deployment

1. Install the Heroku CLI:
   ```bash
   npm install -g heroku
   ```

2. Login to Heroku:
   ```bash
   heroku login
   ```

3. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```

4. Set environment variables:
   ```bash
   heroku config:set ORS_API_KEY=your_key
   heroku config:set MAPBOX_ACCESS_TOKEN=your_token
   heroku config:set UNSPLASH_ACCESS_KEY=your_key
   heroku config:set GROQ_API_KEY=your_key
   ```

5. Deploy your app:
   ```bash
   git push heroku main
   ```

6. Open your app:
   ```bash
   heroku open
   ```

### Netlify Deployment

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize a new Netlify site:
   ```bash
   netlify init
   ```

4. Deploy your site:
   ```bash
   netlify deploy --prod
   ```

5. Set environment variables in the Netlify dashboard:
   - Go to Site settings > Build & deploy > Environment
   - Add all required environment variables

### DigitalOcean App Platform

1. Create a new App on DigitalOcean App Platform
2. Connect your GitHub/GitLab repository
3. Configure as a Web Service with Node.js
4. Add environment variables in the "Environment Variables" section
5. Deploy your app

### Manual VPS Deployment

For deployment on a Virtual Private Server:

1. SSH into your server
2. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/smart-road-trip-planner.git
   cd smart-road-trip-planner
   ```

3. Install dependencies:
   ```bash
   npm install --production
   ```

4. Create a `.env` file with your environment variables:
   ```bash
   cp .env.example .env
   nano .env  # Edit with your actual values
   ```

5. Start the application with PM2 (install with `npm install -g pm2` if needed):
   ```bash
   pm2 start server.js --name "road-trip-planner"
   pm2 save
   pm2 startup
   ```

6. Configure Nginx as a reverse proxy (optional but recommended):
   ```bash
   sudo nano /etc/nginx/sites-available/road-trip-planner
   ```

   Add the following configuration:
   ```
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/road-trip-planner /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. Set up SSL with Certbot (recommended):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## Troubleshooting Deployment Issues

### API Key Issues
- If you see warnings about missing API keys, check that all environment variables are correctly set.
- Verify API key permissions and usage limits in the respective dashboards.

### CORS Issues
- If you encounter CORS errors, check that the API providers allow requests from your deployment domain.
- You may need to register your domain in the API provider's dashboard.

### Memory Issues
- If your application crashes with memory errors, consider upgrading your hosting plan or optimizing your application.

### Performance Optimization
- Enable Gzip compression if your hosting provider doesn't automatically do this.
- Consider using a CDN for static assets.
- Implement caching strategies for API responses.

## Post-Deployment Steps

After successful deployment:

1. Set up a custom domain if available on your platform.
2. Configure SSL/HTTPS if not automatically provided.
3. Test all functionality to ensure everything works properly.
4. Set up monitoring and analytics to track usage. 