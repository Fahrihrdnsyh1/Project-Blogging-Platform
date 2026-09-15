# Blogging Platform

Fullstack blogging platform built with Next.js, Express.js, MySQL 8, JWT, bcrypt, and Docker Compose.

## Requirements

- Docker Desktop with Docker Compose
- Node.js 20 or newer (only needed for running commands outside Docker)
- Git

## Project Structure

```text
.
|-- backend/          Express API
|-- frontend/         Next.js App Router frontend
|-- docker-compose.yml
|-- init.sql
|-- PRD.md
`-- README.md
```

## Clone the Repository

```powershell
git clone git@github.com:Fahrihrdnsyh1/Project-Blogging-Platform.git
cd Project-Blogging-Platform
```

HTTPS remote can also be used:

```powershell
git clone https://github.com/Fahrihrdnsyh1/Project-Blogging-Platform.git
```

## Environment Setup

Copy the example files before starting the services.

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Review the values if your local ports or credentials are different. The default Docker setup uses:

- MySQL: `localhost:3306`
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- Database: `blog_platform`
- Database user: `root`
- Database password: `changeme`

The real `.env` files are ignored by Git. Never commit them or put production secrets in this README.

## Run with Docker Compose

Start all services and rebuild images when source or dependencies changed:

```powershell
docker compose up -d --build
```

Check service status:

```powershell
docker compose ps
```

Open the application:

- Frontend: http://localhost:3000
- Backend health check: http://localhost:5000/health

View logs:

```powershell
docker compose logs -f backend_api
docker compose logs -f frontend_web
docker compose logs -f mysql_db
```

Stop the services without deleting database data:

```powershell
docker compose down
```

To reset the local database volume and run `init.sql` again, use this only when you intentionally want to delete local data:

```powershell
docker compose down -v
docker compose up -d --build
```

## Seed Dummy Data

The seed creates or updates development users, categories, tags, and published posts. It is idempotent for the records identified by the fixed seed emails and slugs.

### Run seed inside Docker

This is the simplest option when the services are running:

```powershell
docker compose exec backend_api npm run seed
```

### Run seed from the host

Run from the `backend` directory and override the database host because `mysql_db` is the Docker service name and is not normally resolvable from Windows:

```powershell
cd backend
$env:DB_HOST = "localhost"
npm install
npm run seed
```

The seed accounts are for local development only:

| Role   | Email                   | Password   |
| ------ | ----------------------- | ---------- |
| admin  | admin.seed@example.com  | Admin123!  |
| author | author.seed@example.com | Author123! |
| reader | reader.seed@example.com | Reader123! |

Change or remove these development credentials before using the project outside a local environment.

## Backend Integration Tests

The backend integration tests use Jest and Supertest against a separate MySQL database named `blog_platform_test`. They do not use the development database `blog_platform`.

Create the test environment file from its example:

```powershell
cd backend
Copy-Item .env.test.example .env.test
```

The test configuration defaults to MySQL on `localhost:3306` and uses the `blog_platform_test` database. Before running tests, make sure the MySQL container is running:

```powershell
docker compose up -d mysql_db
```

Run the integration tests:

```powershell
cd backend
npm install
npm test
```

Jest creates the test database if needed and recreates its tables at the start of each test run. The test setup only drops tables inside `blog_platform_test`; it never resets `blog_platform`.

The current test coverage includes:

- successful registration
- duplicate registration email
- successful login
- incorrect login password
- published post list response
- unauthorized post creation without a token

## Run Backend and Frontend Without Docker

Start MySQL separately first, then configure `backend/.env` with a reachable database host, usually `localhost`.

Backend:

```powershell
cd backend
npm install
npm run dev
```

Frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

For a production build of the frontend:

```powershell
cd frontend
npm run build
npm run start
```

## Main Routes

- `/` - published article list
- `/blog/[slug]` - article detail and nested comments
- `/login` - login
- `/register` - registration
- `/dashboard` - authenticated user's articles
- `/dashboard/editor` - create and edit articles

## Useful Git Workflow

```powershell
git pull origin main
git status
git add .
git commit -m "Describe the change"
git push origin main
```

Before committing, verify that `.env`, `node_modules`, `.next`, uploads, and database volumes are not staged.

## Troubleshooting

If a port is already in use, stop the process using that port or change the port mapping in `docker-compose.yml` and the matching frontend/backend environment values.

If MySQL does not start, inspect its logs:

```powershell
docker compose logs --tail=100 mysql_db
```

`init.sql` runs automatically only when the MySQL data volume is initialized for the first time. Use `docker compose down -v` to recreate the local database from scratch.
