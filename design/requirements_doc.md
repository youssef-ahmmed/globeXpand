# Expanders360 – Global Expansion Management API

**Author:** Yousef (candidate)

**Purpose:** Translate the take‑home brief into a concrete, implementable design for a NestJS backend powering global expansion projects across MySQL (structured) and MongoDB (unstructured) with matching, analytics, notifications, and scheduling.

---

## 1) Scope & Objectives

### In‑scope

* JWT auth with **roles**: `client`, `admin`.
* Relational data in **MySQL**: clients, projects, vendors, matches (+ support tables for countries/services when needed for performant queries).
* Unstructured documents in **MongoDB** linked to projects (`projectId`).
* Endpoints to **upload/query** research docs (title, content, tags, project linkage).
* **Project‑Vendor matching** endpoint with deterministic scoring & idempotent upsert.
* **Analytics** endpoint that joins MySQL aggregates with Mongo counts.
* **Notifications** (email or mock) on new matches.
* **Scheduling** (cron/queue) to refresh matches daily for active projects & flag SLA issues.
* **Dockerized** environment (NestJS + MySQL + MongoDB), seeds, migrations, `.env.example`, README, and a short demo video.

### Out‑of‑scope (for MVP)

* Complex client billing, payments.
* Fine‑grained RBAC beyond `client`/`admin`.
* Full vendor onboarding workflow; we assume seeded vendors for demo.

### High‑level Success Criteria

* Clean NestJS modularity (DI, providers, guards, pipes, filters).
* Clear schemas & indexed queries (both DBs).
* Deterministic, idempotent matching.
* Cross‑DB analytics working & reasonably fast on demo data.
* Developer‑friendly setup (1‑command docker compose up) and usable API docs (OpenAPI/Swagger).

---

## 2) Functional Requirements

### 2.1 Authentication & Authorization

* **JWT** login issues access tokens; role encoded in claims.
* **Roles**:

    * `client`: can CRUD own projects and upload/query documents for their projects. Can read matches for their projects.
    * `admin`: full CRUD on vendors, system configs; can re/build matches for any project; can view analytics.
* **RBAC Enforcement** via Nest guards:

    * `JwtAuthGuard` + `RolesGuard` + `OwnershipGuard` (ensures the `client` only accesses their own `projectId`).
* Token expiry & refresh (MVP: short‑lived access token; refresh optional).

### 2.2 Projects & Vendors (MySQL)

* **Clients** own **Projects**.
* **Vendors** advertise `countries_supported[]`, `services_offered[]`, numeric `rating` (0–5), `response_sla_hours`.
* **Matches** link Projects↔Vendors with computed `score` and timestamps; unique on `(project_id, vendor_id)`.
* **Services** & **Countries** may be queried frequently; we’ll enable efficient lookup via either JSON indexes (MySQL 8) or normalized bridge tables (see ERD options).

### 2.3 Research Documents (MongoDB)

* Store `title`, `content`, `tags[]`, `projectId`.
* Full‑text search (Mongo text index on `title` + `content` + `tags`).
* Filter by project and/or tag and/or text.

### 2.4 Matching Logic

* Endpoint: `POST /projects/:id/matches/rebuild`.
* **Eligibility**:

    * Vendor supports the project’s `country`.
    * `services_overlap` ≥ 1 between `project.services_needed[]` and `vendor.services_offered[]`.
* **Score** = `services_overlap * 2 + rating + SLA_weight`.

    * `SLA_weight` = `1` if `response_sla_hours ≤ 24`, else `0` (tunable via config table/env).
* **Idempotency**: Upsert into `matches` by `(project_id, vendor_id)`. On subsequent rebuilds, update `score` & `updated_at` without duplicating rows.
* **Notifications**: For newly created matches (not updates), send email to client contact with top N (e.g., 3) vendors by score.

### 2.5 Analytics & Cross‑DB Query

* Endpoint: `GET /analytics/top-vendors`.
* For **each country** with activity in last 30 days:

    1. **MySQL**: Top 3 vendors by **avg match score** of matches created in last 30 days.
    2. **MongoDB**: Count of research documents linked to projects in that country.
* Service layer performs two queries (SQL + Mongo aggregate) and merges results.

### 2.6 Scheduling

* Daily (e.g., `0 3 * * *`):

    * Rebuild matches for projects with `status = 'active'`.
    * **Flag vendors with expired SLAs**: if any open match (optional `matches.status = 'pending'`) is older than `response_sla_hours`, mark `sla_expired = true` on a `vendor_health` table or emit an event/notification.

---

## 3) Non‑Functional Requirements

