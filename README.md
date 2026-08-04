# URL Shortener

A URL shortener with a Spring Boot API, PostgreSQL persistence, and a decoupled
React/Vite frontend styled with the GOV.UK Design System.

## Features

- Create short URLs with generated aliases or custom aliases.
- Reuse an existing generated short URL for repeated destinations.
- Redirect short URLs to their original destination.
- List saved URLs newest first, copy short URLs, and delete mappings with confirmation.
- Persist mappings in PostgreSQL using Flyway migrations.
- Validate URLs and aliases with consistent API errors.
- Provide responsive, accessible GOV.UK-styled user interfaces.
- Cover frontend behavior with coverage-enforced tests and backend behavior with unit and
  PostgreSQL-backed integration tests.
- Run the complete stack with Docker Compose.

## Architecture

| Component | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, GOV.UK Design System |
| Backend | Java 21, Spring Boot, Spring Data JPA |
| Database | PostgreSQL, Flyway |
| Container runtime | Docker Compose |
| Production frontend proxy | Nginx |

The Vite development server proxies `/api` calls to the local backend. In
Docker, Nginx serves the frontend and proxies API and short-link requests to
the backend, so browser CORS configuration is not required.

### Request flow

```
Browser → Nginx → React static assets
        → Spring Boot API → PostgreSQL
        → short alias redirect → Spring Boot
```

## Project structure

```text
.
├── backend/              Spring Boot API and Flyway migrations
├── frontend/             React/Vite web application
├── docker-compose.yml    Full-stack local container setup
└── openapi.yaml          API contract
```

## Run with Docker

Prerequisite: Docker Desktop.

```bash
docker compose up --build
```

| Service | Address |
| --- | --- |
| Web application | <http://localhost:8080> |
| Backend API | <http://localhost:8081> |
| PostgreSQL | `localhost:5432` |

Stop the stack:

```bash
docker compose down
```

## Run locally

Prerequisites:

- Java 21
- Maven
- Node.js 22 or later
- Docker Desktop, for PostgreSQL

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Start the backend:

```bash
cd backend
mvn spring-boot:run
```

Start the frontend in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:5173>. The Vite development server forwards `/api`
requests to the backend at <http://localhost:8080>.

## Using the application

1. Open the web application.
2. Enter a full URL or hostname, such as `google.com`.
3. Optionally provide a custom alias.
4. Select **Shorten URL** to create a link.
5. Use the table to open or delete saved short URLs.

Opening a generated short URL redirects to its stored destination.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/url_shortener` | PostgreSQL JDBC URL |
| `DATABASE_USERNAME` | `url_shortener` | PostgreSQL username |
| `DATABASE_PASSWORD` | `url_shortener` | PostgreSQL password |
| `SHORT_URL_BASE_URL` | `http://localhost:8080` | Public base URL used when returning short URLs |

## Validation and assumptions

- URLs without a scheme are normalized to `https://`; for example,
  `google.com` becomes `https://google.com`.
- Only valid public HTTP and HTTPS URLs are accepted.
- Custom aliases must be 3–50 characters long and contain only letters,
  numbers, hyphens (-), or underscores (_).
- Repeating a URL without a custom alias returns its earliest generated
  mapping. A supplied custom alias always creates a separate mapping unless
  that alias is already taken.
- Alias conflicts return `400 Bad Request`, matching the supplied API
  contract.
- Missing aliases return `404 Not Found`.
- The API contract is defined in [`openapi.yaml`](./openapi.yaml).

## Validation commands

Backend:

```bash
cd backend
mvn test
mvn spotless:check
```

`mvn test` runs PostgreSQL Testcontainers integration tests, so Docker Desktop
must be running.

Frontend:

```bash
cd frontend
npm run test:coverage
npm run build
npm run lint
```

## Continuous integration

GitHub Actions runs independent backend and frontend jobs in parallel on every
push and pull request. The backend job checks formatting, runs unit and
PostgreSQL-backed integration tests, builds the JAR, and builds its Docker
image. The frontend job lints, runs coverage-enforced tests, builds the
application, and builds its Docker image.

## Future improvements

- Add pagination for large URL lists.
- Add authentication and ownership of URL mappings.
- Add rate limiting and request monitoring.
