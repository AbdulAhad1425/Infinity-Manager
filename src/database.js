import pg from 'pg';
const { Pool } = pg;

let pool = null;
export function initDatabase() {
  if (!process.env.DATABASE_URL) return null;
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  return pool.query(`CREATE TABLE IF NOT EXISTS guild_settings (guild_id TEXT PRIMARY KEY, settings JSONB NOT NULL DEFAULT '{}'::jsonb)`).catch(console.error);
}
export async function getGuildSettings(guildId) {
  if (!pool) return {};
  const result = await pool.query('SELECT settings FROM guild_settings WHERE guild_id=$1', [guildId]);
  return result.rows[0]?.settings ?? {};
}
export async function saveGuildSettings(guildId, settings) {
  if (!pool) return;
  await pool.query(`INSERT INTO guild_settings (guild_id, settings) VALUES ($1,$2) ON CONFLICT (guild_id) DO UPDATE SET settings=$2`, [guildId, JSON.stringify(settings)]);
}