* **Performance**: Queries on countries/services should be index‑assisted; avoid full scans on demo size; design for growth.
* **Security**: JWT, input validation (class‑validator), RBAC guards, rate limiting (Nest Throttler), CORS configured.
* **Reliability**: Idempotent matching, transactional writes (TypeORM `QueryRunner`) for rebuilds.
* **DX**: Swagger @ `/docs`, seeds, `.env.example`, `docker-compose.yml` for MySQL+Mongo.
* **Observability**: Basic request logging, error filters, health checks at `/health`.

---

## 4) Data Model & ERD

### 4.1 MySQL Schema (proposed)

**clients**

* `id` BIGINT PK
* `company_name` VARCHAR(255) NOT NULL
* `contact_email` VARCHAR(255) NOT NULL UNIQUE
* `created_at` TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

**projects**

* `id` BIGINT PK
* `client_id` BIGINT FK → clients.id (ON DELETE CASCADE)
* `country` CHAR(2) NOT NULL (ISO‑3166‑1 alpha‑2)
* `services_needed` JSON NOT NULL (array of service slugs)
* `budget` DECIMAL(12,2) NULL
* `status` ENUM('active','paused','closed') DEFAULT 'active'
* `created_at` TIMESTAMP DEFAULT CURRENT\_TIMESTAMP
* IDX: `(client_id)`, `(country)`, JSON path index on `services_needed` (see 4.3)

**vendors**

* `id` BIGINT PK
* `name` VARCHAR(255) NOT NULL
* `countries_supported` JSON NOT NULL (array of ISO country codes)
* `services_offered` JSON NOT NULL (array of service slugs)
* `rating` TINYINT UNSIGNED NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5)
* `response_sla_hours` SMALLINT UNSIGNED NOT NULL DEFAULT 48
* `created_at` TIMESTAMP DEFAULT CURRENT\_TIMESTAMP
* IDX: JSON path indexes on `countries_supported`, `services_offered`, plus `(rating)`

**matches**

* `id` BIGINT PK
* `project_id` BIGINT FK → projects.id (ON DELETE CASCADE)
* `vendor_id` BIGINT FK → vendors.id (ON DELETE CASCADE)
* `score` DECIMAL(6,2) NOT NULL
* `created_at` TIMESTAMP DEFAULT CURRENT\_TIMESTAMP
* `updated_at` TIMESTAMP NULL ON UPDATE CURRENT\_TIMESTAMP
* **UNIQUE** `(project_id, vendor_id)` for idempotency
* IDX: `(project_id)`, `(vendor_id)`, `(created_at)`

**(Optional for performance) vendor\_countries**

* `vendor_id` BIGINT FK → vendors.id
* `country` CHAR(2)
* PK `(vendor_id, country)`

**(Optional for performance) vendor\_services**

* `vendor_id` BIGINT FK → vendors.id
* `service` VARCHAR(64)
* PK `(vendor_id, service)`

**(Optional for performance) project\_services**

* `project_id` BIGINT FK → projects.id
* `service` VARCHAR(64)
* PK `(project_id, service)`

> **Note**: We’ll persist arrays as JSON to respect the brief and also (optionally) maintain normalized tables to accelerate lookups (see matching queries).

### 4.2 MongoDB Collections

**research\_documents**

* `_id` ObjectId
* `projectId` (Number) – mirrors MySQL `projects.id`
* `title` (String)
* `content` (String / large text)
* `tags` (\[String])
* `createdAt` (Date)
* Indexes:

    * `{ projectId: 1, createdAt: -1 }`
    * `text` index on `title`, `content`, `tags`

### 4.3 Indexing Strategy (MySQL JSON)

* MySQL 8 supports **functional indexes** on JSON paths, e.g.:

    * `CREATE INDEX idx_vendor_countries ON vendors((JSON_CONTAINS_PATH(countries_supported, 'one', '$[*]')));` (or use normalized tables for clearer SARGable queries).
* In practice, **bridge tables** (`vendor_countries`, `vendor_services`, `project_services`) provide simpler and faster matching SQL. Both designs shown; implementation will likely use bridge tables while keeping JSON for API payload parity.

### 4.4 ERD (conceptual)

```
clients 1───* projects 1───* matches *───1 vendors
                       │                         
                       *─── research_documents (Mongo, via projectId)

vendors 1───* vendor_countries
vendors 1───* vendor_services
projects 1───* project_services
```

---

## 5) API Design

### Conventions

* **Base URL:** `/api/v1`
* **Auth:** Bearer JWT
* **Content:** `application/json`
* **Pagination:** `?page=1&limit=20` (max 100), returns `{ data, meta: { page, limit, total } }`
* **Errors:** RFC7807‑ish `{ statusCode, message, error }`

