// Instantiates and exports the single PrismaClient database connection.
// Used across all controllers and services to query PostgreSQL via Prisma ORM.
// Ensures connection pool sharing and clean database access across the backend.

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
