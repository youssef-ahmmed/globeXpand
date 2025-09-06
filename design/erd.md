# Expanders360 - Final ERD and Database Schema

## 1. MySQL Entity Relationship Diagram

```
┌─────────────────────────────────┐
│             CLIENT              │
├─────────────────────────────────┤
│ id (PK) BIGINT AUTO_INCREMENT   │
│ company_name VARCHAR(255) NN    │
│ contact_email VARCHAR(255) UQ   │
│ password_hash VARCHAR(255) NN   │
│ role ENUM('admin','client')     │
│ created_at TIMESTAMP DEFAULT    │
│ updated_at TIMESTAMP ON UPDATE  │
└─────────────────────────────────┘
            │ 1
            │
            │ N
┌─────────────────────────────────┐
│            PROJECT              │
├─────────────────────────────────┤
│ id (PK) BIGINT AUTO_INCREMENT   │
│ client_id (FK) BIGINT NN        │
│ country CHAR(2) NN              │
│ budget DECIMAL(12,2)            │
│ status ENUM DEFAULT 'active'    │
│ created_at TIMESTAMP DEFAULT    │
│ updated_at TIMESTAMP ON UPDATE  │
└─────────────────────────────────┘
            │ 1                   │ 1
            │                     │
            │ N                   │ N
┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│        PROJECT_SERVICE          │ │         MATCH_TABLE             │
├─────────────────────────────────┤ ├─────────────────────────────────┤
│ id (PK) BIGINT AUTO_INCREMENT   │ │ id (PK) BIGINT AUTO_INCREMENT   │
│ project_id (FK) BIGINT NN       │ │ project_id (FK) BIGINT NN       │
│ service VARCHAR(64) NN          │ │ vendor_id (FK) BIGINT NN        │
│ created_at TIMESTAMP DEFAULT    │ │ score DECIMAL(6,2) NN           │
│ UNIQUE(project_id, service)     │ │ created_at TIMESTAMP DEFAULT    │
└─────────────────────────────────┘ │ updated_at TIMESTAMP ON UPDATE  │
                                   │ UNIQUE(project_id, vendor_id)   │
                                   └─────────────────────────────────┘
                                                   │ N
                                                   │
                                                   │ 1
                                   ┌─────────────────────────────────┐
                                   │             VENDOR              │
                                   ├─────────────────────────────────┤
                                   │ id (PK) BIGINT AUTO_INCREMENT   │
                                   │ name VARCHAR(255) NN            │
                                   │ contact_email VARCHAR(255) UQ   │
                                   │ rating TINYINT UNSIGNED DEF 0   │
                                   │ response_sla_hours SMALLINT     │
                                   │ is_active BOOLEAN DEFAULT TRUE  │
                                   │ created_at TIMESTAMP DEFAULT    │
                                   │ updated_at TIMESTAMP ON UPDATE  │
                                   └─────────────────────────────────┘
                                                   │ 1       │ 1
                                                   │         │
                                                   │ N       │ N
                                   ┌─────────────────────────────────┐ ┌─────────────────────────────────┐
                                   │        VENDOR_SERVICE           │ │        VENDOR_COUNTRY           │
                                   ├─────────────────────────────────┤ ├─────────────────────────────────┤
                                   │ id (PK) BIGINT AUTO_INCREMENT   │ │ id (PK) BIGINT AUTO_INCREMENT   │
                                   │ vendor_id (FK) BIGINT NN        │ │ vendor_id (FK) BIGINT NN        │
                                   │ service VARCHAR(64) NN          │ │ country CHAR(2) NN              │
                                   │ created_at TIMESTAMP DEFAULT    │ │ created_at TIMESTAMP DEFAULT    │
                                   │ UNIQUE(vendor_id, service)      │ │ UNIQUE(vendor_id, country)      │
                                   └─────────────────────────────────┘ └─────────────────────────────────┘
```

## 2. MongoDB Collections Schema

### Research Documents Collection
```javascript
// Collection: research_documents
{
  "_id": ObjectId,
  "projectId": Number, // Reference to MySQL project.id
  "title": String,
  "content": String,
  "tags": [String],
  "createdAt": Date,
  "updatedAt": Date
}
```

## 3. Complete MySQL Schema (Final Implementation)