### 5.1 Auth

* `POST /auth/login`

    * Body: `{ email, password }`
    * Response: `{ accessToken, user: { id, role, clientId? } }`

### 5.2 Clients (admin‑only except self‑read)

* `GET /clients` (admin)
* `POST /clients` (admin)
* `GET /clients/:id` (admin or owner via token)
* `PATCH /clients/:id` (admin)
* `DELETE /clients/:id` (admin)

### 5.3 Projects

* `GET /projects` (admin → all; client → own)

    * Filters: `country`, `status`, `service`, `q` (name/desc if added)
* `POST /projects` (client/admin)

    * Body: `{ clientId?, country, servicesNeeded: string[], budget?, status? }` (client role: `clientId` ignored; inferred from token)
* `GET /projects/:id` (owner/admin)
* `PATCH /projects/:id` (owner/admin)
* `DELETE /projects/:id` (owner/admin)
* `POST /projects/:id/matches/rebuild` (owner/admin)

    * Response: `{ created: number, updated: number, topMatches: [ { vendorId, score } ] }`
* `GET /projects/:id/matches` (owner/admin)

    * Query: `?minScore=&limit=`

### 5.4 Vendors (admin)

* `GET /vendors` (filters: `country`, `service`, `minRating`)
* `POST /vendors`

    * Body: `{ name, countriesSupported: string[], servicesOffered: string[], rating, responseSlaHours }`
* `GET /vendors/:id`
* `PATCH /vendors/:id`
* `DELETE /vendors/:id`

### 5.5 Matches (read‑only outside rebuild)

* `GET /matches` (admin; filters: `projectId`, `vendorId`, `country`, `from`, `to`)

### 5.6 Research Documents (MongoDB)

* `POST /documents` (owner/admin)

    * Body: `{ projectId, title, content, tags?: string[] }`
* `GET /documents` (owner/admin)

    * Query: `projectId?`, `tag?`, `q?` (text search), pagination
* `GET /documents/:id` (owner/admin)
* `DELETE /documents/:id` (owner/admin)

### 5.7 Analytics

* `GET /analytics/top-vendors` (admin)

    * Response shape (example):

  ```json
  [
    {
      "country": "AE",
      "topVendors": [
        { "vendorId": 12, "name": "Acme", "avgScore": 8.7 },
        { "vendorId": 7,  "name": "Globex", "avgScore": 8.1 },
        { "vendorId": 3,  "name": "Initech", "avgScore": 7.9 }
      ],
      "docsCount": 42
    }
  ]
  ```

### 5.8 Health & Misc

* `GET /health` – DB connectivity (MySQL + Mongo) and app info.
* `POST /admin/test-email` (admin) – send a test notification (mock SMTP in dev).

---

## 6) Matching: Query & Upsert Details

### 6.1 Services Overlap (bridge tables approach)

```sql
-- Eligible vendors per project P
SELECT v.id AS vendor_id,
       COUNT(DISTINCT vs.service) AS services_overlap,
       v.rating,
       v.response_sla_hours
FROM vendors v
JOIN vendor_countries vc ON vc.vendor_id = v.id AND vc.country = :project_country
JOIN vendor_services  vs ON vs.vendor_id = v.id
JOIN project_services ps ON ps.project_id = :project_id AND ps.service = vs.service
GROUP BY v.id;
```

### 6.2 Score Computation

`score = services_overlap * 2 + rating + (CASE WHEN response_sla_hours <= 24 THEN 1 ELSE 0 END)`

### 6.3 Idempotent Upsert

```sql
INSERT INTO matches (project_id, vendor_id, score)
VALUES (:project_id, :vendor_id, :score)
ON DUPLICATE KEY UPDATE score = VALUES(score), updated_at = CURRENT_TIMESTAMP;
```

### 6.4 Transactional Rebuild

* Wrap rebuild in a transaction; compute candidates into a temp table or memory, then bulk upsert.
* Identify **newly created** rows vs updates to trigger notifications (e.g., check `ROW_COUNT()` or preselect existing IDs).

---

## 7) Analytics: Cross‑DB Strategy

1. **MySQL** – last 30 days window:

```sql
WITH recent AS (
  SELECT m.*, p.country
  FROM matches m
  JOIN projects p ON p.id = m.project_id
  WHERE m.created_at >= NOW() - INTERVAL 30 DAY
)
SELECT country,
       vendor_id,
       AVG(score) AS avg_score
FROM recent
GROUP BY country, vendor_id;
```

