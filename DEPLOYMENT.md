# Carbon--Craft Deployment Guide

This branch (`github-site-deploy`) is set up for deployment:

## Backend Deployment (Render)

1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service from `render.yaml`
4. Add environment variables:
   - `AI_INTEGRATIONS_OPENAI_API_KEY`: Your OpenAI API key
   - `AI_INTEGRATIONS_OPENAI_BASE_URL`: https://api.openai.com/v1

Your backend will be available at: `https://<your-service-name>.onrender.com`

## Frontend Deployment (GitHub Pages)

The `.github/workflows/deploy-frontend.yml` workflow automatically deploys the `static` folder to GitHub Pages when you push to this branch.

1. Enable GitHub Pages in Settings → Pages
2. Select "Deploy from a branch"
3. Choose `gh-pages` branch (created by the workflow)

Your frontend will be available at: `https://<username>.github.io/<repo-name>`

## Update API Endpoint

After deploying the backend, update `static/app.js` to use your Render backend URL instead of localhost.

## Merging Back to Main

Once everything is working:
```bash
git checkout main
git merge github-site-deploy
git push origin main
```
