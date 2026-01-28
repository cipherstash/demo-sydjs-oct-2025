import 'dotenv/config'
import type { Encrypted } from '@cipherstash/protect'
import { db } from './db'
import { jsonUsersTable } from './db/schema'
import { protectClient, jsonUsers } from './protect'
import { sql } from 'drizzle-orm'

// Create the json_users table if not exists
await db.execute(sql`
  CREATE TABLE IF NOT EXISTS json_users (
    id SERIAL PRIMARY KEY,
    encrypted_metadata eql_v2_encrypted
  )
`)

// Add ste_vec search config if not exists
try {
  await db.execute(sql`
    SELECT eql_v2.add_search_config(
      'json_users',
      'encrypted_metadata',
      'ste_vec',
      'jsonb',
      '{"prefix": "json_users/encrypted_metadata"}'
    )
  `)
} catch (e: any) {
  // Ignore "already exists" errors
  if (!e.cause?.message?.includes('index exists')) {
    throw e
  }
}

console.log('Table and search config ready')

// Insert sample user with JSON metadata
const sampleMetadata = { email: 'demo@test.com', role: 'admin' }

const encrypted = await protectClient.encrypt(sampleMetadata, {
  column: jsonUsers.encrypted_metadata,
  table: jsonUsers,
})

if (encrypted.failure) {
  throw new Error(encrypted.failure.message)
}

const inserted = await db.insert(jsonUsersTable).values({
  encrypted_metadata: encrypted.data,
}).returning()

console.log('Inserted sample user with id:', inserted[0]?.id)

// Verify data exists
const allRows = await db.execute(sql`SELECT id FROM json_users`)
console.log('Total rows in table:', allRows.rows.length)

// Get email to search from CLI
const searchEmail = process.argv[2] || 'demo@test.com'

console.log(`\nSearching for email: "${searchEmail}"`)

// Create encrypted search term using JSON PATH query
const searchTerm = await protectClient.encryptQuery([{
  path: 'email',
  value: searchEmail,
  column: jsonUsers.encrypted_metadata,
  table: jsonUsers,
}])

if (searchTerm.failure) {
  throw new Error(searchTerm.failure.message)
}

const term = searchTerm.data[0]
console.log('Encrypted term:', JSON.stringify(term).slice(0, 100) + '...')

// Query using @> operator for JSON path containment
const results = await db.execute(sql`
  SELECT id, encrypted_metadata
  FROM json_users
  WHERE encrypted_metadata @> ${JSON.stringify(term)}::jsonb::eql_v2_encrypted
`)

console.log(`\nFound ${results.rows.length} result(s)`)

// Decrypt and display results
for (const row of results.rows as any[]) {
  const decrypted = await protectClient.decrypt(row.encrypted_metadata as Encrypted)
  if (!decrypted.failure) {
    console.log(`ID: ${row.id}, Metadata:`, decrypted.data)
  }
}

db.$client.end()
