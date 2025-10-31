# Server Database Setup Instructions

## Option 1: Run SQL Migration File (Recommended)

If you have the `voxe_init.sql` file on the server, run:

```bash
# Inside the container (voxe_app)
psql -h postgres -U postgres -d voxe -f /app/prisma/migrations/voxe_init.sql
```

Or from outside the container:

```bash
# On the server host
docker exec -i voxe_postgres psql -U postgres -d voxe < prisma/migrations/voxe_init.sql
```

## Option 2: Use Prisma DB Push (Sync Schema)

This will sync your schema.prisma to the database:

```bash
# Inside the container (voxe_app)
npx prisma db push
```

**Warning**: This will modify existing tables if they don't match. Use with caution if you have data.

## Option 3: Create Prisma Migration and Apply

Generate a new migration based on your schema:

```bash
# Inside the container (voxe_app)
npx prisma migrate dev --name init
```

Then apply it:

```bash
npx prisma migrate deploy
```

## Check Current Database State

To see what tables exist:

```bash
# Inside container
psql -h postgres -U postgres -d voxe -c "\dt"
```

Or using Prisma Studio (visual database browser):

```bash
# Inside container
npx prisma studio --port 5555 --hostname 0.0.0.0
```

