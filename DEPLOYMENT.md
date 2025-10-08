# Deployment Guide - Render

This guide will help you deploy your MTG Inventory Manager to Render for **FREE**.

## Prerequisites

- A GitHub account
- A Render account (free - sign up at https://render.com)
- Your code pushed to a GitHub repository

## Step 1: Push to GitHub

If you haven't already, initialize git and push to GitHub:

```bash
cd "/Users/roby2/Documents/PG project"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - MTG Inventory Manager"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended - One-Click)

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click **"Apply"**
6. Wait 5-10 minutes for the build to complete
7. Your app will be live at: `https://YOUR_APP_NAME.onrender.com`

### Option B: Manual Setup

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: mtg-inventory-manager
   - **Environment**: Node
   - **Region**: Oregon (or closest to you)
   - **Branch**: main
   - **Build Command**: `npm run install-all && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add Environment Variable:
   - Key: `NODE_ENV`
   - Value: `production`
6. Click **"Create Web Service"**
7. Wait for deployment (5-10 minutes)

## Step 3: Access Your App

Once deployed, Render will give you a URL like:
```
https://mtg-inventory-manager.onrender.com
```

Visit that URL and your app should be live! 🎉

## Important Notes

### Free Tier Limitations

- **Cold Starts**: Your app will "sleep" after 15 minutes of inactivity
- **Wake Time**: First request after sleeping takes ~30 seconds
- **Solution**: Just wait for it to wake up, or upgrade to paid tier ($7/month for always-on)

### Database Persistence

- Your SQLite database (`backend/mtg.db`) persists between deployments
- Data is stored on Render's disk and will survive app restarts
- **Warning**: Database is deleted if you delete the service

### Automatic Deployments

- Every time you push to your `main` branch, Render will automatically redeploy
- You can disable auto-deploy in Render settings if preferred

## Troubleshooting

### Build Fails

1. Check the build logs in Render dashboard
2. Make sure all dependencies are listed in package.json
3. Verify `npm run install-all && npm run build` works locally

### App Won't Load

1. Check the service logs in Render dashboard
2. Look for error messages
3. Verify the start command is `npm start`
4. Check that NODE_ENV is set to "production"

### Database Issues

1. Make sure the `backend` folder has write permissions
2. Check that `backend/mtg.db` is not in `.gitignore`
3. The database file is created automatically on first run

### API Errors

1. Make sure all API routes are prefixed with `/api`
2. Check that CORS is properly configured in `backend/server.js`
3. Verify the frontend is making requests to relative URLs (not localhost)

## Updating Your App

To deploy changes:

```bash
# Make your changes, then:
git add .
git commit -m "Your update message"
git push origin main
```

Render will automatically detect the push and redeploy!

## Upgrading to Paid

If you want to eliminate cold starts:

1. Go to your service in Render dashboard
2. Click **"Settings"**
3. Under **"Plan"**, select **"Starter"** ($7/month)
4. Your app will now be always-on with no cold starts

## Alternative: Persistent Storage (Optional)

For more robust database storage:

1. In Render dashboard, go to your service
2. Click **"Disks"** in left menu
3. Click **"Add Disk"**
4. Name: `database`
5. Mount Path: `/app/backend`
6. Size: 1 GB (free)
7. Click **"Save"**

This gives you a persistent disk that survives service deletions.

---

Need help? Check Render's documentation at https://render.com/docs or the app's main README.md

