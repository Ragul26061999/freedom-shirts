# Multi-Vendor E-Commerce Marketplace — Complete Build Blueprint

A single reference document for building an Amazon / Flipkart / Meesho-style marketplace where **sellers list products** and **customers buy them**, for every category (electronics, electrical, sarees, shirts, paints, etc.).

> **Important notes before you start**
> 1. **API keys:** nobody can give you "working API keys" to share. Every provider (Razorpay, Shiprocket, Cloudinary, etc.) gives *you* your own keys after you sign up. Section 3 lists where to get each one (most have free test/sandbox modes). Never commit keys to Git; keep them in `.env` files / a secrets manager.
> 2. **Don't build everything at once.** Amazon took 25+ years. Follow the phased roadmap in Section 20 — launch an MVP first, then grow.
> 3. This document assumes **India** (INR, GST, UPI, COD, Indian couriers). Change the integrations if you target other countries.

---

## Table of Contents
1. Product vision & scope
2. Skills required (build, design, test, ops)
3. Technology stack + API/service keys
4. System architecture
5. Roles & permissions
6. Module list (what to build)
7. Database design
8. Module logic & business rules
9. Payment system (complete)
10. Shipment & logistics
11. Product media upload & duplicate comparison
12. Search, filters & recommendations
13. API design standards
14. Frontend design (UI/UX)
15. Security
16. Speed & scalability
17. Database migration strategy
18. Common e-commerce problems & solutions
19. Testing strategy
20. Phased roadmap
21. Final checklist

---

## 1. Product vision & scope

**Type:** Multi-vendor marketplace (many sellers, one storefront).

**Core flows**
- Seller registers → KYC/GST verification → lists products → receives orders → ships → gets paid (settlement).
- Customer browses → searches/filters → adds to cart → pays → tracks shipment → receives → reviews/returns.
- Admin approves sellers/products, handles disputes, refunds, commissions, content, analytics.

**Universal product handling:** a category-driven *attribute system* (Section 7.4) lets one platform handle a shirt (size, color, fabric), a saree (length, fabric, blouse piece), paint (volume, finish, shade), and a TV (screen size, resolution, warranty) without separate code per category.

---

## 2. Skills required

### 2.1 Frontend
| Skill | Why |
|---|---|
| HTML5, CSS3, responsive design (mobile-first) | 70%+ of Indian shoppers are on mobile |
| JavaScript (ES6+), TypeScript | Safer large codebase |
| React + Next.js (SSR/SSG) | SEO + speed for product pages |
| State management (Redux Toolkit / Zustand, React Query/TanStack Query) | Cart, user, server cache |
| Tailwind CSS + component library (shadcn/ui, MUI) | Fast consistent UI |
| Forms & validation (React Hook Form + Zod) | Checkout, seller forms |
| Accessibility (WCAG basics), SEO (meta, schema.org Product markup) | Reach + ranking |
| Performance (lazy loading, image optimisation, code splitting, Core Web Vitals) | Ultra-fast feel |
| PWA basics | Installable, offline-friendly |

### 2.2 Backend
| Skill | Why |
|---|---|
| Node.js + NestJS (or Express) / alternatives: Django, Spring Boot | API layer |
| REST API design (+ optional GraphQL) | Frontend ↔ backend |
| Authentication (JWT, refresh tokens, OAuth, OTP) | Login/security |
| Authorization (RBAC) | Admin/seller/customer permissions |
| ORM (Prisma / TypeORM / Sequelize) + raw SQL | Data access |
| Queues & background jobs (BullMQ/RabbitMQ/Kafka) | Emails, invoices, webhooks, settlement |
| Caching (Redis) | Speed |
| Webhooks & idempotency | Payment and courier callbacks |
| File handling, streaming, S3 | Images/videos |
| Search engines (Elasticsearch/OpenSearch/Meilisearch/Typesense) | Fast search |
| Payment gateway integration | Money handling |
| Logging, monitoring | Debugging production |

### 2.3 Database & data
- SQL (PostgreSQL deeply): joins, indexes, transactions, isolation levels, partitioning
- Schema design & normalisation, migrations
- NoSQL basics (Redis, MongoDB for logs/events)
- Data modelling for variants/attributes (EAV vs JSONB)
- Analytics/reporting queries, data warehouse basics (optional later)

### 2.4 UI/UX design
- User research, personas (customer, seller, admin)
- Wireframes, prototyping (Figma), design systems
- Information architecture (categories, navigation, filters)
- Conversion-focused design (product page, cart, checkout)
- Mobile UX, micro-interactions, empty/error/loading states
- Usability testing, A/B testing

### 2.5 DevOps & cloud
- Git/GitHub flow, CI/CD (GitHub Actions)
- Docker, (later) Kubernetes
- Cloud: AWS / GCP / Azure / (budget) DigitalOcean, Render, Railway
- CDN (Cloudflare/CloudFront), SSL, DNS, load balancing
- Monitoring (Grafana/Prometheus, Sentry, UptimeRobot), backups, disaster recovery

### 2.6 Testing & QA
- Unit (Jest/Vitest), integration (Supertest), E2E (Playwright/Cypress)
- Load testing (k6, JMeter), security testing (OWASP ZAP)
- API testing (Postman), test data management, manual exploratory testing

### 2.7 Business/domain skills (often forgotten)
- GST/tax rules, invoicing, TDS/TCS on marketplaces
- Return/refund/cancellation policy design
- Fraud & risk basics, customer support operations
- Legal pages: Terms, Privacy Policy, Seller Agreement, Return Policy, Grievance officer (required in India under IT/Consumer Protection e-commerce rules)

### 2.8 Team roles (if you hire/split)
Product owner, UI/UX designer, frontend dev, backend dev, DB/data engineer, DevOps, QA, support/ops. As a solo builder you wear all hats — hence the phased roadmap.

---

## 3. Technology stack + API/service keys

### 3.1 Recommended stack (balanced for your skills: React/JS)
| Layer | Recommended | Alternatives |
|---|---|---|
| Frontend web | **Next.js (React) + TypeScript + Tailwind** | Vite+React (SPA), Nuxt |
| Mobile (later) | React Native / PWA | Flutter |
| Backend | **NestJS (Node.js, TypeScript)** | Express, Django REST, Spring Boot |
| Primary DB | **PostgreSQL** | MySQL |
| Cache / sessions / rate-limit | **Redis** | Memcached |
| Search | **Meilisearch / Typesense** (simple), Elasticsearch/OpenSearch (large scale) | Algolia (paid, easiest) |
| Queue | **BullMQ (Redis)** | RabbitMQ, Kafka (huge scale) |
| File storage | **AWS S3 / Cloudflare R2** + CDN | Cloudinary, ImageKit |
| ORM / migrations | **Prisma** | TypeORM, Knex, Flyway |
| Hosting | AWS / DigitalOcean / Render; Vercel for frontend | GCP, Azure |
| CI/CD | GitHub Actions + Docker | GitLab CI |

### 3.2 Why PostgreSQL (and migration-friendly)
- ACID transactions (orders, payments, stock must never be inconsistent).
- JSONB for flexible product attributes + SQL for everything else.
- Mature migration tools (Prisma Migrate / Flyway / Liquibase) → **versioned, repeatable, reversible schema changes**.
- Easily move between hosts (Supabase, Neon, RDS, self-hosted) using `pg_dump` / logical replication.

### 3.3 Third-party services & where to get keys
All keys are created by **you** in each provider's dashboard. Store as environment variables.

| Purpose | Service | Get keys from | Test mode? |
|---|---|---|---|
| Payments (UPI, cards, netbanking, wallets, EMI) | **Razorpay** (also Cashfree, PayU, Stripe India, PhonePe PG) | dashboard.razorpay.com → Settings → API Keys (`key_id`, `key_secret`, webhook secret) | Yes |
| Marketplace split payments / seller payouts | **Razorpay Route** or **Cashfree Easy Split** | Same dashboard (needs activation/KYC) | Yes |
| Shipping aggregator | **Shiprocket**, Delhivery, Shipway, iThink Logistics, NimbusPost | Shiprocket → Settings → API (email+password token) | Sandbox varies |
| OTP / SMS | **MSG91**, Twilio, Fast2SMS (DLT registration required in India) | Provider dashboard | Yes |
| Email | **AWS SES**, SendGrid, Resend, Brevo | Provider dashboard | Yes |
| WhatsApp notifications | WhatsApp Cloud API (Meta), Gupshup, Interakt | Meta for Developers | Yes |
| Social login | Google OAuth | console.cloud.google.com → Credentials | Yes |
| Maps / address autocomplete / pincode | Google Maps Places, Mapbox, India Post pincode API | Respective consoles | Free tier |
| Image/video CDN & transform | Cloudinary / ImageKit / S3+CloudFront | Dashboard | Free tier |
| GST verification | Government GST portal APIs via providers (Signzy, Surepass, Karza) | Provider dashboard | Varies |
| KYC (PAN, Aadhaar, bank penny-drop) | Surepass, Signzy, Digio, Razorpay X validations | Provider | Varies |
| Invoicing / e-invoice | ClearTax, Zoho Books APIs, or generate PDF yourself | Provider | Varies |
| Error tracking | Sentry | sentry.io | Free tier |
| Analytics | Google Analytics 4, PostHog, Mixpanel | Respective | Free tier |
| Search-as-a-service (optional) | Algolia | algolia.com | Free tier |
| Image moderation / embeddings (optional) | AWS Rekognition, Google Vision, or open-source CLIP | Cloud console | Free tier |

