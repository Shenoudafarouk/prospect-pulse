# Database Migrations

This project uses TypeORM 0.3+ migrations with a standalone `DataSource` config.

## Prerequisites

- PostgreSQL running (via `docker compose up -d`)
- `.env` file with DB credentials (copy from `.env.example`)

## Commands

```bash
# Generate a new migration from entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Run all pending migrations
npm run migration:run

# Revert the last executed migration
npm run migration:revert
```

## How It Works

All three scripts run `npm run build` first, then execute the TypeORM CLI against the compiled `dist/database/data-source.js`. This avoids ts-node compatibility issues with the project's `nodenext` module resolution.

- **Data source**: `src/database/data-source.ts` (standalone, uses `dotenv` directly)
- **Migration files**: `src/database/migrations/*.ts`
- **Entity source of truth**: entity files in each module's `entities/` directory

## Workflow

1. Modify entity files
2. Run `npm run migration:generate -- src/database/migrations/DescriptiveName`
3. Review the generated migration in `src/database/migrations/`
4. Run `npm run migration:run`
