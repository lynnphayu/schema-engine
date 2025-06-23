# API Testing Guide

## Health Check

Test the health check endpoint:

```bash
curl -X GET http://localhost:3000/health
```

Expected response:

```json
{ "status": "healthy" }
```

## Schema Generation

Test the schema generation endpoint with a sample schema:

```bash
curl -X POST http://localhost:3000/schema/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userID": "test123",
    "schema": {
      "tables": [
        {
          "name": "users",
          "columns": [
            {
              "name": "id",
              "type": "serial",
              "primaryKey": true
            },
            {
              "name": "email",
              "type": "varchar",
              "unique": true
            },
            {
              "name": "created_at",
              "type": "timestamp",
              "default": "current_timestamp"
            }
          ]
        }
      ]
    }
  }'
```

Expected response:

```json
{
  "message": "Successfully generated schema for user test123",
  "files": {
    "schema": "<path>/generated/test123/schema.ts",
    "migration": "<path>/generated/test123/migrate.sql",
    "config": "<path>/drizzle.config.ts"
  }
}
```

### Error Cases

1. Missing required fields:

```bash
curl -X POST http://localhost:3000/schema/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:

```json
{ "error": "Missing required fields: userID and schema" }
```