### 3.4 `.env` template (never commit real values)
```env
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:4000

DATABASE_URL=postgresql://user:pass@localhost:5432/market
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=change_me_long_random
JWT_REFRESH_SECRET=change_me_long_random
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d

RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

SHIPROCKET_EMAIL=you@example.com
SHIPROCKET_PASSWORD=xxx

S3_BUCKET=market-media
S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
CDN_BASE_URL=https://cdn.example.com

MSG91_AUTH_KEY=xxx
SES_FROM_EMAIL=no-reply@example.com
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
SENTRY_DSN=xxx
```

---

## 4. System architecture

### 4.1 Start as a **modular monolith**, split later
A modular monolith (one deployable, strictly separated modules) is faster to build and debug than microservices. Split heavy modules (search, media, notifications) into services only when needed.

```
                ┌───────────────┐
 Users ───────► │ CDN + WAF     │ (Cloudflare)
                └──────┬────────┘
                       │
        ┌──────────────┴──────────────┐
        │ Next.js Frontend (SSR/ISR)  │  customer site / seller panel / admin panel
        └──────────────┬──────────────┘
                       │ REST/JSON (HTTPS)
        ┌──────────────┴──────────────┐
        │ API Gateway / NestJS App    │
        │  Auth | Catalog | Cart |    │
        │  Order | Payment | Shipping │
        │  Seller | Review | Notify   │
        └──┬──────┬───────┬────────┬──┘
           │      │       │        │
     PostgreSQL  Redis  Search   Object storage (S3) + CDN
        │               engine
        └── Read replicas (scale reads)

 Background workers (BullMQ): emails, SMS, invoices, webhooks, image processing,
                              settlements, search indexing, cleanup jobs
 External: Payment gateway, Courier APIs, SMS/Email providers
```

### 4.2 Module interconnection (event-driven)
Modules talk via **service interfaces + domain events**, never by reaching into each other's tables.

Example: `OrderPaid` event →
- Inventory: convert reserved stock to sold
- Shipping: create shipment request
- Notification: send confirmation (email/SMS/WhatsApp)
- Invoice: generate GST invoice
- Seller: credit pending balance (commission calc)
- Analytics: record sale

### 4.3 Environments
`local` → `dev` → `staging` (mirror of prod, test payments in sandbox) → `production`.

### 4.4 Folder structure (backend)
```
src/
  modules/
    auth/ users/ sellers/ catalog/ inventory/ cart/ checkout/
    orders/ payments/ shipping/ returns/ reviews/ coupons/
    notifications/ search/ media/ admin/ reports/
  common/ (guards, filters, interceptors, pipes, utils)
  config/
  jobs/ (queues, processors)
  database/ (migrations, seeds)
```

---

## 5. Roles & permissions

| Role | Description |
|---|---|
| **Guest** | Browse, search, view products; cart (local) |
| **Customer** | Orders, wishlist, addresses, reviews, returns |
| **Seller** | Own catalog, own orders, inventory, payouts, returns |
| **Seller staff** (optional) | Limited seller actions (e.g., only inventory) |
| **Admin** | Platform management |
| **Support agent** | View orders/customers, handle tickets, limited refunds |
| **Finance** | Settlements, payouts, reports |
| **Catalog moderator** | Approve products/images/reviews |

### 5.1 Permission matrix (summary)
| Action | Guest | Customer | Seller | Admin |
|---|:-:|:-:|:-:|:-:|
| Browse/search | ✅ | ✅ | ✅ | ✅ |
| Place order | ❌ | ✅ | ❌* | ✅ (on behalf) |
| Create/edit product | ❌ | ❌ | ✅ own | ✅ any |
| Approve product/seller | ❌ | ❌ | ❌ | ✅ |
| Manage own orders (ship/cancel) | ❌ | cancel own | ✅ own | ✅ |
| Issue refund | ❌ | request | request/approve own policy | ✅ |
| View payouts | ❌ | ❌ | ✅ own | ✅ all |
| Manage categories/commission | ❌ | ❌ | ❌ | ✅ |
| Manage users/roles | ❌ | ❌ | ❌ | ✅ |
| View all analytics | ❌ | ❌ | own | ✅ |

*Sellers can also have a customer account (separate role flag); block buying their own products.

Implementation: `roles`, `permissions`, `role_permissions`, `user_roles` tables + NestJS `@Roles()` guard + resource ownership checks (e.g., `product.seller_id === currentSeller.id`).

---

## 6. Module list

### 6.1 Customer-facing
1. **Authentication & profile** — signup/login (email, phone OTP, Google), password reset, profile, addresses
2. **Catalog & categories** — category tree, brands, product listing, product detail, variants
3. **Search & filters** — autosuggest, typo tolerance, facets, sorting
4. **Cart** — guest + logged-in cart, merge on login, stock/price validation
5. **Wishlist / Save for later / Compare products**
6. **Checkout** — address, delivery estimate, coupon, payment method, order summary
7. **Orders** — history, tracking, invoice download, cancel, return/exchange
8. **Payments** — UPI, cards, netbanking, wallets, COD, EMI
9. **Reviews & ratings, Q&A**
10. **Notifications** — email, SMS, WhatsApp, in-app, push
11. **Customer support** — tickets, chat, FAQs
12. **Recommendations** — recently viewed, similar, frequently bought together

### 6.2 Seller-facing (seller panel)
1. Seller onboarding & KYC (GST, PAN, bank, pickup address, business docs)
2. Product management — create/edit, variants, bulk upload (CSV/Excel), image/video upload
3. Inventory management — stock, low-stock alerts
4. Order management — new → accepted → packed → ready to ship → shipped
5. Shipping — print label, schedule pickup, manifest
6. Returns/RTO handling
7. Payments & settlements — ledger, commissions, invoices, payout history
8. Promotions — seller discounts, ads (later)
9. Analytics — sales, views, conversion, returns
10. Seller support & policy center, performance score

### 6.3 Admin
1. Dashboard & analytics
2. User/seller/role management
3. Seller approval & KYC verification, seller suspension
4. Category/attribute/brand management
5. Product moderation (approve/reject/takedown, duplicate/fake detection)
6. Order oversight, dispute handling
7. Payment, refund & settlement management, commission rules
8. Shipping partner management & rate cards
9. Coupons/promotions/banners/homepage CMS
10. Review moderation
11. Content (CMS pages, policies)
12. Settings (tax rules, shipping rules, notifications templates)
13. Audit logs, system health
14. Support ticket management
15. Reports (GST, TCS, sales, payout, returns)

### 6.4 Platform/cross-cutting modules
Notification service, media service, search indexing service, tax/GST engine, pricing/commission engine, audit log, rate limiter, feature flags, i18n (English + Tamil/Hindi later), job scheduler.

---

## 7. Database design

### 7.1 Principles
- PostgreSQL, UUID or BIGINT primary keys (use `BIGINT identity` for performance, expose `public_id`/slug to clients).
- **Money in integers (paise)**, never floats. Store currency code.
- Every table: `created_at`, `updated_at`; soft delete (`deleted_at`) where needed.
- **Foreign keys + indexes** on every FK and every frequently-filtered column.
- Orders keep **snapshots** of price/address/product title at purchase time (products change later; orders must not).
- Append-only ledgers for money and stock (never overwrite — insert movements).

### 7.2 Entity overview (ERD in text)
```
users ──< user_roles >── roles ──< role_permissions >── permissions
users ──< addresses
users ──1:1── sellers ──< seller_bank_accounts, seller_documents, seller_pickup_addresses
categories (self-ref tree) ──< category_attributes >── attributes ──< attribute_options
brands
products ──< product_variants ──< inventory_movements / inventory (per warehouse)
products ──< product_media
products ──< product_attribute_values
products >── categories, brands, sellers
carts ──< cart_items >── product_variants
orders ──< order_items >── product_variants / sellers   (orders = customer-level, sub_orders = per seller)
orders ──< payments ──< payment_attempts, refunds
sub_orders ──< shipments ──< shipment_tracking_events
returns ──< return_items
reviews, wishlists, coupons, coupon_usages
seller_ledger, settlements, payouts
notifications, audit_logs, webhook_events
```

### 7.3 Core tables (simplified DDL)

