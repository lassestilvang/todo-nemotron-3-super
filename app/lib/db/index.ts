import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

// Create a SQLite database file in the root of the project
const sqlite = new Database('todo.db');
export const db = drizzle(sqlite, { schema });
