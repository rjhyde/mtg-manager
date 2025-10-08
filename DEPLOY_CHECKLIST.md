# Render Deployment Checklist ✅

Follow these steps to deploy your MTG Inventory Manager to Render:

## □ Step 1: Test Locally (5 min)

Make sure everything works on your machine:

```bash
# Stop any running servers first
# Then test the production build:
npm run install-all
npm run build
NODE_ENV=production npm start
```

Visit `http://localhost:5001` - if it works, you're ready!

## □ Step 2: Push to GitHub (5 min)

```bash
cd "/Users/roby2/Documents/PG project"

# Initialize git (if not done)
git init

# Stage all files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Create repository on GitHub (https://github.com/new), then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## □ Step 3: Deploy to Render (5-10 min)

### Easy Way (Blueprint - Recommended):

1. Go to https://render.com and sign in (create account if needed)
2. Click **"New +"** → **"Blueprint"**
3. Click **"Connect GitHub"** and authorize Render
4. Select your repository
5. Render will detect `render.yaml` automatically
6. Click **"Apply"**
7. Wait 5-10 minutes for build

### Manual Way:

1. Go to https://render.com → **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Settings:
   - Name: `mtg-inventory-manager`
   - Environment: `Node`
   - Build Command: `npm run install-all && npm run build`
   - Start Command: `npm start`
   - Plan: **Free**
4. Add Environment Variable:
   - Key: `NODE_ENV`
   - Value: `production`
5. Click **"Create Web Service"**

## □ Step 4: Test Your Live App

Once deployed (you'll get a URL like `https://mtg-inventory-manager.onrender.com`):

- ✅ Dashboard loads
- ✅ Can search and add cards from Scryfall
- ✅ Cards show up in inventory
- ✅ Can create a deck
- ✅ Can add cards to deck
- ✅ Data persists (refresh page, data still there)

## ⚠️ Important Notes

**Free Tier Cold Starts:**
- App sleeps after 15 min of inactivity
- First visit after sleep: ~30 second load time
- Then works normally

**Your Database:**
- Survives app restarts
- Deleted if you delete the Render service
- Want backups? Download `backend/mtg.db` periodically

**Auto-Deploy:**
- Every `git push` triggers a new deploy
- Takes 5-10 minutes to build and go live

## 🎉 You're Done!

Your MTG Manager is now live and accessible from anywhere!

Share your URL: `https://YOUR-APP-NAME.onrender.com`

---

**Need help?** See [DEPLOYMENT.md](DEPLOYMENT.md) for troubleshooting.

