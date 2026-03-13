import * as schema from './schema';

let db: any;

// Initialize db based on environment
if (typeof Bun !== 'undefined') {
  // We're in Bun runtime - use real database
  try {
    const { drizzle } = await import('drizzle-orm/bun-sqlite');
    const { Database } = await import('bun:sqlite');
    const sqlite = new Database('todo.db');
    db = drizzle(sqlite, { schema });
  } catch (error) {
    console.warn('Failed to initialize bun:sqlite database:', error);
    db = createMockDb();
  }
} else {
  // We're in Node.js (build environment) - use mock database
  console.warn('Not in Bun environment, using mock database for build');
  db = createMockDb();
}

function createMockDb() {
  return {
    select: () => ({
      from: () => ({
        limit: () => Promise.resolve([]),
        // Add other methods as needed for compatibility
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([{ id: 'mock-id' }])
      })
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve()
      })
    }),
    delete: () => ({
      where: () => Promise.resolve()
    })
  };
}

export { db };
