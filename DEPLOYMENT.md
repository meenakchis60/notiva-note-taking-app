# Notiva Deployment

## 1. Deploy the Django backend on Render

Use the root `render.yaml` blueprint in this repository.

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint**.
3. Select this repository.
4. Render will create:
   - `notiva-backend`
   - `notiva-db`
5. Set the `FRONTEND_URL` environment variable on `notiva-backend` to your GitHub Pages URL, for example:

```text
https://your-github-username.github.io
```

Render runs:

```bash
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
gunicorn config.wsgi:application
```

Your API URL will look like:

```text
https://notiva-backend.onrender.com/api
```

## 2. Point the React frontend at Render

Set this Vite variable before building/deploying GitHub Pages:

```env
VITE_API_URL=https://notiva-backend.onrender.com/api
```

If Render gives your backend a different URL, use that URL instead.

## 3. Rebuild and redeploy the frontend

From `frontend`:

```bash
npm install
npm run build
```

After GitHub Pages is rebuilt with `VITE_API_URL`, registration and login will call the deployed Django API instead of `127.0.0.1`.
