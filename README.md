# Notiva: Smart Note-Taking Web Application

Notiva is a full-stack note-taking web application built for an internship project. It helps students create, organize, search, revise, export, and manage notes using a clean dashboard.

## Project Overview

The application is designed for students who need a structured workspace for lecture notes, revision plans, assignments, and subject-wise organization. Notes can be grouped by subject, notebook, folder path, and tags.

## Technology Stack

- Frontend: React, Vite, CSS
- Backend: Django, Django REST Framework
- Authentication: JWT using Simple JWT
- Database: SQLite
- API Client: Axios

## Implemented Modules

- User registration and login
- Dashboard
- Create and edit notes
- Subject, notebook, and folder organization
- Search and filter
- Tags and labels
- Pin and star notes
- Checklist items
- Reminder date and time
- Attachment metadata
- Trash, restore, and permanent delete
- Export notes as text files
- Share link API
- Dark mode and preferences
- Settings page

## Folder Structure

```text
NoteTakingApp/
  backend/
    config/
    notes/
    db.sqlite3
    manage.py
  frontend/
    src/
    public/
    package.json
```

## Backend Setup

```bash
cd backend
venv\Scripts\python.exe manage.py migrate
venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

Open:

```text
http://127.0.0.1:5174
```

## API Endpoints

- `POST /api/register/`
- `POST /api/token/`
- `GET /api/notes/`
- `POST /api/notes/`
- `PUT /api/notes/<id>/`
- `DELETE /api/notes/<id>/`
- `POST /api/notes/<id>/restore/`
- `DELETE /api/notes/<id>/permanent-delete/`
- `GET /api/filter/`
- `GET /api/preferences/`
- `PUT /api/preferences/`
- `GET /api/shared/<token>/`

## Verification

The project was checked with:

```bash
cd backend
venv\Scripts\python.exe manage.py check
venv\Scripts\python.exe manage.py test

cd frontend
npm run lint
npm run build
```

## Future Enhancements

- Real file uploads for attachments
- PDF export
- Email or browser notifications for reminders
- Collaborative editing
- Rich text editor toolbar
- Cloud database deployment