```sql
-- USERS & AUTH
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID DEFAULT gen_random_uuid() UNIQUE,
  name VARCHAR(120),
  email CITEXT UNIQUE,
  phone VARCHAR(15) UNIQUE,
  password_hash TEXT,                 -- argon2/bcrypt, null for social/OTP-only
  is_email_verified BOOLEAN DEFAULT false,
  is_phone_verified BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active', -- active, blocked, deleted
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE roles (id SERIAL PRIMARY KEY, name VARCHAR(40) UNIQUE);          -- admin, seller, customer...
CREATE TABLE permissions (id SERIAL PRIMARY KEY, code VARCHAR(80) UNIQUE);    -- product.approve ...
CREATE TABLE role_permissions (role_id INT REFERENCES roles, permission_id INT REFERENCES permissions, PRIMARY KEY(role_id, permission_id));
CREATE TABLE user_roles (user_id BIGINT REFERENCES users, role_id INT REFERENCES roles, PRIMARY KEY(user_id, role_id));

CREATE TABLE refresh_tokens (
  id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users,
  token_hash TEXT, device_info TEXT, ip INET,
  expires_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ
);

CREATE TABLE addresses (
  id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users,
  name VARCHAR(120), phone VARCHAR(15),
  line1 TEXT, line2 TEXT, landmark TEXT,
  city VARCHAR(80), state VARCHAR(80), pincode VARCHAR(10), country CHAR(2) DEFAULT 'IN',
  type VARCHAR(10), is_default BOOLEAN DEFAULT false
);

-- SELLERS
CREATE TABLE sellers (
  id BIGSERIAL PRIMARY KEY, user_id BIGINT UNIQUE REFERENCES users,
  store_name VARCHAR(150), store_slug VARCHAR(160) UNIQUE,
  business_type VARCHAR(30),           -- individual, proprietorship, pvt ltd...
  gstin VARCHAR(15), pan VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending',-- pending, under_review, approved, rejected, suspended
  commission_override_pct NUMERIC(5,2),
  rating NUMERIC(3,2), approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE seller_bank_accounts (id BIGSERIAL PRIMARY KEY, seller_id BIGINT REFERENCES sellers, account_holder TEXT, account_no_enc TEXT, ifsc VARCHAR(11), is_verified BOOLEAN DEFAULT false);
CREATE TABLE seller_documents (id BIGSERIAL PRIMARY KEY, seller_id BIGINT REFERENCES sellers, doc_type VARCHAR(30), file_url TEXT, status VARCHAR(20), reviewed_by BIGINT, remarks TEXT);
CREATE TABLE seller_pickup_addresses (id BIGSERIAL PRIMARY KEY, seller_id BIGINT REFERENCES sellers, /* address fields */ courier_pickup_code TEXT);

-- CATALOG
CREATE TABLE categories (
  id SERIAL PRIMARY KEY, parent_id INT REFERENCES categories,
  name VARCHAR(100), slug VARCHAR(120) UNIQUE, path LTREE, -- or materialized path text
  commission_pct NUMERIC(5,2), gst_rate NUMERIC(4,2), hsn_code VARCHAR(10),
  return_window_days INT DEFAULT 7, is_active BOOLEAN DEFAULT true, sort_order INT
);
CREATE TABLE brands (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE, slug TEXT UNIQUE, logo_url TEXT);

CREATE TABLE attributes (       -- e.g. Color, Size, Fabric, Screen Size, Volume, Warranty
  id SERIAL PRIMARY KEY, name VARCHAR(80), code VARCHAR(60) UNIQUE,
  data_type VARCHAR(20),        -- text, number, enum, boolean
  unit VARCHAR(20), is_filterable BOOLEAN DEFAULT true
);
CREATE TABLE category_attributes (category_id INT REFERENCES categories, attribute_id INT REFERENCES attributes,
  is_required BOOLEAN, is_variant_defining BOOLEAN, sort_order INT, PRIMARY KEY(category_id, attribute_id));
CREATE TABLE attribute_options (id SERIAL PRIMARY KEY, attribute_id INT REFERENCES attributes, value VARCHAR(100));

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY, seller_id BIGINT REFERENCES sellers,
  category_id INT REFERENCES categories, brand_id INT REFERENCES brands,
  title VARCHAR(250), slug VARCHAR(280) UNIQUE, description TEXT,
  highlights JSONB,             -- bullet points
  specifications JSONB,         -- flexible attribute key/values
  status VARCHAR(20) DEFAULT 'draft', -- draft, pending_review, active, rejected, inactive, banned
  rejection_reason TEXT,
  country_of_origin VARCHAR(50), hsn_code VARCHAR(10),
  avg_rating NUMERIC(3,2) DEFAULT 0, review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON products (category_id, status);
CREATE INDEX ON products (seller_id);
CREATE INDEX ON products USING GIN (specifications);

CREATE TABLE product_variants (    -- the actual sellable SKU
  id BIGSERIAL PRIMARY KEY, product_id BIGINT REFERENCES products,
  sku VARCHAR(80) UNIQUE, barcode VARCHAR(40),
  attributes JSONB,                -- {"color":"Red","size":"M"}
  mrp_paise BIGINT, selling_price_paise BIGINT,
  weight_g INT, length_mm INT, width_mm INT, height_mm INT,   -- for shipping
  is_active BOOLEAN DEFAULT true
);
CREATE UNIQUE INDEX ON product_variants (product_id, (attributes::text));

CREATE TABLE product_media (
  id BIGSERIAL PRIMARY KEY, product_id BIGINT REFERENCES products, variant_id BIGINT,
  type VARCHAR(10),                 -- image, video
  url TEXT, thumbnail_url TEXT, sort_order INT,
  width INT, height INT, size_bytes BIGINT, duration_s INT,
  content_hash CHAR(64),            -- SHA-256 exact duplicate
  phash BIGINT,                     -- perceptual hash for near-duplicate image
  embedding VECTOR(512),            -- (optional) pgvector for similarity
  status VARCHAR(20) DEFAULT 'pending'  -- pending, approved, rejected
);

-- INVENTORY (ledger style)
CREATE TABLE inventory (
  variant_id BIGINT REFERENCES product_variants, warehouse_id BIGINT,
  on_hand INT NOT NULL CHECK (on_hand >= 0),
  reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  low_stock_threshold INT DEFAULT 5,
  PRIMARY KEY (variant_id, warehouse_id)
);
CREATE TABLE inventory_movements (
  id BIGSERIAL PRIMARY KEY, variant_id BIGINT, warehouse_id BIGINT,
  type VARCHAR(20),   -- receive, reserve, release, sale, return, adjust, damage
  qty INT, ref_type VARCHAR(20), ref_id BIGINT, created_by BIGINT, created_at TIMESTAMPTZ DEFAULT now()
);

-- CART
CREATE TABLE carts (id BIGSERIAL PRIMARY KEY, user_id BIGINT NULL, guest_token UUID NULL, updated_at TIMESTAMPTZ);
CREATE TABLE cart_items (cart_id BIGINT REFERENCES carts, variant_id BIGINT REFERENCES product_variants, qty INT CHECK(qty>0), PRIMARY KEY(cart_id, variant_id));

-- ORDERS (one customer order can have items from many sellers)
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY, order_no VARCHAR(25) UNIQUE,   -- human readable
  user_id BIGINT REFERENCES users,
  status VARCHAR(25),               -- pending_payment, confirmed, partially_shipped, completed, cancelled, failed
  shipping_address JSONB, billing_address JSONB,           -- snapshots
  subtotal_paise BIGINT, discount_paise BIGINT, shipping_paise BIGINT, tax_paise BIGINT, total_paise BIGINT,
  coupon_id BIGINT, payment_method VARCHAR(20), placed_at TIMESTAMPTZ DEFAULT now(),
  idempotency_key VARCHAR(80) UNIQUE
);
CREATE TABLE sub_orders (          -- per-seller fulfilment unit
  id BIGSERIAL PRIMARY KEY, order_id BIGINT REFERENCES orders, seller_id BIGINT REFERENCES sellers,
  status VARCHAR(25),              -- new, accepted, packed, shipped, delivered, cancelled, return_requested, returned
  subtotal_paise BIGINT, shipping_paise BIGINT, tax_paise BIGINT, commission_paise BIGINT, seller_payable_paise BIGINT
);
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY, sub_order_id BIGINT REFERENCES sub_orders, variant_id BIGINT,
  title_snapshot TEXT, sku_snapshot TEXT, image_snapshot TEXT, attributes_snapshot JSONB,
  qty INT, unit_price_paise BIGINT, discount_paise BIGINT, tax_paise BIGINT, hsn_code VARCHAR(10), gst_rate NUMERIC(4,2),
  status VARCHAR(25)
);

-- PAYMENTS
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY, order_id BIGINT REFERENCES orders,
  gateway VARCHAR(20), gateway_order_id VARCHAR(80) UNIQUE, gateway_payment_id VARCHAR(80) UNIQUE,
  method VARCHAR(20),              -- upi, card, netbanking, wallet, cod, emi
  amount_paise BIGINT, currency CHAR(3) DEFAULT 'INR',
  status VARCHAR(20),              -- created, authorized, captured, failed, refunded, partially_refunded
  failure_code TEXT, failure_reason TEXT, captured_at TIMESTAMPTZ, raw_response JSONB
);
CREATE TABLE payment_attempts (id BIGSERIAL PRIMARY KEY, payment_id BIGINT, status VARCHAR(20), error_code TEXT, error_desc TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE refunds (
  id BIGSERIAL PRIMARY KEY, payment_id BIGINT, order_item_id BIGINT NULL, return_id BIGINT NULL,
  amount_paise BIGINT, reason TEXT, gateway_refund_id VARCHAR(80) UNIQUE,
  status VARCHAR(20),             -- initiated, processing, completed, failed
  initiated_by BIGINT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE webhook_events (    -- idempotency + audit for gateway/courier callbacks
  id BIGSERIAL PRIMARY KEY, provider VARCHAR(20), event_id VARCHAR(100) UNIQUE,
  event_type TEXT, payload JSONB, processed_at TIMESTAMPTZ, status VARCHAR(20), created_at TIMESTAMPTZ DEFAULT now()
);

-- SELLER MONEY
CREATE TABLE seller_ledger (     -- append-only
  id BIGSERIAL PRIMARY KEY, seller_id BIGINT, type VARCHAR(25), -- sale, commission, tcs, tds, shipping_fee, refund_debit, penalty, payout, adjustment
  amount_paise BIGINT,          -- + credit / - debit
  ref_type VARCHAR(20), ref_id BIGINT, status VARCHAR(15), -- pending, available, paid
  available_on DATE, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE payouts (id BIGSERIAL PRIMARY KEY, seller_id BIGINT, amount_paise BIGINT, utr VARCHAR(40), status VARCHAR(15), period_from DATE, period_to DATE, created_at TIMESTAMPTZ DEFAULT now());

-- SHIPPING
CREATE TABLE shipments (
  id BIGSERIAL PRIMARY KEY, sub_order_id BIGINT, courier VARCHAR(40), awb VARCHAR(40) UNIQUE,
  label_url TEXT, status VARCHAR(25), -- created, pickup_scheduled, picked_up, in_transit, out_for_delivery, delivered, ndr, rto_initiated, rto_delivered, lost
  expected_delivery DATE, weight_g INT, cod_amount_paise BIGINT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE shipment_events (id BIGSERIAL PRIMARY KEY, shipment_id BIGINT, status VARCHAR(30), location TEXT, remark TEXT, event_time TIMESTAMPTZ);

-- RETURNS
CREATE TABLE returns (
  id BIGSERIAL PRIMARY KEY, order_item_id BIGINT, user_id BIGINT, type VARCHAR(15), -- return, exchange, replacement
  reason_code VARCHAR(30), comments TEXT, images JSONB, status VARCHAR(25),
  -- requested, approved, rejected, pickup_scheduled, picked_up, received, qc_passed, qc_failed, refunded, closed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PROMOTION / REVIEW / MISC
CREATE TABLE coupons (id BIGSERIAL PRIMARY KEY, code VARCHAR(30) UNIQUE, type VARCHAR(10), value BIGINT, max_discount_paise BIGINT, min_order_paise BIGINT,
  usage_limit INT, per_user_limit INT, valid_from TIMESTAMPTZ, valid_to TIMESTAMPTZ, applies_to JSONB, funded_by VARCHAR(10)); -- platform | seller
CREATE TABLE coupon_usages (coupon_id BIGINT, user_id BIGINT, order_id BIGINT, PRIMARY KEY(coupon_id, order_id));
CREATE TABLE reviews (id BIGSERIAL PRIMARY KEY, product_id BIGINT, user_id BIGINT, order_item_id BIGINT UNIQUE, rating SMALLINT CHECK(rating BETWEEN 1 AND 5),
  title TEXT, body TEXT, media JSONB, is_verified_purchase BOOLEAN, status VARCHAR(15), helpful_count INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE wishlists (user_id BIGINT, product_id BIGINT, PRIMARY KEY(user_id, product_id));
CREATE TABLE notifications (id BIGSERIAL PRIMARY KEY, user_id BIGINT, channel VARCHAR(10), template TEXT, payload JSONB, status VARCHAR(10), sent_at TIMESTAMPTZ);
CREATE TABLE audit_logs (id BIGSERIAL PRIMARY KEY, actor_id BIGINT, action TEXT, entity TEXT, entity_id BIGINT, before JSONB, after JSONB, ip INET, created_at TIMESTAMPTZ DEFAULT now());
```

