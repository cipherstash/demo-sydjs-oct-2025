import { csColumn, csTable, protect } from '@cipherstash/protect'

export const users = csTable('users', {
  encrypted_email: csColumn('encrypted_email').equality().freeTextSearch().orderAndRange(),
  encrypted_dob: csColumn('encrypted_dob').equality(),
  encrypted_salary: csColumn('encrypted_salary').equality(),
  encrypted_jsonb: csColumn('encrypted_jsonb').equality(),
})

export const jsonUsers = csTable('json_users', {
  encrypted_metadata: csColumn('encrypted_metadata').searchableJson(),
})

export const protectClient = await protect({
  schemas: [users, jsonUsers],
})
