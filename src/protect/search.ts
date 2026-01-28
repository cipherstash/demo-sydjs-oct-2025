import 'dotenv/config'
import { db } from './db'
import { usersTable } from './db/schema'
import { protectClient, users } from './protect'
import { eq, like } from 'drizzle-orm'

if (process.argv.length < 3) {
  console.error('Usage: pnpm run postgres:protect:search <email>')
  process.exit(1)
}

const searchEmail = process.argv[2]

console.log(`Searching for user with email: ${searchEmail}`)

// Generate encrypted search term for equality search
const searchTerm = await protectClient.createSearchTerms([
  {
    value: searchEmail,
    column: users.encrypted_email,
    table: users,
    returnType: 'composite-literal',
  },
])

if (searchTerm.failure || !searchTerm.data[0]) {
  throw new Error(searchTerm?.failure?.message || 'Failed to generate search term')
}

console.log('Search term:', searchTerm.data)

console.log('Generated encrypted search term')

// Query database using the encrypted search term
const results = await db
  .select({
    id: usersTable.id,
    encrypted_email: usersTable.encrypted_email,
    encrypted_dob: usersTable.encrypted_dob,
    encrypted_salary: usersTable.encrypted_salary,
  })
  .from(usersTable)
  //.where(eq(usersTable.encrypted_email, searchTerm.data[0]))
  .where(like(usersTable.encrypted_email, String(searchTerm.data[0])))

console.log('Results:', results)

// console.log(`Found ${results.length} result(s)`)

// if (results.length === 0) {
//   console.log('No users found with that email')
//   process.exit(0)
// }

// Decrypt the results
const decrypted = await protectClient.bulkDecryptModels(results)

if (decrypted.failure) {
  throw new Error(decrypted.failure.message)
}

console.log('\nDecrypted results:')
console.log(JSON.stringify(decrypted.data, null, 2))

db.$client.end()
