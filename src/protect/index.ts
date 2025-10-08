import 'dotenv/config'
import { db } from './db'
import { usersTable } from './db/schema'
import { protectClient } from './protect'

const data = await db
  .select({
    encrypted_email: usersTable.encrypted_email,
    encrypted_dob: usersTable.encrypted_dob,
    encrypted_salary: usersTable.encrypted_salary,
  })
  .from(usersTable)

const result = await protectClient.bulkDecryptModels(data)

if (result.failure) {
  throw new Error(result.failure.message)
}

console.log(result.data)
