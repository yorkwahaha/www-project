import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  applyMigrations,
  createIntegrationPool,
  listTableColumns,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const userId = '11111111-1111-4111-8111-111111111111';

describe('Phase 66B user profile PostgreSQL schema', () => {
  const pool = createIntegrationPool();

  beforeAll(async () => {
    await applyMigrations();
  });

  beforeEach(async () => {
    await truncateBusinessTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('adds minimal user-scoped profile columns only', async () => {
    expect(await listTableColumns(pool, 'users')).toEqual([
      'id',
      'display_name',
      'trust_level',
      'status',
      'created_at',
      'updated_at',
      'birth_year_month',
      'residential_region',
    ]);
  });

  it('enforces month granularity and bounded normalized region values', async () => {
    await expect(
      pool.query(
        `INSERT INTO users (id, display_name, birth_year_month, residential_region)
         VALUES ($1, 'Profile', DATE '2000-05-15', 'TW-KHH')`,
        [userId],
      ),
    ).rejects.toMatchObject({ constraint: 'users_birth_year_month_check' });

    await expect(
      pool.query(
        `INSERT INTO users (id, display_name, birth_year_month, residential_region)
         VALUES ($1, 'Profile', DATE '2000-05-01', ' TW-KHH ')`,
        [userId],
      ),
    ).rejects.toMatchObject({ constraint: 'users_residential_region_check' });

    await expect(
      pool.query(
        `INSERT INTO users (id, display_name, birth_year_month, residential_region)
         VALUES ($1, 'Profile', DATE '2000-05-01', 'TW-KHH')`,
        [userId],
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
  });
});
