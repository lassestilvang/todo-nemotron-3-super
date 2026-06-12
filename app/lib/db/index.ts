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
  // Create a mock query builder that supports method chaining
  const createMockQueryBuilder = (fields: any, table: any) => {
    // Define the shape of our mock query builder
    const mockQueryBuilder: any = {
      _fields: fields,
      _table: table,
      _whereConditions: [] as any[],
      _orderByClause: null as any,
      _joins: [] as any[],
      _data: [] as any[],

      where: (condition: any) => {
        mockQueryBuilder._whereConditions.push(condition);
        return mockQueryBuilder;
      },

      orderBy: (clause: any) => {
        mockQueryBuilder._orderByClause = clause;
        return mockQueryBuilder;
      },

      leftJoin: (table: any, condition: any) => {
        mockQueryBuilder._joins.push({ type: 'LEFT JOIN', table, condition });
        return mockQueryBuilder;
      },

      innerJoin: (table: any, condition: any) => {
        mockQueryBuilder._joins.push({ type: 'INNER JOIN', table, condition });
        return mockQueryBuilder;
      },

      execute: () => {
        return Promise.resolve(mockQueryBuilder._data.length > 0 ? mockQueryBuilder._data : [
          {
            id: 'mock-task-1',
            name: 'Mock Task',
            description: 'This is a mock task',
            date: null,
            deadline: null,
            priority: 'none',
            completed: false,
            recurrence: null,
            listId: 'mock-list-1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            list: {
              id: 'mock-list-1',
              name: 'Mock List',
              color: 'bg-gray-500',
              emoji: '🔲',
            }
          }
        ]);
      }
    };

    return mockQueryBuilder;
  };

  return {
    select: (fields?: any) => {
      return {
        from: (table: any) => {
          const qb = createMockQueryBuilder(fields, table);
          qb._table = table;
          return qb;
        }
      };
    },
    insert: (table: any) => ({
      values: (data: any) => ({
        returning: () => Promise.resolve([{ id: 'mock-id', ...data }])
      })
    }),
    update: (table: any) => ({
      set: (data: any) => ({
        where: (condition: any) => Promise.resolve([{ ...data }])
      })
    }),
    delete: (table: any) => ({
      where: (condition: any) => Promise.resolve({ affectedRows: 1 })
    })
  };
}

export { db };