### 7.4 Handling "all products" with different attributes
- `categories` → `category_attributes` define which attributes each category needs (e.g., Saree: fabric, length, blouse piece, occasion; Paint: volume, finish, coverage, shade; TV: screen size, resolution, warranty).
- **Variant-defining attributes** (color, size, volume) create `product_variants` rows (each with its own SKU/price/stock).
- **Non-variant attributes** go to `products.specifications` (JSONB) and are indexed in the search engine for filters.
- Admin can add new categories/attributes **without code changes**. This is the key to supporting every kind of product.

### 7.5 Indexing guidance
- B-tree: FKs, `status`, `created_at`, `slug`, `order_no`, `sku`
- Composite: `(category_id, status, created_at)`, `(seller_id, status)`, `(user_id, placed_at DESC)`
- GIN: JSONB columns, `pg_trgm` for fuzzy text fallback
- Partial indexes: `WHERE status='active'`
- Partition big append-only tables by month: `audit_logs`, `shipment_events`, `inventory_movements`, `webhook_events`

### 7.6 Data architecture layers
| Layer | Purpose | Tech |
|---|---|---|
| OLTP | Transactions (orders, payments) | PostgreSQL primary |
| Read scaling | Product browsing | Read replicas + Redis cache |
| Search | Full-text & facets | Meilisearch/Elasticsearch (synced via events) |
| Object store | Images, videos, invoices, labels | S3 + CDN |
| Cache/session | Cart cache, rate-limits, OTP | Redis |
| Queue | Async work | BullMQ/RabbitMQ |
| Analytics (later) | Reports, BI | ClickHouse/BigQuery/Metabase on replica |

---

## 8. Module logic & business rules

### 8.1 Authentication
- Signup: email/phone + password **or** phone OTP **or** Google. Verify phone via OTP (6 digits, 5-min expiry, max 3 resends/hour, 5 wrong tries → lock 15 min).
- Passwords: **argon2id** (or bcrypt cost ≥ 12). Never store plain/encrypted passwords.
- Tokens: short-lived **access JWT (15 min)** + **refresh token (30 days, rotating, stored hashed, revocable per device)**. Send as `httpOnly; Secure; SameSite=Lax` cookies.
- Brute-force protection: rate limit per IP + per account; CAPTCHA after repeated failure.
- Logout = revoke refresh token. "Logout all devices" supported.

### 8.2 Seller onboarding
1. Register → phone/email verified.
2. Submit: store name, business type, PAN, GSTIN (optional if below threshold & allowed), bank account, pickup address, ID/address docs.
3. Auto-checks: GSTIN & PAN validation APIs, bank **penny-drop** verification.
4. Admin review → approve / reject (with reason) / request more info.
5. Approved sellers can list products. Suspended sellers: products hidden, pending orders must be fulfilled or cancelled by admin.
6. Seller performance score (cancellation rate, late dispatch rate, return rate, rating) → warnings → suspension rules.

### 8.3 Product listing (seller side)
1. Choose category → form auto-loads that category's attributes.
2. Enter title, brand, description, highlights, attributes, variants (size/color matrix), MRP, selling price, stock, weight/dimensions, HSN/GST, images (min 3–5), optional video.
3. Validations: selling price ≤ MRP; required attributes present; title length/format; banned words; image count; duplicate check (Section 11).
4. Status flow: `draft → pending_review → active | rejected`. Trusted sellers can be auto-approved after checks; low-risk edits (price/stock) do not need re-review, but title/image/category changes do.
5. **Bulk upload:** CSV/XLSX template per category, processed by background job, row-level error report returned.
6. Product edits keep history (audit log).
7. Products are never hard-deleted if they have orders — set `inactive`.

### 8.4 Catalog display rules
- Product page: image gallery + video, title, price (MRP struck, discount %), rating, variants selector (disable out-of-stock combos), delivery pincode check, seller info, highlights, specs table, description, Q&A, reviews, similar products.
- Only `active` products from `approved` sellers with stock appear.
- Price and stock on listing pages can be **cached (30–60 s)**, but **always re-validated at cart/checkout**.

### 8.5 Cart rules
- Guest cart in localStorage + server (guest_token); on login → **merge** (sum quantities capped by stock).
- Max qty per item (e.g., 10, or configurable per product).
- On every cart view: re-check price, stock, availability at pincode; show warnings ("price changed", "only 2 left").
- Cart does **not** reserve stock (only checkout does).
- Cart expiry for guests: 30 days.

### 8.6 Checkout flow (critical logic)
1. Customer selects/enters address → validate pincode serviceability + delivery date + shipping fee per seller.
2. Apply coupon → validate (dates, min order, per-user limit, category/seller scope, stackability).
3. Calculate **price breakdown** server-side only (never trust client totals):
   `subtotal − discount + shipping + tax (GST: CGST+SGST if intra-state, IGST if inter-state)`.
4. **Create order** (`pending_payment`) in a DB transaction:
   - Lock rows & **reserve stock** (`UPDATE inventory SET reserved = reserved + :q WHERE on_hand - reserved >= :q` — atomic, fails if insufficient).
   - Create `orders`, `sub_orders` (split by seller), `order_items` with snapshots.
   - Use **idempotency key** to avoid duplicate orders on double-click/retry.
5. Create payment at gateway (Section 9) → return gateway order id to the frontend.
6. Reservation **expires in 15 minutes** if unpaid (cron/delayed job releases stock, marks order `failed/expired`).
7. On payment success webhook → confirm order → convert reservation to sale.

