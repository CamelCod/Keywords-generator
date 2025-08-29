

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1QZrF62WSKGv0SEk8eJD7jDNEPN_CgrN6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploying to GitHub Pages

This repo contains a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys the site on every push to `main`.

### One-time setup

1. Create a GitHub repository and push this project (see commands below).
2. In the repo: Settings → Pages → set Source to "GitHub Actions".
3. (Optional) Add a repository secret `GEMINI_API_KEY` if you want the key available at build time.

### Push local repo to GitHub

Replace `YOUR_GITHUB_USERNAME` and `REPO_NAME`:

```bash
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/REPO_NAME.git
git push -u origin main
```

### Base path handling

For project pages served at `https://<user>.github.io/<repo>/`, assets need the `/repo/` prefix. The workflow sets `VITE_BASE_PATH=/<repo>/` so the built `index.html` references the correct paths. Locally, the base defaults to `/`.

If deploying to a custom domain or a user page root (`<user>.github.io`), you can remove the variable or set `VITE_BASE_PATH=/`.