### 3.1 Client Table
```sql
CREATE TABLE client (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'client') NOT NULL DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_contact_email (contact_email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 Project Table
```sql
CREATE TABLE project (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    country CHAR(2) NOT NULL,
    budget DECIMAL(12,2),
    status ENUM('active','paused','closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_project_client FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_client_id (client_id),
    INDEX idx_country (country),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 Project Service Table
```sql
CREATE TABLE project_service (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    service VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_project_service_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    UNIQUE (project_id, service),
    
    -- Indexes
    INDEX idx_project_id (project_id),
    INDEX idx_service (service)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.4 Vendor Table
```sql
CREATE TABLE vendor (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    rating TINYINT UNSIGNED NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
    response_sla_hours SMALLINT UNSIGNED NOT NULL DEFAULT 48,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_name (name),
    INDEX idx_contact_email (contact_email),
    INDEX idx_is_active (is_active),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.5 Vendor Service Table
```sql
CREATE TABLE vendor_service (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id BIGINT NOT NULL,
    service VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_vendor_service_vendor FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE CASCADE,
    UNIQUE (vendor_id, service),
    
    -- Indexes
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_service (service)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.6 Vendor Country Table
```sql
CREATE TABLE vendor_country (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id BIGINT NOT NULL,
    country CHAR(2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_vendor_country_vendor FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE CASCADE,
    UNIQUE (vendor_id, country),
    
    -- Indexes
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.7 Match Table
```sql
CREATE TABLE match_table (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    vendor_id BIGINT NOT NULL,
    score DECIMAL(6,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_match_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_match_vendor FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE CASCADE,
    UNIQUE (project_id, vendor_id),
    
    -- Indexes
    INDEX idx_project_id (project_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_score (score DESC),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 4. MongoDB Schema and Indexes

### 4.1 Research Documents Collection
```javascript
// Create collection with validation
db.createCollection("research_documents", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["projectId", "title", "content"],
         properties: {
            projectId: {
               bsonType: "long",
               description: "Must be a long integer matching MySQL project.id"
            },
            title: {
               bsonType: "string",
               minLength: 1,
               description: "Must be a non-empty string"
            },
            content: {
               bsonType: "string",
               minLength: 1,
               description: "Must be a non-empty string"
            },
            tags: {
               bsonType: ["array"],
               items: {
                  bsonType: "string"
               },
               description: "Array of string tags"
            }
         }
      }
   }
});
```

### 4.2 MongoDB Indexes
```javascript
// Text search index for full-text search
db.research_documents.createIndex({
    "title": "text",
    "content": "text",
    "tags": "text"
}, {
    name: "text_search_index"
});

// Compound index for project-based queries
db.research_documents.createIndex({
    "projectId": 1,
    "createdAt": -1
}, {
    name: "project_date_index"
});

// Index for tag-based filtering
db.research_documents.createIndex({
    "tags": 1
}, {
    name: "tags_index"
});

// Sparse index for updated documents
db.research_documents.createIndex({
    "updatedAt": -1
}, {
    name: "updated_date_index",
    sparse: true
});
```

## 5. Data Relationships and Constraints

### 5.1 Primary Relationships
1. **Client → Project**: One-to-Many (1:N)
    - FK: `project.client_id → client.id`
    - CASCADE DELETE: Delete projects when client is deleted

2. **Project → Project_Service**: One-to-Many (1:N)
    - FK: `project_service.project_id → project.id`
    - UNIQUE: (project_id, service) - prevents duplicate services per project

3. **Vendor → Vendor_Service**: One-to-Many (1:N)
    - FK: `vendor_service.vendor_id → vendor.id`
    - UNIQUE: (vendor_id, service) - prevents duplicate services per vendor

4. **Vendor → Vendor_Country**: One-to-Many (1:N)
    - FK: `vendor_country.vendor_id → vendor.id`
    - UNIQUE: (vendor_id, country) - prevents duplicate countries per vendor

5. **Project → Match_Table**: One-to-Many (1:N)
    - FK: `match_table.project_id → project.id`

6. **Vendor → Match_Table**: One-to-Many (1:N)
    - FK: `match_table.vendor_id → vendor.id`
    - UNIQUE: (project_id, vendor_id) - ensures one match per project-vendor pair

7. **Project ↔ Research_Documents**: Cross-Database Reference
    - MongoDB `research_documents.projectId` references MySQL `project.id`

### 5.2 Business Rules and Constraints
- **Rating Validation**: Vendor rating must be between 0 and 5
- **Unique Emails**: Both client and vendor emails must be unique
- **Service Normalization**: Services stored as VARCHAR(64) for consistency
- **Country Codes**: ISO 3166-1 alpha-2 format (CHAR(2))
- **Idempotent Matching**: Unique constraint prevents duplicate matches

## 6. Optimized Matching Query

```sql
-- Find eligible vendors for a project with services overlap count
SELECT 
    v.id AS vendor_id,
    v.name,
    v.rating,
    v.response_sla_hours,
    COUNT(ps.service) AS services_overlap,
    -- Calculate score: services_overlap * 2 + rating + SLA_weight
    (COUNT(ps.service) * 2 + v.rating + 
     CASE WHEN v.response_sla_hours <= 24 THEN 1 ELSE 0 END) AS calculated_score
FROM vendor v
    INNER JOIN vendor_country vc ON vc.vendor_id = v.id
    INNER JOIN vendor_service vs ON vs.vendor_id = v.id
    INNER JOIN project_service ps ON ps.service = vs.service
    INNER JOIN project p ON p.id = ps.project_id
WHERE v.is_active = TRUE
    AND vc.country = p.country
    AND p.id = :project_id
GROUP BY v.id, v.name, v.rating, v.response_sla_hours
HAVING services_overlap > 0
ORDER BY calculated_score DESC;
```

## 7. Analytics Query for Top Vendors

```sql
-- Get top 3 vendors per country based on avg match score (last 30 days)
WITH recent_matches AS (
    SELECT 
        m.*,
        p.country,
        v.name AS vendor_name
    FROM match_table m
        INNER JOIN project p ON p.id = m.project_id
        INNER JOIN vendor v ON v.id = m.vendor_id
    WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
),
vendor_scores AS (
    SELECT 
        country,
        vendor_id,
        vendor_name,
        AVG(score) AS avg_score,
        COUNT(*) AS match_count,
        ROW_NUMBER() OVER (PARTITION BY country ORDER BY AVG(score) DESC) as rank_num
    FROM recent_matches
    GROUP BY country, vendor_id, vendor_name
)
SELECT 
    country,
    vendor_id,
    vendor_name,
    avg_score,
    match_count
FROM vendor_scores
WHERE rank_num <= 3
ORDER BY country, avg_score DESC;
```

## 8. Sample Seed Data

### 8.1 MySQL Sample Data
```sql
-- Clients
INSERT INTO client (company_name, contact_email, password_hash, role) VALUES
('TechStart Inc', 'founder@techstart.com', '$2b$10$hash1', 'client'),
('GlobalCorp Ltd', 'admin@globalcorp.com', '$2b$10$hash2', 'admin'),
('InnovateHub', 'ceo@innovatehub.com', '$2b$10$hash3', 'client');

-- Projects
INSERT INTO project (client_id, country, budget, status) VALUES
(1, 'DE', 50000.00, 'active'),
(1, 'FR', 25000.00, 'active'),
(3, 'ES', 75000.00, 'active');

-- Project Services
INSERT INTO project_service (project_id, service) VALUES
(1, 'legal'), (1, 'accounting'), (1, 'marketing'),
(2, 'legal'), (2, 'hr'),
(3, 'marketing'), (3, 'legal'), (3, 'consulting');

-- Vendors
INSERT INTO vendor (name, contact_email, rating, response_sla_hours) VALUES
('Euro Legal Services', 'contact@eurolegal.com', 4, 24),
('Global Marketing Co', 'info@globalmarketing.com', 4, 48),
('Accounting Plus', 'hello@accountingplus.com', 5, 12),
('HR Solutions EU', 'contact@hrsolutions.eu', 4, 36);

-- Vendor Services
INSERT INTO vendor_service (vendor_id, service) VALUES
(1, 'legal'), (1, 'compliance'),
(2, 'marketing'), (2, 'advertising'),
(3, 'accounting'), (3, 'tax'), (3, 'audit'),
(4, 'hr'), (4, 'recruitment');

-- Vendor Countries
INSERT INTO vendor_country (vendor_id, country) VALUES
(1, 'DE'), (1, 'FR'), (1, 'ES'),
(2, 'DE'), (2, 'US'), (2, 'UK'),
(3, 'FR'), (3, 'DE'), (3, 'IT'),
(4, 'DE'), (4, 'FR'), (4, 'ES');
```

### 8.2 MongoDB Sample Data
```javascript
db.research_documents.insertMany([
  {
    projectId: NumberLong(1),
    title: "German Market Analysis 2025",
    content: "Comprehensive analysis of the German market for tech startups...",
    tags: ["market-research", "germany", "expansion", "tech"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    projectId: NumberLong(1),
    title: "Legal Requirements for DE Market Entry",
    content: "Legal framework and compliance requirements for entering German market...",
    tags: ["legal", "germany", "compliance", "regulations"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    projectId: NumberLong(2),
    title: "French Employment Law Guide",
    content: "Guide to French employment laws and HR practices...",
    tags: ["hr", "france", "employment", "legal"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
```

## 9. Key Design Benefits

### 9.1 Normalized Approach Advantages
- **Query Performance**: Bridge tables enable efficient JOIN operations
- **Data Integrity**: Foreign key constraints prevent orphaned records
- **Flexibility**: Easy to add/remove services and countries per vendor/project
- **Scalability**: Proper indexing supports growing datasets

### 9.2 Unique Features
- **Auto-increment IDs**: All tables have surrogate keys for easier ORM mapping
- **Unique Constraints**: Prevent duplicate services/countries and duplicate matches
- **Audit Trail**: Created/updated timestamps on all entities
- **Soft Deletes**: `is_active` flag on vendors for business continuity

### 9.3 Cross-Database Integration
- **Type Safety**: MongoDB `projectId` as `NumberLong` matches MySQL `BIGINT`
- **Referential Logic**: Application-level foreign key relationship
- **Query Coordination**: Service layer handles cross-database analytics

This refined ERD provides a robust, normalized database design that supports efficient matching algorithms, comprehensive analytics, and maintains data integrity across the hybrid MySQL-MongoDB architecture.