### 8.7 Order state machine
```
Order:     pending_payment → confirmed → (partially_shipped) → completed
                 │               │
                 └→ failed/expired   └→ cancelled

Sub-order: new → accepted → packed → ready_to_ship → shipped → out_for_delivery → delivered
              │                                         │
              └→ cancelled (by customer/seller/admin)    └→ ndr → rto → returned_to_seller
Delivered → return_requested → return_approved → picked_up → received → refunded/closed
```
Rules:
- Only valid transitions allowed (enforce in one `OrderStateService`; reject others).
- Customer can cancel until `packed` (free); after `shipped` → must refuse delivery/return.
- Seller must **accept within X hours** (e.g., 24h) and **ship within SLA** (e.g., 48h) else auto-cancel + penalty + full refund.
- Every transition writes an `order_status_history` row + notification + (where relevant) ledger entry.
- COD orders: risk checks (OTP/confirmation call for high value, block users with high RTO history).

### 8.8 Inventory rules
- Quantities change only through `inventory_movements` (ledger) so you can always audit "why is stock 3?".
- Prevent overselling with **atomic conditional updates** (or `SELECT … FOR UPDATE`), not read-then-write in app code.
- Low stock alerts to seller; out-of-stock → hide from "Add to cart", show "Notify me".
- Returns: restock only after QC pass (sellable vs damaged).
- Periodic reconciliation job comparing ledger vs on_hand.

### 8.9 Pricing, discounts & tax
- Seller sets MRP + selling price. Platform may add shipping & convenience fee.
- Discount types: percentage, flat, free shipping, BOGO (later); funded by **platform** or **seller** (affects settlement).
- GST: rate by category/HSN; determine CGST/SGST vs IGST using **seller state vs delivery state**. Invoice must show HSN, tax breakup, seller GSTIN.
- Marketplace (as e-commerce operator) may need **TCS (GST) and TDS 194-O** deductions on seller payouts — confirm current rates with a CA; keep them configurable.
- **Commission:** `category.commission_pct` (or seller override) on item price (+ fixed fee, + payment gateway fee, + shipping fee, optional). Keep rules in a table, versioned by effective date.

### 8.10 Returns / exchanges / refunds
- Return window by category (e.g., 7 days electronics, 10 days apparel; some categories non-returnable — paints once opened, innerwear etc.).
- Reasons: damaged, wrong item, size issue, not as described, quality issue. Require photos for damage/not-as-described.
- Flow: request → seller/auto-approve rule → pickup via courier → QC at seller/warehouse → refund to original source (or wallet/credit) → ledger adjustment (reverse seller credit + commission).
- Fraud controls: limit return rate per customer, serial number check for electronics, "return by wrong item" detection with QC photos.
- Refund timing: refund initiated only after QC pass (or on pickup for trusted customers).

### 8.11 Reviews & ratings
- Only **verified purchasers** (delivered order items) can review once per order item.
- Moderation: profanity filter, spam detection, image moderation, flag/report.
- Aggregates (`avg_rating`, `review_count`) updated by background job, not on each request.
- Detect fake reviews: same IP/device bursts, seller self-reviews, incentive patterns.

### 8.12 Notifications
Events → templates → channels (email, SMS, WhatsApp, push, in-app) with user preferences:
order placed, payment failed, shipped, out for delivery, delivered, return updates, refund processed, price drop (wishlist), back in stock, seller: new order, low stock, payout processed, product rejected.
Use queue + retries + dead-letter queue; store delivery status. Transactional messages must not be blocked by marketing opt-outs.

### 8.13 Admin analytics
GMV, orders, AOV, conversion funnel, cart abandonment, top categories/sellers/products, return rate, payment success rate by method/bank, delivery SLA, NDR/RTO %, seller performance, cohort retention.

---

## 9. Payment system (complete)

### 9.1 Methods
UPI (intent/collect/QR), cards (credit/debit, tokenised per RBI rules), netbanking, wallets, EMI/Pay Later (optional), **COD**, store credit/wallet, gift cards.

> RBI rules: **do not store card numbers/CVV** yourself. Use the gateway's hosted checkout/tokenisation. This keeps you out of heavy PCI-DSS scope.

### 9.2 Standard online payment flow (Razorpay-style)
```
1. Customer clicks "Pay"
2. Backend: create order in DB (pending_payment) → call gateway "create order" (amount, currency, receipt=order_no)
3. Backend returns gateway_order_id + key_id to frontend
4. Frontend opens gateway checkout (UPI/card/netbanking)
5. Customer pays → gateway returns payment_id + signature to frontend
6. Frontend sends them to backend /payments/verify
7. Backend verifies HMAC signature (key_secret) → marks provisional success
8. ⭐ Webhook (payment.captured) arrives server-to-server → THE source of truth
9. Backend (idempotent) marks payment captured, order confirmed, triggers fulfilment events
```
**Golden rule:** frontend success page ≠ payment success. Only the verified signature **and/or webhook** confirms money. Customers may close the tab after paying — the webhook still completes the order.

### 9.3 Marketplace money flow
```
Customer pays platform (full amount)
   → platform holds funds
   → after delivery + return window (T+7 etc.)
   → platform deducts: commission + gateway fee + shipping fee + TCS/TDS + penalties
   → pays seller (payout / split via Razorpay Route / Cashfree Easy Split)
```
Keep a **seller_ledger** (append-only). Balance states: `pending` (order placed) → `available` (after return window) → `paid` (payout done). Never compute balances by mutating one number; compute from ledger.

### 9.4 Payment states
`created → authorized → captured` | `failed` | `refunded` | `partially_refunded` | `disputed (chargeback)`
- Gateway "authorized but not captured": capture within window or auto-capture.

### 9.5 Transaction errors & edge cases (and the fix)
| Problem | Handling |
|---|---|
| Payment failed (insufficient funds, bank decline, wrong OTP) | Log in `payment_attempts`; show friendly message; keep order `pending_payment` until reservation expires; allow **retry** with another method (new attempt, same order) |
| User closes tab after paying | Webhook confirms; order auto-confirmed; user sees it in "My Orders" |
| Money debited but order shows failed ("stuck payment") | Reconciliation job polls gateway for `pending/created` payments older than N minutes; auto-fix or auto-refund |
| Duplicate payment for same order | Detect same `order_id` captured twice → auto-refund the extra |
| Duplicate webhook delivery | `webhook_events.event_id UNIQUE` → ignore repeats (idempotent processing) |
| Webhook arrives before frontend verify | Handle both orders; use row locks/state checks |
| Webhook signature invalid | Reject (401), alert |
| Amount mismatch (tampering) | Compare gateway amount vs order total; flag + refund |
| Gateway timeout / 5xx | Retry with backoff; show "checking payment status…" and poll |
| Bank/UPI pending state | Show "processing", wait for webhook up to X min, then expire |
| Reservation expired but payment succeeds late | Try re-reserve; if stock gone → auto-refund + apologise (or backorder) |
| Refund failed | Retry; alert finance; track `refunds.status` |
| Chargeback / dispute | Webhook → freeze related seller balance, collect evidence (invoice, delivery proof), respond within gateway deadline |
| COD not collected / refused | RTO flow; no payment; penalise abusers (block COD for them) |
| COD cash remittance delay | Track courier COD remittance cycle; match against COD orders in reconciliation |

### 9.6 Refund logic
- Full or partial per order item; to **original payment source** (UPI/card/netbank) in 5–7 working days; or instant to wallet if user chooses.
- Refund amount = item price − (maybe) non-refundable fees (as per policy) + proportional tax; shipping refunded only if seller/platform fault.
- Each refund creates: `refunds` row, gateway call (idempotent with unique reference), ledger reversal for seller, notification, and invoice credit note.

### 9.7 Reconciliation (daily/hourly jobs)
1. Pull gateway settlement report → match with `payments` (by `gateway_payment_id`).
2. Flag: captured in gateway but missing in DB; in DB but missing in gateway; amount mismatches.
3. Courier COD remittances vs COD orders.
4. Seller payouts vs ledger.
5. Produce discrepancy report for finance.

### 9.8 Additional payment features worth adding (missing items)
- Saved cards via gateway tokens (customer consent), saved UPI IDs
- Wallet/store credit (refund-to-wallet, referral credits)
- Gift cards & vouchers
- Convenience fee / COD fee configuration
- Partial payments (wallet + online split)
- International payments (later; multi-currency)
- Auto-retry intelligent routing across gateways (fallback gateway)
- Fraud/risk scoring (velocity checks, device fingerprint, pincode/IP mismatch, high-value COD verification)
- Invoice & credit-note generation, e-invoicing where applicable
- Payout scheduling (T+7/T+10), minimum payout threshold, payout failure handling (wrong bank → seller notified)
- Dispute management dashboard
- Rounding rules and tax-inclusive/exclusive pricing consistency

### 9.9 Payment security checklist
- Create amounts **server-side only**; verify signatures (HMAC SHA-256) on callbacks & webhooks.
- Use HTTPS everywhere; restrict webhook endpoint (signature + optional IP allowlist).
- Idempotency keys on create-order, refund, payout APIs.
- Store only gateway tokens/IDs, never card data.
- Encrypt seller bank details at rest (AES-256 with KMS-managed key).
- Separate roles: only finance/admin can issue refunds above a limit; log all actions.

---

## 10. Shipment & logistics

