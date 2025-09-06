# Expanders360 - Complete API Design

## Base URL

```
https://api.expanders360.com/api/v1
```

## Authentication

All protected endpoints require JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

**JWT Token Structure:**
```json
{
  "sub": 123,
  "email": "client@example.com",
  "role": "client",
  "clientId": 456,
  "iat": 1640995200,
  "exp": 1641081600
}
```

---

## 1. Authentication Routes

### 1.1 Client Login

**`POST /auth/login`**

**Request Body:**

```json
{
  "email": "founder@techstart.com",
  "password": "SecurePass123!"
}
```

**Response:**

- `200 OK`: Login successful

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "client": {
    "id": 123,
    "companyName": "TechStart Inc",
    "email": "founder@techstart.com",
    "role": "client",
    "clientId": 456
  }
}
```

- `400 Bad Request`: Missing required fields

```json
{
  "statusCode": 400,
  "message": ["Email is required", "Password is required"],
  "error": "Bad Request"
}
```

- `401 Unauthorized`: Invalid credentials

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

### 1.2 Client Signup

**`POST /auth/register`**

Registers a new client into the system.

**Request Body:**

```json
{
  "companyName": "TechStart Inc",
  "email": "founder@techstart.com",
  "password": "SecurePass123!"
}
```

**Response:**

* `201 Created`: Signup successful

```json
{
  "id": 123,
  "companyName": "TechStart Inc",
  "email": "founder@techstart.com",
  "role": "client"
}
```

* `400 Bad Request`: Missing or invalid fields

```json
{
  "statusCode": 400,
  "message": ["CompanyName must not be empty", "Password too weak"],
  "error": "Bad Request"
}
```

* `409 Conflict`: Email already exists

```json
{
  "statusCode": 409,
  "message": "Email is already registered",
  "error": "Conflict"
}
```

### 1.3 Change Password

**`PATCH /auth/change-password`**

Allows a logged-in client to change their password. Requires valid JWT in `Authorization` header.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "oldPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response:**

* `200 OK`: Password updated successfully

```json
{
  "message": "Password changed successfully"
}
```

* `400 Bad Request`: Validation errors

```json
{
  "statusCode": 400,
  "message": ["New password must be at least 8 characters"],
  "error": "Bad Request"
}
```

* `401 Unauthorized`: Invalid old password or missing JWT

```json
{
  "statusCode": 401,
  "message": "Invalid current password",
  "error": "Unauthorized"
}
```

### 1.4 Token Refresh

**`POST /auth/refresh`**

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

- `200 OK`: New token issued
- `401 Unauthorized`: Invalid or expired refresh token

---

## 2. Client Management Routes

### 2.1 Get All Clients

**`GET /clients`** *(Admin Only)*

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by company name or email
- `role` (optional): Filter by role (admin, client)

**Response:**

- `200 OK`:

```json
{
  "data": [
    {
      "id": 123,
      "companyName": "TechStart Inc",
      "contactEmail": "founder@techstart.com",
      "role": "client",
      "createdAt": "2025-06-26T10:30:00Z",
      "updatedAt": "2025-06-26T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

### 2.2 Get Client by ID

**`GET /clients/:id`** *(Protected)*

**Response:**

- `200 OK`: Client details
- `403 Forbidden`: Access denied
- `404 Not Found`: Client not found

### 2.3 Update Client

**`PATCH /clients/:id`** *(Protected)*

**Request Body:**

```json
{
  "companyName": "GlobalCorp Limited",
  "contactEmail": "new-admin@globalcorp.com"
}
```

**Response:**

- `200 OK`: Client updated successfully
- `400 Bad Request`: Invalid data
- `403 Forbidden`: Access denied
- `404 Not Found`: Client not found
- `409 Conflict`: Email already exists

### 2.4 Delete Client

**`DELETE /clients/:id`** *(Protected)*

**Response:**

- `204 No Content`: Client deleted successfully
- `403 Forbidden`: Admin access required
- `404 Not Found`: Client not found

---

## 3. Project Management Routes

### 3.1 Get All Projects

**`GET /projects`** *(Protected)*

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `country` (optional): Filter by country code (e.g., "DE", "FR")
- `status` (optional): Filter by status (active, paused, closed)
- `service` (optional): Filter by required service
- `clientId` (optional): Filter by client ID *(Admin only)*
- `minBudget` (optional): Minimum budget filter
- `maxBudget` (optional): Maximum budget filter

**Authorization Logic:**
- **Admin**: Can see all projects
- **Client**: Can only see their own projects (filtered by token's clientId)

**Response:**

- `200 OK`:

```json
{
  "data": [
    {
      "id": 1,
      "clientId": 456,
      "client": {
        "id": 456,
        "companyName": "TechStart Inc",
        "contactEmail": "founder@techstart.com"
      },
      "country": "DE",
      "budget": 50000.00,
      "status": "active",
      "services": [
        {
          "id": 1,
          "service": "legal"
        },
        {
          "id": 2,
          "service": "accounting"
        }
      ],
      "createdAt": "2025-06-26T10:30:00Z",
      "updatedAt": "2025-06-26T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

### 3.2 Create Project

**`POST /projects`** *(Protected)*

**Request Body:**

```json
{
  "clientId": 456,
  "country": "FR",
  "servicesNeeded": ["legal", "hr", "marketing"],
  "budget": 25000.00,
  "status": "active"
}
```

**Authorization Logic:**
- **Admin**: Can create projects for any client (clientId required)
- **Client**: Can only create projects for themselves (clientId ignored, inferred from token)

**Response:**

- `201 Created`: Project created successfully

```json
{
  "id": 2,
  "clientId": 456,
  "country": "FR",
  "budget": 25000.00,
  "status": "active",
  "services": [
    {
      "id": 3,
      "service": "legal"
    },
    {
      "id": 4,
      "service": "hr"
    },
    {
      "id": 5,
      "service": "marketing"
    }
  ],
  "createdAt": "2025-06-26T11:00:00Z",
  "updatedAt": "2025-06-26T11:00:00Z"
}
```

- `400 Bad Request`: Validation errors

```json
{
  "statusCode": 400,
  "message": [
    "Country must be a valid ISO 3166-1 alpha-2 code",
    "Services needed must be a non-empty array",
    "Budget must be a positive number"
  ],
  "error": "Bad Request"
}
```

- `403 Forbidden`: Access denied

### 3.3 Get Project by ID

**`GET /projects/:id`** *(Protected)*

**Response:**

- `200 OK`: Project details with related data

```json
{
  "id": 1,
  "clientId": 456,
  "client": {
    "id": 456,
    "companyName": "TechStart Inc",
    "contactEmail": "founder@techstart.com"
  },
  "country": "DE",
  "budget": 50000.00,
  "status": "active",
  "services": [
    {
      "id": 1,
      "service": "legal"
    },
    {
      "id": 2,
      "service": "accounting"
    },
    {
      "id": 3,
      "service": "marketing"
    }
  ],
  "matches": [
    {
      "id": 101,
      "vendorId": 1,
      "vendor": {
        "id": 1,
        "name": "Euro Legal Services",
        "rating": 4,
        "responseSlaHours": 24
      },
      "score": 8.00,
      "createdAt": "2025-06-26T12:00:00Z"
    }
  ],
  "documentsCount": 3,
  "createdAt": "2025-06-26T10:30:00Z",
  "updatedAt": "2025-06-26T10:30:00Z"
}
```

- `403 Forbidden`: Access denied
- `404 Not Found`: Project not found

### 3.4 Update Project

**`PATCH /projects/:id`** *(Protected)*

**Request Body:**

```json
{
  "country": "ES",
  "servicesNeeded": ["legal", "accounting", "marketing", "consulting"],
  "budget": 75000.00,
  "status": "active"
}
```

**Response:**

- `200 OK`: Project updated successfully
- `400 Bad Request`: Invalid data
- `403 Forbidden`: Access denied
- `404 Not Found`: Project not found

### 3.5 Delete Project

**`DELETE /projects/:id`** *(Protected)*

**Response:**

- `204 No Content`: Project deleted successfully
- `403 Forbidden`: Access denied
- `404 Not Found`: Project not found

### 3.6 Rebuild Project Matches

**`POST /projects/:id/matches/rebuild`** *(Protected)*

**Business Logic:**
1. Find all active vendors that support the project's country
2. Calculate services overlap between project and vendor
3. Compute score: `services_overlap * 2 + rating + SLA_weight`
4. SLA_weight = 1 if response_sla_hours <= 24, else 0
5. Upsert matches (update existing, create new)
6. Send notification email for new matches only

**Response:**

- `200 OK`: Matches rebuilt successfully

```json
{
  "created": 3,
  "updated": 2,
  "totalMatches": 5,
  "topMatches": [
    {
      "vendorId": 1,
      "vendorName": "Euro Legal Services",
      "score": 9.00,
      "servicesOverlap": 2,
      "isNew": true
    },
    {
      "vendorId": 3,
      "vendorName": "Accounting Plus",
      "score": 8.00,
      "servicesOverlap": 1,
      "isNew": false
    },
    {
      "vendorId": 2,
      "vendorName": "Global Marketing Co",
      "score": 7.00,
      "servicesOverlap": 1,
      "isNew": true
    }
  ],
  "emailSent": true
}
```

- `403 Forbidden`: Access denied
- `404 Not Found`: Project not found
- `500 Internal Server Error`: Rebuild failed

### 3.7 Get Project Matches

**`GET /projects/:id/matches`** *(Protected)*

**Query Parameters:**

- `minScore` (optional): Minimum score filter
- `limit` (optional): Limit results (default: 10)
- `sortBy` (optional): Sort by field (score, createdAt)
- `sortOrder` (optional): Sort order (desc, asc)

**Response:**

- `200 OK`:

```json
{
  "data": [
    {
      "id": 101,
      "projectId": 1,
      "vendorId": 1,
      "vendor": {
        "id": 1,
        "name": "Euro Legal Services",
        "contactEmail": "contact@eurolegal.com",
        "rating": 4,
        "responseSlaHours": 24,
        "countries": ["DE", "FR", "ES"],
        "services": ["legal", "compliance"]
      },
      "score": 9.00,
      "createdAt": "2025-06-26T12:00:00Z",
      "updatedAt": "2025-06-26T12:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "limit": 10
  }
}
```

- `403 Forbidden`: Access denied
- `404 Not Found`: Project not found

---

## 4. Vendor Management Routes

### 4.1 Get All Vendors

**`GET /vendors`** *(Admin Only)*

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `country` (optional): Filter by supported country
- `service` (optional): Filter by offered service
- `minRating` (optional): Minimum rating filter (0-5)
- `maxRating` (optional): Maximum rating filter (0-5)
- `isActive` (optional): Filter by active status
- `search` (optional): Search by name or email

**Response:**

- `200 OK`:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Euro Legal Services",
      "contactEmail": "contact@eurolegal.com",
      "rating": 4,
      "responseSlaHours": 24,
      "isActive": true,
      "countries": [
        {
          "id": 1,
          "country": "DE"
        },
        {
          "id": 2,
          "country": "FR"
        },
        {
          "id": 3,
          "country": "ES"
        }
      ],
      "services": [
        {
          "id": 1,
          "service": "legal"
        },
        {
          "id": 2,
          "service": "compliance"
        }
      ],
      "matchesCount": 12,
      "createdAt": "2025-06-26T08:00:00Z",
      "updatedAt": "2025-06-26T08:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 4.2 Create Vendor

**`POST /vendors`** *(Admin Only)*

**Request Body:**

```json
{
  "name": "HR Solutions EU",
  "contactEmail": "contact@hrsolutions.eu",
  "rating": 4,
  "responseSlaHours": 36,
  "isActive": true,
  "countriesSupported": ["DE", "FR", "ES"],
  "servicesOffered": ["hr", "recruitment", "payroll"]
}
```

**Response:**

- `201 Created`: Vendor created successfully

```json
{
  "id": 4,
  "name": "HR Solutions EU",
  "contactEmail": "contact@hrsolutions.eu",
  "rating": 4,
  "responseSlaHours": 36,
  "isActive": true,
  "countries": [
    {
      "id": 10,
      "country": "DE"
    },
    {
      "id": 11,
      "country": "FR"
    },
    {
      "id": 12,
      "country": "ES"
    }
  ],
  "services": [
    {
      "id": 10,
      "service": "hr"
    },
    {
      "id": 11,
      "service": "recruitment"
    },
    {
      "id": 12,
      "service": "payroll"
    }
  ],
  "createdAt": "2025-06-26T14:00:00Z",
  "updatedAt": "2025-06-26T14:00:00Z"
}
```

- `400 Bad Request`: Validation errors

```json
{
  "statusCode": 400,
  "message": [
    "Rating must be between 0 and 5",
    "Response SLA hours must be a positive number",
    "At least one country must be supported",
    "At least one service must be offered"
  ],
  "error": "Bad Request"
}
```

- `403 Forbidden`: Admin access required
- `409 Conflict`: Email already exists

### 4.3 Get Vendor by ID

**`GET /vendors/:id`** *(Admin Only)*

**Response:**

- `200 OK`: Vendor details with match statistics

```json
{
  "id": 1,
  "name": "Euro Legal Services",
  "contactEmail": "contact@eurolegal.com",
  "rating": 4,
  "responseSlaHours": 24,
  "isActive": true,
  "countries": [
    {
      "id": 1,
      "country": "DE"
    },
    {
      "id": 2,
      "country": "FR"
    },
    {
      "id": 3,
      "country": "ES"
    }
  ],
  "services": [
    {
      "id": 1,
      "service": "legal"
    },
    {
      "id": 2,
      "service": "compliance"
    }
  ],
  "matchStats": {
    "totalMatches": 12,
    "averageScore": 8.5,
    "lastMatchedAt": "2025-06-26T12:00:00Z"
  },
  "createdAt": "2025-06-26T08:00:00Z",
  "updatedAt": "2025-06-26T08:00:00Z"
}
```

- `403 Forbidden`: Admin access required
- `404 Not Found`: Vendor not found

### 4.4 Update Vendor

**`PATCH /vendors/:id`** *(Admin Only)*

**Request Body:**

```json
{
  "name": "Euro Legal Services Updated",
  "rating": 5,
  "responseSlaHours": 12,
  "countriesSupported": ["DE", "FR", "ES", "IT"],
  "servicesOffered": ["legal", "compliance", "tax"]
}
```

**Response:**

- `200 OK`: Vendor updated successfully
- `400 Bad Request`: Invalid data
- `403 Forbidden`: Admin access required
- `404 Not Found`: Vendor not found
- `409 Conflict`: Email already exists

### 4.5 Delete Vendor

**`DELETE /vendors/:id`** *(Admin Only)*

**Business Logic:**
- Sets `isActive` to `false` instead of hard delete
- Preserves historical match data

**Response:**

- `204 No Content`: Vendor deactivated successfully
- `403 Forbidden`: Admin access required
- `404 Not Found`: Vendor not found

---

## 5. Match Management Routes

### 5.1 Get All Matches

**`GET /matches`** *(Admin Only)*

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `projectId` (optional): Filter by project ID
- `vendorId` (optional): Filter by vendor ID
- `country` (optional): Filter by project country
- `minScore` (optional): Minimum score filter
- `from` (optional): Filter matches created from date (ISO format)
- `to` (optional): Filter matches created to date (ISO format)
- `sortBy` (optional): Sort by (score, createdAt)
- `sortOrder` (optional): Sort order (desc, asc)

**Response:**

- `200 OK`:

```json
{
  "data": [
    {
      "id": 101,
      "projectId": 1,
      "project": {
        "id": 1,
        "country": "DE",
        "client": {
          "companyName": "TechStart Inc"
        }
      },
      "vendorId": 1,
      "vendor": {
        "id": 1,
        "name": "Euro Legal Services",
        "rating": 4
      },
      "score": 9.00,
      "createdAt": "2025-06-26T12:00:00Z",
      "updatedAt": "2025-06-26T12:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 234,
    "pages": 12
  }
}
```

### 5.2 Get Match by ID

**`GET /matches/:id`** *(Admin Only)*

**Response:**

- `200 OK`: Match details
- `403 Forbidden`: Admin access required
- `404 Not Found`: Match not found

---

## 6. Research Documents Routes (MongoDB)

### 6.1 Create Document

**`POST /documents`** *(Protected)*

**Request Body:**

```json
{
  "projectId": 1,
  "title": "German Market Analysis 2025",
  "content": "Comprehensive analysis of the German market for tech startups. The German market presents significant opportunities for technology companies looking to expand...",
  "tags": ["market-research", "germany", "expansion", "tech"]
}
```

**Authorization Logic:**
- **Admin**: Can create documents for any project
- **Client**: Can only create documents for their own projects

**Response:**

- `201 Created`: Document created successfully

```json
{
  "id": "60d5ecb74b4c2a001f8b4567",
  "projectId": 1,
  "title": "German Market Analysis 2025",
  "content": "Comprehensive analysis of the German market for tech startups. The German market presents significant opportunities...",
  "tags": ["market-research", "germany", "expansion", "tech"],
  "createdAt": "2025-06-26T15:30:00Z",
  "updatedAt": "2025-06-26T15:30:00Z"
}
```

- `400 Bad Request`: Validation errors
- `403 Forbidden`: Access denied
- `404 Not Found`: Project not found

### 6.2 Get All Documents

**`GET /documents`** *(Admin Only)*

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `projectId` (optional): Filter by project ID
- `tag` (optional): Filter by tag
- `q` (optional): Full-text search query
- `sortBy` (optional): Sort by (createdAt, updatedAt, title)
- `sortOrder` (optional): Sort order (desc, asc)

**Authorization Logic:**
- **Admin**: Can see all documents
- **Client**: Can only see documents for their own projects

**Response:**

- `200 OK`:

```json
{
  "data": [
    {
      "id": "60d5ecb74b4c2a001f8b4567",
      "projectId": 1,
      "project": {
        "id": 1,
        "country": "DE",
        "client": {
          "companyName": "TechStart Inc"
        }
      },
      "title": "German Market Analysis 2025",
      "content": "Comprehensive analysis of the German market for tech startups...",
      "tags": ["market-research", "germany", "expansion", "tech"],
      "createdAt": "2025-06-26T15:30:00Z",
      "updatedAt": "2025-06-26T15:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 67,
    "pages": 4
  },
  "searchMeta": {
    "query": "german market",
    "searchTime": 23
  }
}
```

### 6.3 Get Document by ID

**`GET /documents/:id`** *(Protected)*

**Response:**

- `200 OK`: Document details with project information

```json
{
  "id": "60d5ecb74b4c2a001f8b4567",
  "projectId": 1,
  "project": {
    "id": 1,
    "country": "DE",
    "client": {
      "id": 456,
      "companyName": "TechStart Inc",
      "contactEmail": "founder@techstart.com"
    },
    "budget": 50000.00,
    "status": "active"
  },
  "title": "German Market Analysis 2025",
  "content": "Comprehensive analysis of the German market for tech startups. The German market presents significant opportunities for technology companies looking to expand their operations into Europe...",
  "tags": ["market-research", "germany", "expansion", "tech"],
  "createdAt": "2025-06-26T15:30:00Z",
  "updatedAt": "2025-06-26T15:30:00Z"
}
```

- `403 Forbidden`: Access denied
- `404 Not Found`: Document not found

### 6.4 Update Document

**`PATCH /documents/:id`** *(Protected)*

**Request Body:**

```json
{
  "title": "German Market Analysis 2025 - Updated",
  "content": "Updated comprehensive analysis...",
  "tags": ["market-research", "germany", "expansion", "tech", "updated"]
}
```

**Response:**

- `200 OK`: Document updated successfully
- `400 Bad Request`: Invalid data
- `403 Forbidden`: Access denied
- `404 Not Found`: Document not found

### 6.5 Delete Document

**`DELETE /documents/:id`** *(Protected)*

**Response:**

- `204 No Content`: Document deleted successfully
- `403 Forbidden`: Access denied
- `404 Not Found`: Document not found

---

## 7. Analytics Routes

### 7.1 Get Top Vendors Analytics

**`GET /analytics/top-vendors`** *(Admin Only)*

**Query Parameters:**

- `days` (optional): Number of days to look back (default: 30)
- `limit` (optional): Number of top vendors per country (default: 3)

**Business Logic:**
1. Query MySQL for matches in the last N days
2. Group by country and vendor
3. Calculate average match score per vendor per country
4. Get top N vendors per country
5. Query MongoDB for document counts per country
6. Merge results

**Response:**

- `200 OK`:

```json
{
  "data": [
    {
      "country": "DE",
      "topVendors": [
        {
          "vendorId": 1,
          "vendorName": "Euro Legal Services",
          "avgScore": 8.7,
          "matchCount": 15,
          "rating": 4
        },
        {
          "vendorId": 3,
          "vendorName": "Accounting Plus",
          "avgScore": 8.1,
          "matchCount": 8,
          "rating": 5
        },
        {
          "vendorId": 2,
          "vendorName": "Global Marketing Co",
          "avgScore": 7.9,
          "matchCount": 12,
          "rating": 4
        }
      ],
      "documentsCount": 42,
      "activeProjectsCount": 8
    },
    {
      "country": "FR",
      "topVendors": [
        {
          "vendorId": 1,
          "vendorName": "Euro Legal Services",
          "avgScore": 8.2,
          "matchCount": 6,
          "rating": 4
        },
        {
          "vendorId": 4,
          "vendorName": "HR Solutions EU",
          "avgScore": 7.8,
          "matchCount": 4,
          "rating": 4
        }
      ],
      "documentsCount": 23,
      "activeProjectsCount": 3
    }
  ],
  "meta": {
    "periodDays": 30,
    "generatedAt": "2025-06-26T16:00:00Z",
    "totalCountries": 2,
    "queryTime": {
      "mysql": 45,
      "mongodb": 12,
      "total": 57
    }
  }
}
```

- `403 Forbidden`: Admin access required

### 7.2 Get Dashboard Statistics

**`GET /analytics/dashboard`** *(Admin Only)*

**Response:**

- `200 OK`:

```json
{
  "overview": {
    "totalClients": 156,
    "totalProjects": 342,
    "activeProjects": 248,
    "totalVendors": 89,
    "activeVendors": 76,
    "totalMatches": 1234,
    "totalDocuments": 1876
  },
  "recentActivity": {
    "projectsCreatedToday": 5,
    "matchesCreatedToday": 23,
    "documentsUploadedToday": 12
  },
  "topCountries": [
    {
      "country": "DE",
      "projectCount": 45,
      "percentage": 13.2
    },
    {
      "country": "FR",
      "projectCount": 38,
      "percentage": 11.1
    },
    {
      "country": "ES",
      "projectCount": 32,
      "percentage": 9.4
    }
  ],
  "topServices": [
    {
      "service": "legal",
      "projectCount": 89,
      "percentage": 26.0
    },
    {
      "service": "marketing",
      "projectCount": 67,
      "percentage": 19.6
    },
    {
      "service": "accounting",
      "projectCount": 45,
      "percentage": 13.2
    }
  ]
}
```

- `403 Forbidden`: Admin access required

---

## 8. Notification Routes

### 8.1 Send Test Email

**`POST /admin/test-email`** *(Admin Only)*

**Request Body:**

```json
{
  "to": "test@example.com",
  "subject": "Test Email from Expanders360",
  "template": "match_notification"
}
```

**Response:**

- `200 OK`: Email sent successfully

```json
{
  "message": "Test email sent successfully",
  "to": "test@example.com",
  "sentAt": "2025-06-26T16:30:00Z",
  "provider": "mock-smtp"
}
```

- `400 Bad Request`: Invalid email or template
- `403 Forbidden`: Admin access required

---

## 9. Health and System Routes

### 9.1 Health Check

**`GET /health`**

**Response:**

- `200 OK`: System healthy

```json
{
  "status": "healthy",
  "timestamp": "2025-06-26T16:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "mysql": {
      "status": "healthy",
      "responseTime": 12
    },
    "mongodb": {
      "status": "healthy",
      "responseTime": 8
    },
    "redis": {
      "status": "healthy",
      "responseTime": 3
    },
    "email": {
      "status": "healthy",
      "provider": "smtp"
    }
  },
  "uptime": 3600
}
```

- `503 Service Unavailable`: One or more services unhealthy

```json
{
  "status": "unhealthy",
  "timestamp": "2025-06-26T16:30:00Z",
  "services": {
    "mysql": {
      "status": "unhealthy",
      "error": "Connection timeout",
      "responseTime": null
    },
    "mongodb": {
      "status": "healthy",
      "responseTime": 8
    }
  }
}
```

### 9.2 API Version

**`GET /version`**

**Response:**

- `200 OK`:

```json
{
  "version": "1.0.0",
  "build": "b3a7d45",
  "commit": "abc123def456",
  "environment": "production",
  "buildDate": "2025-06-25T10:00:00Z",
  "nodeVersion": "18.17.0"
}
```

---

## 10. Administrative Routes

### 10.1 System Configuration

**`GET /admin/config`** *(Admin Only)*

**Response:**

- `200 OK`:

```json
{
  "matching": {
    "serviceWeight": 2,
    "slaThresholdHours": 24,
    "slaWeight": 1,
    "maxMatchesPerProject": 50
  },
  "notifications": {
    "enableMatchNotifications": true,
    "topMatchesCount": 3,
    "emailProvider": "smtp"
  },
  "scheduling": {
    "refreshCron": "0 3 * * *",
    "slaCheckCron": "0 */6 * * *",
    "enabled": true
  },
  "analytics": {
    "defaultPeriodDays": 30,
    "cacheExpiryMinutes": 15
  }
}
```

### 10.2 Update Configuration

**`PATCH /admin/config`** *(Admin Only)*

**Request Body:**

```json
{
  "matching": {
    "serviceWeight": 3,
    "slaThresholdHours": 12
  },
  "notifications": {
    "topMatchesCount": 5
  }
}
```

**Response:**

- `200 OK`: Configuration updated
- `400 Bad Request`: Invalid configuration values
- `403 Forbidden`: Admin access required

### 10.3 Manual Match Refresh

**`POST /admin/refresh-matches`** *(Admin Only)*

**Request Body:**

```json
{
  "projectIds": [1, 2, 3],
  "forceRefresh": true
}
```

**Response:**

- `202 Accepted`: Refresh job queued

```json
{
  "message": "Match refresh job queued",
  "jobId": "refresh_123456",
  "projectCount": 3,
  "estimatedTime": "2-3 minutes"
}
```

### 10.4 SLA Status Report

**`GET /admin/sla-status`** *(Admin Only)*

**Query Parameters:**

- `expired` (optional): Filter by expired status (true/false)
- `vendorId` (optional): Filter by vendor ID

**Response:**

- `200 OK`:

```json
{
  "summary": {
    "totalMatches": 234,
    "expiredMatches": 12,
    "expiryRate": 5.1
  },
  "expiredMatches": [
    {
      "matchId": 101,
      "projectId": 1,
      "vendorId": 1,
      "vendor": {
        "name": "Euro Legal Services",
        "responseSlaHours": 24
      },
      "createdAt": "2025-06-25T10:00:00Z",
      "hoursOverdue": 8
    }
  ]
}
```

---

## 11. Bulk Operations Routes

### 11.1 Bulk Create Vendors

**`POST /vendors/bulk`** *(Admin Only)*

**Request Body:**

```json
{
  "vendors": [
    {
      "name": "Vendor 1",
      "contactEmail": "vendor1@example.com",
      "rating": 4,
      "responseSlaHours": 24,
      "countriesSupported": ["DE", "FR"],
      "servicesOffered": ["legal", "accounting"]
    },
    {
      "name": "Vendor 2",
      "contactEmail": "vendor2@example.com",
      "rating": 3,
      "responseSlaHours": 48,
      "countriesSupported": ["ES", "IT"],
      "servicesOffered": ["marketing", "hr"]
    }
  ]
}
```

**Response:**

- `201 Created`: Bulk creation successful

```json
{
  "created": 2,
  "failed": 0,
  "results": [
    {
      "id": 10,
      "name": "Vendor 1",
      "status": "created"
    },
    {
      "id": 11,
      "name": "Vendor 2",
      "status": "created"
    }
  ]
}
```

- `207 Multi-Status`: Partial success

```json
{
  "created": 1,
  "failed": 1,
  "results": [
    {
      "name": "Vendor 1",
      "status": "created",
      "id": 10
    },
    {
      "name": "Vendor 2",
      "status": "failed",
      "error": "Email already exists"
    }
  ]
}
```

### 11.2 Bulk Update Vendor Status

**`PATCH /vendors/bulk-status`** *(Admin Only)*

**Request Body:**

```json
{
  "vendorIds": [1, 2, 3],
  "isActive": false
}
```

**Response:**

- `200 OK`: Bulk update successful

```json
{
  "updated": 3,
  "message": "Vendor status updated successfully"
}
```

---

## 12. Search and Filtering

### 12.1 Global Search

**`GET /search`** *(Protected)*

**Query Parameters:**

- `q` (required): Search query
- `type` (optional): Filter by type (projects, vendors, documents)
- `limit` (optional): Limit results (default: 20)

**Authorization Logic:**
- **Admin**: Can search all entities
- **Client**: Can only search their own projects and documents

**Response:**

- `200 OK`:

```json
{
  "query": "legal services germany",
  "results": {
    "projects": [
      {
        "id": 1,
        "country": "DE",
        "services": ["legal", "accounting"],
        "client": {
          "companyName": "TechStart Inc"
        },
        "relevanceScore": 0.95
      }
    ],
    "vendors": [
      {
        "id": 1,
        "name": "Euro Legal Services",
        "countries": ["DE", "FR", "ES"],
        "services": ["legal", "compliance"],
        "relevanceScore": 0.92
      }
    ],
    "documents": [
      {
        "id": "60d5ecb74b4c2a001f8b4567",
        "title": "German Legal Requirements",
        "projectId": 1,
        "relevanceScore": 0.88
      }
    ]
  },
  "meta": {
    "totalResults": 3,
    "searchTime": 34,
    "suggestions": ["legal services", "germany expansion"]
  }
}
```

---

## 13. Export Routes

### 13.1 Export Matches

**`GET /matches/export`** *(Admin Only)*

**Query Parameters:**

- `format` (required): Export format (csv, xlsx, json)
- `projectId` (optional): Filter by project
- `country` (optional): Filter by country
- `from` (optional): Date from
- `to` (optional): Date to

**Response:**

- `200 OK`: File download with appropriate content-type
- `400 Bad Request`: Invalid format or parameters
- `403 Forbidden`: Admin access required

### 13.2 Export Analytics

**`GET /analytics/export`** *(Admin Only)*

**Query Parameters:**

- `format` (required): Export format (csv, xlsx, pdf)
- `type` (required): Report type (top-vendors, dashboard, sla-report)
- `days` (optional): Period in days

**Response:**

- `200 OK`: File download
- `400 Bad Request`: Invalid parameters
- `403 Forbidden`: Admin access required

---

## Error Response Format

All error responses follow this standardized format:

```json
{
  "statusCode": 400,
  "message": "Validation failed on multiple fields",
  "error": "Bad Request",
  "timestamp": "2025-06-26T16:30:00Z",
  "path": "/api/v1/projects",
  "method": "POST",
  "requestId": "req_abc123def456",
  "details": [
    {
      "field": "country",
      "message": "Country must be a valid ISO 3166-1 alpha-2 code",
      "code": "INVALID_COUNTRY_CODE"
    },
    {
      "field": "servicesNeeded",
      "message": "At least one service must be specified",
      "code": "EMPTY_SERVICES_ARRAY"
    }
  ]
}
```

## Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `202 Accepted`: Request accepted for processing
- `204 No Content`: Request successful, no content to return
- `207 Multi-Status`: Bulk operation with mixed results
- `400 Bad Request`: Invalid request data or parameters
- `401 Unauthorized`: Authentication required or token invalid
- `403 Forbidden`: Insufficient permissions for the operation
- `404 Not Found`: Requested resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity`: Valid request but business logic validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

## Authentication & Authorization

### JWT Token Structure

```json
{
  "sub": 123,
  "email": "user@example.com",
  "role": "client",
  "clientId": 456,
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Role-Based Access Control (RBAC)

#### Admin Role
- Full CRUD access to all resources
- Can view analytics and system reports
- Can manage system configuration
- Can perform bulk operations
- Can access all projects and documents

#### Client Role
- Can manage their own profile
- Can CRUD their own projects
- Can rebuild matches for their projects
- Can CRUD documents for their projects
- Cannot access other clients' data
- Cannot manage vendors or system settings

### Ownership Guards

For client role, additional checks ensure users can only access their own resources:

1. **Project Ownership**: Verified via `project.client_id === token.clientId`
2. **Document Ownership**: Verified via cross-reference to project ownership
3. **Match Access**: Only matches for owned projects are accessible

## Rate Limiting

- **Public endpoints**: 100 requests per minute per IP
- **Authenticated endpoints**: 1000 requests per minute per user
- **Admin endpoints**: 500 requests per minute per admin
- **Search endpoints**: 60 requests per minute per user
- **Match rebuild**: 10 requests per hour per project
- **Bulk operations**: 5 requests per hour per admin

## Pagination

All list endpoints support pagination with these query parameters:

- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 20, max: 100)

Pagination response format:

```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 234,
    "pages": 12,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## Filtering and Sorting

### Common Filter Parameters

- `search`: General text search across relevant fields
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc` (default: `desc` for dates, `asc` for names)
- `createdAt[gte]`: Filter by creation date greater than or equal
- `createdAt[lte]`: Filter by creation date less than or equal
- `updatedAt[gte]`: Filter by update date greater than or equal
- `updatedAt[lte]`: Filter by update date less than or equal

### Advanced Filtering Examples

```
GET /projects?country=DE&status=active&budget[gte]=10000&budget[lte]=50000
GET /vendors?service=legal&rating[gte]=4&isActive=true
GET /matches?score[gte]=8.0&createdAt[gte]=2025-06-01T00:00:00Z
```

## Caching Strategy

- **Analytics endpoints**: Cached for 15 minutes
- **Vendor lists**: Cached for 5 minutes
- **Configuration**: Cached for 1 hour
- **Search results**: Cached for 2 minutes
- **Health checks**: No caching

## WebSocket Events (Future Enhancement)

Real-time notifications for:

- `match.created`: New match found for project
- `match.updated`: Match score updated
- `project.status_changed`: Project status updated
- `document.uploaded`: New document added to project
- `sla.expired`: Vendor SLA threshold exceeded

## API Versioning

- Current version: `v1`
- Version specified in URL: `/api/v1/`
- Future versions will maintain backward compatibility
- Breaking changes will increment major version
- Deprecation notices provided 6 months in advance

## Request/Response Examples

### Successful Project Creation with Services

**Request:**
```bash
curl -X POST https://api.expanders360.com/api/v1/projects \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "country": "DE",
    "servicesNeeded": ["legal", "accounting", "marketing"],
    "budget": 50000.00,
    "status": "active"
  }'
```

**Response:**
```json
{
  "id": 15,
  "clientId": 456,
  "country": "DE",
  "budget": 50000.00,
  "status": "active",
  "services": [
    {
      "id": 45,
      "service": "legal"
    },
    {
      "id": 46,
      "service": "accounting"
    },
    {
      "id": 47,
      "service": "marketing"
    }
  ],
  "createdAt": "2025-06-26T17:30:00Z",
  "updatedAt": "2025-06-26T17:30:00Z"
}
```

### Match Rebuild with Notifications

**Request:**
```bash
curl -X POST https://api.expanders360.com/api/v1/projects/15/matches/rebuild \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "created": 4,
  "updated": 1,
  "totalMatches": 5,
  "topMatches": [
    {
      "vendorId": 1,
      "vendorName": "Euro Legal Services",
      "score": 9.00,
      "servicesOverlap": 2,
      "isNew": true
    },
    {
      "vendorId": 3,
      "vendorName": "Accounting Plus",
      "score": 8.00,
      "servicesOverlap": 1,
      "isNew": true
    },
    {
      "vendorId": 2,
      "vendorName": "Global Marketing Co",
      "score": 7.00,
      "servicesOverlap": 1,
      "isNew": true
    }
  ],
  "emailSent": true,
  "notificationsSent": {
    "email": "founder@techstart.com",
    "topMatchesIncluded": 3,
    "sentAt": "2025-06-26T17:35:00Z"
  }
}
```

This comprehensive API design provides a complete foundation for implementing the Expanders360 Global Expansion Management system, with detailed endpoint specifications, authentication flows, error handling, and business logic documentation.