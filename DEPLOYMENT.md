# Deployment Guide for React SPA on Vercel

This guide explains how to deploy this React Single Page Application (SPA) to Vercel with proper client-side routing support.

## Problem Solved

The 404 error when refreshing pages like `/teacher/leaderboard` occurs because:
- Vercel serves static files, but React Router uses client-side routing
- When you refresh `/teacher/leaderboard`, Vercel looks for a physical file at that path
- Since it doesn't exist, it returns a 404 error

## Solution

We've added configuration files to redirect all routes to `index.html`, allowing React Router to handle routing.

## Files Added/Modified

### 1. `vercel.json` - Vercel Configuration
```json
{
  "rewrites": [
    {
      "source": "/((?!api/|_next/|_static/|favicon.ico|robots.txt|sitemap.xml).*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. `public/_redirects` - Netlify/Other Hosts Fallback
```
/*    /index.html   200
```

### 3. `public/.htaccess` - Apache Fallback
```
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### 4. `vite.config.ts` - Updated Build Configuration
- Added proper build settings for SPA
- Configured code splitting for better performance
- Added history API fallback for development

## Deployment Steps

### For Vercel:

1. **Connect your repository to Vercel**
2. **Set build command**: `npm run build`
3. **Set output directory**: `dist`
4. **Deploy**: Vercel will automatically use `vercel.json`

### For Other Hosts:

1. **Build the project**: `npm run build`
2. **Upload the `dist` folder** to your hosting provider
3. **Configure your server** to serve `index.html` for all routes

## Testing

After deployment, test these scenarios:

1. **Direct navigation**: Visit `/teacher/leaderboard` directly
2. **Refresh test**: Refresh any page (F5 or Ctrl+R)
3. **Browser back/forward**: Use browser navigation buttons
4. **Deep linking**: Share URLs like `/student/dashboard`

All should work without 404 errors.

## Routes Supported

The configuration supports all your React routes:
- `/` - Login page
- `/teacher/*` - All teacher routes
- `/student/*` - All student routes
- Any other client-side routes

## Security Headers

The `vercel.json` also includes security headers:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

## Performance

- Assets are cached for 1 year
- Code splitting is configured for better loading
- Manual chunks for vendor libraries

## Troubleshooting

If you still get 404 errors:

1. **Check Vercel deployment logs**
2. **Verify `vercel.json` is in the root directory**
3. **Ensure build output includes `index.html`**
4. **Clear browser cache and try again**

## Alternative Solutions

If the above doesn't work, you can also:

1. **Use HashRouter instead of BrowserRouter** (not recommended for SEO)
2. **Implement server-side rendering (SSR)** with Next.js
3. **Use a different hosting provider** with better SPA support

The current solution is the recommended approach for React SPAs on Vercel.