### 10.1 Models
1. **Aggregator-based (recommended to start):** Shiprocket / Delhivery / Shipway / iThink — one API gives multiple couriers, rate comparison, labels, pickup, tracking, COD remittance, NDR management.
2. Seller self-ship (large/bulky/local items) — seller enters courier + AWB manually.
3. Own fleet / hyperlocal (later).

### 10.2 Shipping flow
```
Sub-order accepted by seller
   → seller packs, confirms weight/dimensions
   → system picks courier (rule: cheapest / fastest / best success rate for pincode)
   → API: create shipment → AWB + label + pickup scheduling
   → courier picks up → tracking webhooks update shipment_events
   → in_transit → out_for_delivery → delivered (OTP-based delivery for high-value)
   → delivered triggers: return window start, review invitation, ledger "available_on" date
```

### 10.3 Logic details
- **Serviceability:** pincode check at product page and checkout (courier API / own pincode table); show estimated delivery date (seller handling time + courier TAT).
- **Shipping charge calculation:** weight slabs (use `max(actual weight, volumetric weight)`; volumetric = L×W×H(cm)/5000), zone (local/regional/national/metro-to-metro), COD fee; free shipping above threshold (platform- or seller-funded).
- **Multi-seller orders:** one customer order → multiple shipments (split delivery); show each package's tracking.
- **Packaging rules:** fragile / liquid (paints!) / hazardous categories → special handling flags, courier restrictions (e.g., paint is flammable → needs surface/air restrictions); category-level `shipping_restrictions`.
- **Tracking:** courier webhooks (preferred) + fallback polling every 2–4 hrs for non-updated shipments.
- **NDR (non-delivery report):** customer unavailable/address issue → notify customer (SMS/WhatsApp link to reattempt/update address) → 2–3 attempts → RTO.
- **RTO (return to origin):** inventory returns to seller after QC; shipping cost penalty to seller or customer depending on cause; COD abusers flagged.
- **Lost/damaged in transit:** claim with courier, refund customer, ledger adjustment.
- **Pickup failures:** seller SLA breach → warning/penalty.
- **Label & manifest:** generate PDF label, invoice in the package, manifest for pickup handover.
- **Delivery proof:** OTP/POD (proof of delivery) stored; used in disputes ("item not received").
- **Returns logistics:** reverse pickup via courier API; QC photos.
- **Address quality:** pincode→city/state auto-fill, landmark, phone validation, geocoding to reduce NDR.

### 10.4 Shipment status mapping
Normalise each courier's statuses to your standard set (`created, pickup_scheduled, picked_up, in_transit, out_for_delivery, delivered, ndr, rto_initiated, rto_delivered, lost, cancelled`) via a mapping table so the UI and logic don't depend on one courier.

---

## 11. Product media upload & duplicate comparison

### 11.1 Your requirement (as understood)
When a seller uploads **images and videos**, the system should **compare them with existing media to detect duplicates/copied content** — but the comparison should **not judge image/video quality** (sharpness, resolution, etc.).

> If you meant something different (e.g., *compare* only the product, but *preserve original quality* without compressing), tell me and I'll adjust this section.

### 11.2 Upload flow
```
Seller selects files → frontend validates type/size → request signed upload URL
→ upload direct to S3 (pre-signed URL; server never handles big files)
→ S3 event → queue job:
    1. Virus/malware scan (ClamAV)
    2. Validate real file type (magic bytes), strip EXIF/GPS metadata
    3. Generate variants: thumbnail, medium, large, WebP/AVIF (images); HLS/MP4 720p + poster (videos via FFmpeg/MediaConvert)
    4. Compute fingerprints (below)
    5. Duplicate / similarity check
    6. Moderation (nudity/violence/logo misuse via AI API)
    7. Mark media approved / pending_manual_review / rejected
→ Notify seller of result with reasons
```

### 11.3 Duplicate comparison (not quality-based)
Use **content fingerprints**, independent of resolution/quality:
| Method | Detects | Quality-independent? |
|---|---|---|
| SHA-256 file hash | Exact same file | Exact only |
| **Perceptual hash (pHash / dHash / aHash)** | Same image resized, recompressed, slightly edited | ✅ Yes |
| **Image embeddings (CLIP/ResNet) + vector search (pgvector/Qdrant)** | Same product photographed similarly, crops, filters, watermarks | ✅ Yes |
| **Video**: extract keyframes (e.g., 1 per 2s) → pHash/embedding each → compare sets | Re-encoded/trimmed/copied video | ✅ Yes |