App layer then takes top 3 per country (or do ROW\_NUMBER() in SQL 8.0+).

2. **MongoDB** – count research docs per country:

* First get project IDs per country from MySQL.
* Then run Mongo aggregate:

```js
[{ $match: { projectId: { $in: [/* ids for AE */] } }},
 { $count: "docsCount" }]
```

* Repeat per country or perform a single `$match` on many IDs and `$group` by `projectId` then map to country via app cache.

3. **Merge** – Join MySQL top vendors with Mongo counts by country in the service layer and return a single response.

---

## 8) Notifications & SLA Flagging

* **On new match creation**: send email to the project’s client contact with top N matches (configurable). Use **mock SMTP** (e.g., `maildev`) in dev docker; switchable via env.
* **SLA flagging rule (simple)**: If there exists any match for a vendor where `created_at + INTERVAL response_sla_hours HOUR < NOW()` and (optionally) `status = 'pending'`, mark vendor as SLA‑expired (store in `vendor_health` or emit notification).

**vendor\_health** (optional)

* `vendor_id` PK → vendors.id
* `sla_expired` BOOLEAN
* `last_checked_at` TIMESTAMP

---

## 9) NestJS Architecture

```
src/
  app.module.ts
  common/
    guards/ (JwtAuthGuard, RolesGuard, OwnershipGuard)
    decorators/ (Roles, CurrentUser)
    interceptors/ (Logging, Transform)
    pipes/ (ValidationPipe)
    filters/ (HttpExceptionFilter)
    utils/
  config/ (config module, schema)
  auth/ (AuthModule, JwtStrategy, LocalStrategy, AuthController)
  users/ (if needed for admin auth) or clients/
  clients/ (controller, service, repo/entity)
  projects/ (controller, service, entities, seeds)
  vendors/ (controller, service, entities, seeds)
  matches/ (controller, service)
  documents/ (Mongo schemas, controller, service)
  analytics/ (controller, service)
  notifications/ (mailer module/service)
  scheduling/ (cron tasks; optional BullMQ queues)
  database/
    mysql/ (TypeORM config, migrations, seeds)
    mongo/ (Mongoose module, seed script)
```

* **ORMs**: TypeORM (MySQL), Mongoose (MongoDB).
* **Docs**: Swagger via `@nestjs/swagger`.
* **Validation**: `class-validator` DTOs.
* **Caching (bonus)**: Nest cache module + Redis (if allowed) to cache analytics 15m.

---

## 10) Migrations & Seeds

* **TypeORM migrations** to create tables & indexes, incl. unique `(project_id, vendor_id)`.
* **Seeds**: a few clients, 10–20 vendors across countries/services, 10–15 projects.
* **Mongo seed**: 50–100 research docs spread across projects, with tags and variety.

---

## 11) Environment & Deployment

* `.env.example`:

    * `PORT=3000`
    * `JWT_SECRET=change_me`
    * `MYSQL_HOST=mysql`
    * `MYSQL_PORT=3306`
    * `MYSQL_DB=expanders`
    * `MYSQL_USER=root`
    * `MYSQL_PASSWORD=pass`
    * `MONGO_URI=mongodb://mongo:27017/expanders`
    * `MAIL_HOST=maildev`
    * `MAIL_PORT=1025`
    * `SLA_WEIGHT_THRESHOLD_HOURS=24`
    * `CRON_REFRESH=0 3 * * *`
* **docker-compose** services: `api`, `mysql`, `mongo`, `maildev`.
* **Deployment**: container to Render/Railway; managed MySQL+Mongo or dockerized if supported.

---

## 12) Security Considerations

* Strong JWT secret; rotate in prod.
* Hash passwords (if implementing users) with bcrypt; never store raw.
* Input validation everywhere; sanitize document text.
* Rate limit login, auth endpoints.
* CORS restricted to the demo UI origin.
* Principle of least privilege DB users; separate read/write if desired.

---

## 13) Testing Plan

* **Unit tests** for services (matching, analytics merging, guards).
* **E2E tests** hitting in‑memory or test containers.
* Seeded snapshots for deterministic scoring.

---

## 14) Next Steps

1. Finalize ERD (choose JSON‑only vs bridge tables; I’ll implement **bridge tables + JSON** for ergonomic payloads and fast queries).
2. Scaffold Nest modules, DTOs, guards, and Swagger skeleton.
3. Implement MySQL migrations & seeders; Mongo schema & seed script.
4. Implement matching service with transactional upsert & email notify.
5. Implement analytics aggregation & caching.
6. Add cron job; SLA flagging & reporting endpoint (optional).
7. Write README and record demo video.
