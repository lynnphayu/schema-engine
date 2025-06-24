# Schema Engine

A TypeScript-based service for generating, and managing database schemas with Drizzle ORM. This service allows you to dynamically create database schemas from JSON definitions and apply migrations to PostgreSQL databases.

## Features

- **Schema Generation**: Convert JSON schema definitions to Drizzle ORM TypeScript code
- **Database Migrations**: Apply generated migrations to PostgreSQL databases


## API Endpoints

### Schema Generation
```http
POST /schema/generate/:tenantId
Content-Type: application/json

{
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
            "type": "varchar(255)"
          }
        ]
      }
    ]
  }
}
```

### Database Migration
```http
POST /schema/migrate/:tenantId
```



## License

MIT License - see LICENSE file for details 