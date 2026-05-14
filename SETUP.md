# Quartz QA Tracker — Setup Guide

## Overview

- **Testers** visit `https://flaxandteal.github.io/quartz-tests/`, fill in tests, and submit.
- Results are written to the Quartz QA Google Sheet, one tab per project.
- **Admin view** reads from the sheet and shows bugs, coverage, and tester summaries.

---

## Step 1 — Google Apps Script

1. Open the Google Sheet:
   `https://docs.google.com/spreadsheets/d/1sbGYEYfJNBn2M0LbTcHYEZnR5-ahRNXr65SxppM-FqY`

2. Go to **Extensions → Apps Script**.

3. Delete any existing code in `Code.gs` and paste in the entire contents of `apps-script/Code.gs` from this repo.

4. Click **Save** (Ctrl+S).

5. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Description: `Quartz QA`
   - Execute as: **Me**
   - Who has access: **Anyone**

6. Click **Deploy**. Authorise the app when prompted (it needs access to your Sheet).

7. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/XXXXX/exec`

---

## Step 2 — GitHub Secrets

Go to `https://github.com/flaxandteal/quartz-tests/settings/secrets/actions` and add two secrets:

| Secret name | Value |
|---|---|
| `VITE_APPS_SCRIPT_URL` | The URL from Step 1 |
| `VITE_ADMIN_CODE` | A password of your choice for the admin view |

---

## Step 3 — Enable GitHub Pages

1. Go to `https://github.com/flaxandteal/quartz-tests/settings/pages`.
2. Under **Source**, select **GitHub Actions**.
3. Save.

---

## Step 4 — Push the code

```bash
git clone https://github.com/flaxandteal/quartz-tests.git
# copy these files in
cd quartz-tests
git add .
git commit -m "Initial deploy"
git push origin main
```

The Actions workflow will run automatically and deploy to:
`https://flaxandteal.github.io/quartz-tests/`

---

## Adding a new project / feature set

1. Open `src/projects.js`.
2. Add a new object to the `PROJECTS` array — copy the existing one as a template.
   - Set a unique `id`
   - Set `sheetTab` to whatever you want the Google Sheet tab to be called
   - Add your `prerequisites` and `tests`
3. Commit and push — the site redeploys automatically.

---

## Admin view

Visit the site and click **Admin** on the name screen. Enter the admin code you set in `VITE_ADMIN_CODE`.

The admin view reads live from Google Sheets, so it always shows the latest submissions. Hit **Refresh** to pull new results while the page is open.

---

## Local development

```bash
npm install
```

Create a `.env.local` file:
```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXX/exec
VITE_ADMIN_CODE=yourpassword
```

```bash
npm run dev
```
