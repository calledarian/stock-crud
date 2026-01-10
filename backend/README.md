# Earnings Management System

### Prerequisites

* Node.js installed
* A PostgreSQL database (Render, Supabase, etc.) or local SQLite file

### Environment Setup

Create a `.env` file in the root directory and update the variables with your own credentials:

```env
JWT_SECRET=your_secret_key_here
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=your_password_here

DATABASE_URL=postgres://user:password@host:port/database
FRONTEND_URL=http://localhost:3000

```

### Database Configuration

The application supports both SQLite (for local development) and PostgreSQL (for production/Render).

#### Option A: PostgreSQL (Production / Render)

In `app.module.ts`, use the following configuration to enable SSL for secure cloud connections:

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL, 
  entities: [Earnings, User],
  synchronize: false, // Set to false in production to prevent data loss
  ssl: {
    rejectUnauthorized: false, // Required for Render self-signed certificates
  },
}),

```

#### Option B: SQLite (Local Development)

If you prefer to use a local `data_enriched.db` file, change the `TypeOrmModule` in `app.module.ts` to:

```typescript
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: 'data_enriched.db',
  entities: [Earnings, User], 
  synchronize: true,
}),

```

### Installation and Execution

1. Install dependencies:
```bash
npm install

```


2. Start the application:
```bash
npm run start

```



---

### Important Notes

* **SSL Configuration:** The `rejectUnauthorized: false` setting is necessary for Render’s managed PostgreSQL service as it uses self-signed certificates.
* **Synchronization:** Always set `synchronize: false` when connecting to a production database containing real data to avoid accidental schema overrides.
* **Dependencies:** Ensure you have the `pg` driver installed if switching to PostgreSQL (`npm install pg`).
