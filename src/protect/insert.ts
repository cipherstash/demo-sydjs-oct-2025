import { db } from './db'
import { protectClient, users } from './protect'
import { usersTable } from './db/schema'

if (process.argv.length < 5) {
  console.error(
    'Usage: pnpm run postgres:protect:insert <email> <dob> <salary>',
  )
  process.exit(1)
}

const user = {
  encrypted_email: process.argv[2],
  encrypted_dob: process.argv[3],
  encrypted_salary: process.argv[4],
}

const encryptedUser = await protectClient.encryptModel(user, users)

if (encryptedUser.failure) {
  throw new Error(encryptedUser.failure.message)
}

console.log('Encrypted user:', encryptedUser.data)

console.log('Inserting user into database...')

const data = await db
  .insert(usersTable)
  .values({
    encrypted_email: encryptedUser.data.encrypted_email,
    encrypted_dob: encryptedUser.data.encrypted_dob,
    encrypted_salary: encryptedUser.data.encrypted_salary,
  })
  .returning()

console.log('Inserted user:', data[0].id)