Matching logic:
1. Exact hash match → reject/flag immediately.
2. pHash Hamming distance ≤ threshold (e.g., ≤ 8 of 64 bits) → candidate duplicate.
3. Embedding cosine similarity ≥ threshold (e.g., 0.92) → candidate duplicate.
4. Decide by context:
   - **Same seller, different variant of same product** → allowed (e.g., red vs blue shirt).
   - **Different seller, near-identical** → **flag for review** (could be copied/stolen images or legitimate same-brand product — genuine brand products often share manufacturer images; so don't auto-ban).
   - Same seller re-uploading to create duplicate listings → block/merge suggestion.
5. Store `content_hash`, `phash`, `embedding` in `product_media`; index for fast lookup (BK-tree/LSH or pgvector HNSW index).

### 11.4 Quality handling (separate from comparison)
- Comparison **ignores** quality. Quality is handled by simple **independent rules**: minimum resolution (e.g., 500×500; recommended 1000×1000+), max file size, aspect ratio, allowed formats (JPG/PNG/WebP; MP4/MOV up to e.g. 60s/100MB). If you truly want to ignore quality completely, keep only the file-type/size safety checks.
- Keep **original uploaded file** untouched in a private bucket; serve optimised derivatives via CDN.

### 11.5 Extra media rules
- Min 3 images per product (category-dependent), first image on white background for listing (apparel can have model shots).
- Block watermarks/other-marketplace logos/phone numbers/text overlays via OCR (optional).
- Alt text auto-generated (accessibility + SEO).
- Lazy loading + `srcset` + blur placeholder; videos load on click/hover (poster first).

---

## 12. Search, filters & recommendations

- Sync products to the search engine via events (`ProductUpdated` → index job). Index: title, brand, category path, attributes, price, rating, seller, stock flag, popularity.
- Features: autosuggest, typo tolerance, synonyms (e.g., "tshirt/t-shirt", "saree/sari", "emulsion/wall paint"), Hindi/Tamil transliteration (later), category-aware ranking.
- **Facets** per category come from `category_attributes` (Color, Size, Brand, Price range, Rating, Discount, Fabric, Voltage, etc.).
- Ranking score = text relevance × (sales velocity, rating, in-stock, seller score, price competitiveness, recent clicks). Add sponsored slots later.
- Recommendations: recently viewed, "customers also bought" (co-purchase from orders), similar products (attributes/embedding), personalised home page (later with ML).
- Cache hot queries in Redis; pagination via cursor/`search_after`, limit deep paging.
- Zero-result handling: suggest corrections/alternates; log zero-result queries to improve catalog.

---

## 13. API design standards

### 13.1 Conventions
- Base: `/api/v1`, JSON, kebab-case paths, plural nouns, standard HTTP codes.
- Pagination: `?page=1&limit=20` (or cursor for large lists), response `{data, meta:{page, total}}`.
- Errors: `{ "error": { "code": "STOCK_UNAVAILABLE", "message": "...", "details": [...] } }` — consistent, machine-readable codes.
- Validation on every input (class-validator/Zod). Never trust the client.
- Versioning, OpenAPI/Swagger docs auto-generated.
- Idempotency-Key header for POST on checkout/payments/refunds.

### 13.2 Key endpoints (sample)
```
AUTH
POST /auth/register | /auth/login | /auth/otp/send | /auth/otp/verify
POST /auth/refresh | /auth/logout | /auth/forgot-password | /auth/reset-password

CATALOG (public)
GET  /categories            GET /categories/:slug/attributes
GET  /products?category=&brand=&minPrice=&sort=&q=
GET  /products/:slug        GET /products/:id/reviews
GET  /search/suggest?q=

CUSTOMER
GET/POST/PUT/DELETE /me/addresses
GET/POST/PATCH/DELETE /cart/items       POST /cart/merge
POST /checkout/preview     (pricing, shipping, tax, coupons)
POST /checkout/place       (creates order + payment intent)
POST /payments/verify      POST /webhooks/razorpay   (public, signature-verified)
GET  /orders  GET /orders/:orderNo  POST /orders/:id/cancel
POST /orders/:itemId/return  GET /returns/:id
POST /reviews   POST /wishlist

SELLER
POST /seller/register  GET /seller/status
CRUD /seller/products  POST /seller/products/bulk-upload
POST /seller/media/upload-url
GET  /seller/orders  POST /seller/orders/:id/accept|pack|ship|cancel
GET  /seller/inventory PATCH /seller/inventory/:variantId
GET  /seller/payouts   GET /seller/ledger   GET /seller/analytics

ADMIN
GET/PATCH /admin/sellers/:id/approve|reject|suspend
GET/PATCH /admin/products/:id/approve|reject|takedown
CRUD /admin/categories | /admin/attributes | /admin/brands | /admin/coupons
GET  /admin/orders  POST /admin/refunds  GET /admin/settlements
GET  /admin/reports/...  GET /admin/audit-logs
```

### 13.3 Backend logic best practices
- Thin controllers → service layer (business rules) → repository layer (DB).
- **Transactions** around multi-table operations (order creation, refund + ledger).
- Domain events + queue for side effects; **outbox pattern** (write event in same transaction, publish after commit) so events are never lost.
- Retries with exponential backoff, dead-letter queues, circuit breakers for external APIs.
- Feature flags for risky releases; config in DB/env, not hard-coded.

---

## 14. Frontend design (UI/UX)

### 14.1 Applications (can share one design system)
1. **Customer storefront** (Next.js, SSR/ISR)
2. **Seller dashboard** (React, protected route)
3. **Admin panel** (React admin template or custom)

### 14.2 Key pages (Amazon/Flipkart/Meesho feel)
**Customer:** Home (hero banners, category icons, deals, recommended rows, recently viewed) · Category/Listing (filters sidebar/drawer, sort, grid, infinite scroll/pagination, quick add) · Product detail · Cart · Checkout (address → delivery → payment → review, single-page, progress) · Order success · My Orders & tracking timeline · Order detail/invoice · Returns · Wishlist · Profile/addresses · Login/Signup (OTP-first) · Help center · Search results.
**Seller:** Dashboard · Add/edit product wizard · Bulk upload · Inventory · Orders (tabs by status) · Shipping/labels · Returns · Payments/ledger · Analytics · Settings/KYC.
**Admin:** Dashboard · Sellers (approval queue) · Products moderation queue · Orders · Refunds · Settlements · Categories/attributes builder · Coupons/banners/CMS · Reports · Users/roles · Audit logs.

### 14.3 Design patterns
- **Mobile-first**, sticky bottom bar on product page ("Add to Cart / Buy Now"), thumb-friendly buttons.
- Clear visual hierarchy: price, discount, rating, delivery date, trust badges, stock urgency.
- Header: logo, big search with suggestions, location/pincode, account, cart badge, category mega-menu.
- Product cards: image, title (2 lines), rating, price/MRP/discount%, delivery tag, wishlist heart.
- Skeleton loaders, optimistic UI (add to cart instantly), toasts, clear empty states, inline form validation, guest checkout option, address autofill from pincode.
- Meesho-style: social sharing (WhatsApp), reseller/low-price emphasis (optional), COD prominent.
- Design tokens (colors, spacing, typography), dark mode optional, consistent components (Button, Input, Modal, Table, Badge, Stepper).
- Accessibility: keyboard nav, contrast ratios, aria labels, alt text.
- SEO: server-rendered product pages, clean URLs (`/p/slug-123`), canonical, sitemap.xml, `Product` JSON-LD (price, availability, rating), Open Graph tags.
- Internationalisation-ready (i18n keys from day one).
- **Do not copy** Amazon/Flipkart/Meesho logos, brand colours/trade dress, text, or images — build your own identity inspired by their *layout patterns*.

### 14.4 Conversion & trust features
Ratings with photos, "verified purchase", easy returns badge, secure payment badge, delivery estimate, EMI info, price-drop alerts, back-in-stock alerts, coupons banner, urgency ("Only 3 left" – must be truthful), clear shipping/returns policy near the buy button.

---

## 15. Security

### 15.1 Application security (OWASP Top 10)
| Risk | Prevention |
|---|---|
| Injection (SQL) | ORM/parameterised queries; never string-concatenate SQL |
| XSS | Escape output; sanitise rich text (DOMPurify); CSP header |
| CSRF | SameSite cookies + CSRF tokens for cookie auth |
| Broken access control (**most common!**) | RBAC + **ownership checks on every resource** (IDOR: user A must not read user B's order by changing the ID); deny by default |
| Auth failures | Rate limit, lockout, MFA for admin/seller, secure password reset (single-use, short-lived tokens) |
| Sensitive data exposure | HTTPS/TLS, encryption at rest, field-level encryption for bank/PAN/Aadhaar, mask in logs |
| Security misconfiguration | Helmet headers, no debug in prod, least-privilege DB users, secrets manager |
| Vulnerable dependencies | `npm audit`, Dependabot/Renovate, lockfiles |
| SSRF / file upload attacks | Allowlist URLs, validate file magic bytes, virus scan, store uploads outside web root |
| Logging failures | Audit logs for admin/seller/finance actions; alerts on anomalies |

### 15.2 Platform security
- WAF + DDoS protection (Cloudflare), bot protection on login/checkout/search (rate limit + CAPTCHA).
- Rate limiting per IP/user/endpoint (Redis); stricter on OTP, login, coupon apply (coupon brute force).
- Admin panel: MFA, IP allowlist optional, separate subdomain, session timeout.
- Encrypted backups, tested restore, point-in-time recovery.
- Secrets in AWS Secrets Manager / Doppler / Vault; rotate keys.
- Least privilege IAM; private subnets for DB/Redis; no public DB.
- Privacy: comply with **India's DPDP Act 2023** (consent, purpose limitation, data deletion on request), cookie consent, data retention policy.
- Fraud: velocity checks, device fingerprinting, blacklist (phone/IP/address/device), COD risk scoring, fake-seller detection (same PAN/bank multiple accounts).
- Anti-scraping: rate limits, bot detection (price scraping is common).
- Penetration test before launch.

---

## 16. Speed & scalability ("ultra-fast")

### 16.1 Frontend speed
- Next.js **ISR/SSG** for category & product pages (revalidate e.g. 60s), SSR for personalised parts, client-side fetch for price/stock/delivery.
- Images: WebP/AVIF, responsive `srcset`, lazy loading, blur placeholders, CDN (aim LCP < 2.5s).
- Code splitting, tree-shaking, dynamic imports for heavy components, avoid large libraries.
- Preload critical fonts, use `font-display: swap`, minimise third-party scripts.
- HTTP/2/3, Brotli compression, long cache headers for static assets with hashed filenames.
- Service worker/PWA caching for static shell.
- Track **Core Web Vitals** (LCP, INP, CLS) with real-user monitoring.

### 16.2 Backend speed
- **Redis caching:** product details, category tree, homepage blocks, pincode serviceability, rate-limit counters, sessions. Cache invalidation via events (`ProductUpdated` → delete key). Use cache-aside pattern + short TTL; protect against cache stampede (locking/jitter).
- Avoid **N+1 queries** (use joins/DataLoader), select only needed columns, pagination everywhere.
- Connection pooling (PgBouncer).
- Read replicas for browse/search/reporting; primary only for writes.
- Async everything non-critical (emails, invoices, indexing, analytics) via queues.
- Compress responses (gzip/Brotli), HTTP keep-alive.
- Use **search engine** (not SQL `LIKE '%q%'`) for text search.
- Denormalise carefully for read speed (e.g., `avg_rating`, `review_count`, `min_price` on product).
- Query plans: `EXPLAIN ANALYZE`, slow query log, proper indexes.

### 16.3 Scaling path
1. **Stage 1 (0–10k users):** single server/managed services, Postgres + Redis, CDN.
2. **Stage 2:** horizontal app scaling (multiple stateless API instances behind a load balancer), autoscaling, read replicas, dedicated search + queue workers.
3. **Stage 3:** extract heavy modules (search, media, notifications, orders/payments) into services; Kafka for events; database sharding/partitioning by seller or time for huge tables; multi-AZ/regional deployment.
- **Stateless API** (no local sessions/files) so any instance can serve any request.
- **Flash sale readiness:** queue-based order intake, Redis atomic stock counters, rate limiting, virtual waiting room, pre-warmed caches, load test beforehand.
- Capacity planning and **load tests** (k6) before every big sale.

### 16.4 Performance budgets (targets)
API p95 < 300 ms (reads), < 800 ms (checkout); product page LCP < 2.5 s on 4G; search response < 100 ms; 99.9% uptime.

---

## 17. Database migration strategy (easy to move & evolve)

### 17.1 Schema migrations (code-managed)
- Every schema change is a **versioned migration file** in Git (Prisma Migrate / Flyway / Knex / Liquibase). Never edit prod DB by hand.
- Run migrations automatically in CI/CD (staging first, then prod).
- **Zero-downtime pattern (expand → migrate → contract):**
  1. *Expand:* add new nullable column/table (backward compatible)
  2. Deploy code that writes to both old and new
  3. Backfill old data in batches (background job)
  4. Switch reads to new
  5. *Contract:* remove old column in a later release
- Avoid long locks: `CREATE INDEX CONCURRENTLY`, add columns nullable, batch updates, avoid `ALTER TYPE` on huge tables during peak.
- Each migration has a **rollback/down** plan and is tested on a production-size copy.
- **Seed data** (roles, permissions, default categories, attributes) as repeatable seed scripts.

### 17.2 Moving to a new database/host
- Same engine (Postgres → Postgres): `pg_dump/pg_restore`, or **logical replication** for near-zero downtime cutover (set up replica on new host → sync → switch connection string → verify → decommission).
- Different engine (MySQL → Postgres): use `pgloader`, then verify counts/checksums.
- Avoid vendor lock-in: stick to standard SQL; isolate provider-specific features; use environment-based config (`DATABASE_URL`).
- Keep **backups** (daily full + continuous WAL), test **restore** monthly, keep a documented runbook.
- Validate after migration: row counts, checksums, referential integrity, sample business flows, performance tests.
- Store files in S3-compatible storage (portable across AWS/R2/MinIO).

### 17.3 Data safety
- Soft deletes + audit logs; PII encryption; retention rules (archive old orders to cold storage after N years but keep tax records ≥ legal period).
- Separate DB users: app (limited), migration (DDL), read-only (analytics).

---

## 18. Common e-commerce problems and how this design solves them

| # | Problem | Solution in this blueprint |
|---|---|---|
| 1 | **Overselling / stock mismatch** | Atomic reservation, ledger-based inventory, reservation timeout, reconciliation |
| 2 | **Slow site, high bounce** | SSR/ISR + CDN + Redis + search engine + image optimisation + performance budgets |
| 3 | **Cart abandonment** | Guest checkout, OTP login, saved carts, price-drop & reminder notifications, fewer checkout steps, multiple payment options, COD |
| 4 | **Payment failures / stuck payments** | Retry flows, webhooks as truth, reconciliation, auto-refund on duplicates, clear error messages, fallback gateway |
| 5 | **Fake / duplicate / low-quality listings** | Moderation queue, duplicate media detection, category-required attributes, seller KYC |
| 6 | **Counterfeit products** | Brand authorisation docs, seller KYC, review reports, takedown flow, serial/invoice verification for electronics |
| 7 | **Fake reviews** | Verified-purchase-only reviews, spam/behaviour detection, moderation |
| 8 | **High return rate** | Accurate size charts, multiple photos/videos, reason analytics, seller scorecards, QC rules |
| 9 | **COD fraud / RTO losses** | COD risk scoring, OTP/call confirmation, COD limits, block repeat offenders, advance payment incentives, address verification |
| 10 | **Seller non-compliance (late dispatch, cancellations)** | SLA timers, auto-cancel, penalties, performance score, suspension rules |
| 11 | **Wrong/changed prices (customer paid different price)** | Server-side recalculation, price re-validation at checkout, snapshots in order items |
| 12 | **Coupon abuse** | Per-user limits, usage tracking, device/IP checks, stack rules, expiry |
| 13 | **Security breaches/account takeover** | Rate limiting, MFA for staff, hashed passwords, token rotation, WAF, audits |
| 14 | **Poor search results** | Dedicated search engine, synonyms, typo tolerance, zero-result analysis |
| 15 | **Shipping delays / lost parcels** | Multi-courier routing, tracking webhooks, NDR workflows, claims process, SLAs |
| 16 | **Settlement disputes with sellers** | Append-only ledger, transparent statements, commission rules versioned, automated reports |
| 17 | **Tax compliance errors** | Category/HSN-based GST engine, proper invoices, credit notes, TCS/TDS handling (CA reviewed) |
| 18 | **Data loss / downtime** | Backups, PITR, multi-AZ, health checks, monitoring/alerts, runbooks |
| 19 | **Flash sale crashes** | Queue-based checkout, rate limiting, cache warm-up, autoscaling, load testing |
| 20 | **Duplicate orders on double click / retries** | Idempotency keys, button disabling, DB unique constraints |
| 21 | **Customer support overload** | Self-service order tracking, FAQs, ticket system with SLAs, proactive notifications |
| 22 | **Poor mobile experience** | Mobile-first UI, PWA, lightweight pages, thumb-friendly UX |
| 23 | **SEO weakness** | SSR, structured data, clean URLs, sitemaps, fast pages |
| 24 | **Complex multi-category products** | Dynamic attribute system (Section 7.4) |
| 25 | **Address errors → failed deliveries** | Pincode autofill, validation, phone verification, landmark, NDR reattempt |
| 26 | **Inconsistent order status across modules** | Central state machine + event history |
| 27 | **Vendor lock-in/hard migrations** | Migration framework, portable SQL, S3-compatible storage, env-based config |
| 28 | **Legal/compliance gaps** | Policies, grievance officer, DPDP Act compliance, seller agreement, consumer-protection e-commerce rules |
| 29 | **Hidden charges complaints** | Show full price breakdown early (shipping, tax, fees) before payment |
| 30 | **Bot scraping / price scraping** | Rate limiting, bot detection, honeypots |

---

## 19. Testing strategy

| Level | Tools | What to cover |
|---|---|---|
| Unit | Jest/Vitest | Pricing, tax, coupon, commission, shipping calc, state machine transitions |
| Integration | Supertest + test DB (Docker) | API ↔ DB, transactions, stock reservation concurrency |
| Contract | Pact/OpenAPI validation | Frontend ↔ backend, third-party mocks |
| E2E | Playwright/Cypress | Signup → search → cart → pay (sandbox) → track → return |
| Payment | Gateway sandbox | Success, fail, pending, duplicate webhook, signature invalid, refund |
| Load/Stress | k6, JMeter | Search, product, checkout, flash sale; find bottlenecks |
| Security | OWASP ZAP, Snyk, manual IDOR tests | Auth bypass, injection, upload attacks |
| Concurrency | Custom scripts | 100 users buying the last 1 item → only 1 succeeds |
| Usability | Figma prototypes, 5–8 real users, heatmaps | Navigation, checkout friction |
| Accessibility | axe, Lighthouse | WCAG basics |
| Cross-device | BrowserStack | Android low-end devices, Safari, slow 3G |
| Data migration | Staging dry-runs | Row counts, constraints, performance |
| Regression | CI on every PR | Prevent breaking critical flows |

**Quality gates in CI:** lint + type check + unit + integration + E2E smoke + security scan + build; block merge on failure. Aim ≥ 80% coverage on business-critical modules (pricing, orders, payments, inventory).

**Observability:** structured logs (request ID), Sentry errors, metrics (Prometheus/Grafana), uptime monitors, payment success dashboard, alerting (Slack/WhatsApp/PagerDuty).

---

## 20. Phased roadmap

### Phase 0 — Foundation (2–3 weeks)
Requirements freeze, Figma wireframes + design system, repo setup, CI/CD, Docker, DB schema v1, auth + RBAC, environment setup.

### Phase 1 — MVP (8–12 weeks)
- Customer: signup/login (OTP), browse, product page, search (basic), cart, checkout, **Razorpay payment + COD**, order tracking, address book.
- Seller: onboarding (manual approval), product CRUD with attributes & variants, image upload, inventory, order handling, basic payouts (manual).
- Admin: seller approval, product moderation, categories/attributes, orders, refunds.
- Shipping: one aggregator (Shiprocket), labels + tracking.
- Notifications: email + SMS for key events. Invoices (PDF).
- Legal pages, basic analytics, Sentry, backups.

### Phase 2 — Growth (3–4 months)
Search engine + filters, reviews/ratings, returns/exchanges, coupons, wishlist, bulk upload, automated settlements/ledger, GST engine/TCS reporting, seller analytics, duplicate media detection, WhatsApp notifications, recommendations, performance tuning, PWA.

### Phase 3 — Scale
Microservice extraction where needed, Kafka, multi-warehouse, advanced fraud/risk, seller ads/sponsored listings, personalisation/ML, mobile apps, multilingual (Tamil/Hindi), loyalty/wallet, international, data warehouse + BI.

**Solo-developer tip:** build in vertical slices (finish "browse → buy → pay → ship" end-to-end before adding extras), keep seller features minimal at first, and launch with a **small set of categories & trusted sellers** to learn before scaling.

---

## 21. Final checklist

**Before development**
- [ ] Business model decided (commission %, fees, payout cycle, return policy)
- [ ] Legal entity, GST registration, bank account, payment gateway KYC started (takes time!)
- [ ] Wireframes + design system approved
- [ ] Category tree + attribute sets for first categories defined
- [ ] Tech stack + hosting chosen

**Before launch**
- [ ] All payment flows tested in sandbox (success/fail/pending/refund/duplicate webhook)
- [ ] Stock concurrency test passed
- [ ] Security review + penetration test; admin MFA enabled
- [ ] Backups + restore tested; monitoring + alerts live
- [ ] Load test passed for expected traffic ×3
- [ ] Policies published (Terms, Privacy, Returns, Seller Agreement, Grievance officer)
- [ ] GST invoice format verified by CA
- [ ] Courier integrations tested for COD + prepaid + returns
- [ ] Email/SMS templates (DLT registered) approved
- [ ] SEO basics (sitemap, robots, structured data) done
- [ ] Customer support process ready

**After launch**
- [ ] Monitor payment success rate, error logs, page speed daily
- [ ] Review seller SLAs, returns, RTO weekly
- [ ] Collect user feedback, iterate with A/B tests
- [ ] Monthly dependency & security updates; quarterly DR drill

---

### Suggested next steps with me
1. Pick the stack (default above) and I can generate the **project folder structure + starter code** (NestJS + Prisma schema + Next.js shell).
2. I can convert Section 7 into a full **Prisma schema / SQL migration**.
3. I can write detailed **API specs (OpenAPI)** for orders, payments, and sellers.
4. I can design the **Figma-style page wireframes** or a React starter UI.

*Document version 1.0 — treat tax/legal/payment-compliance details as guidance and confirm with a CA/lawyer and your payment gateway before launch.*
