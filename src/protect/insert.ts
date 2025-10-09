import { db } from './db'
import { protectClient, users } from './protect'
import { usersTable } from './db/schema'
import * as fs from 'fs'
import * as path from 'path'

// Parse CSV file content
function parseCSV(content: string): Array<{ email: string; dob: string; salary: string }> {
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  
  // Validate headers
  if (!headers.includes('email') || !headers.includes('dob') || !headers.includes('salary')) {
    throw new Error('CSV file must contain headers: email, dob, salary')
  }
  
  const emailIndex = headers.indexOf('email')
  const dobIndex = headers.indexOf('dob')
  const salaryIndex = headers.indexOf('salary')
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    return {
      email: values[emailIndex],
      dob: values[dobIndex],
      salary: values[salaryIndex]
    }
  })
}

// Process users data (either from CLI args or CSV file)
async function processUsers(usersData: Array<{ email: string; dob: string; salary: string }>) {
  const insertedIds = []
  
  for (const userData of usersData) {
    const user = {
      encrypted_email: userData.email,
      encrypted_dob: userData.dob,
      encrypted_salary: userData.salary,
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
    insertedIds.push(data[0].id)
  }
  
  return insertedIds
}

// Check if CSV file argument is provided
if (process.argv.length >= 3 && process.argv[2] === '--csv') {
  if (process.argv.length < 4) {
    console.error('Usage: pnpm run postgres:protect:insert --csv <csv-file-path>')
    process.exit(1)
  }
  
  const csvFilePath = process.argv[3]
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`)
    process.exit(1)
  }
  
  try {
    const csvContent = fs.readFileSync(csvFilePath, 'utf8')
    const usersData = parseCSV(csvContent)
    
    if (usersData.length === 0) {
      console.error('No user data found in CSV file')
      process.exit(1)
    }
    
    console.log(`Processing ${usersData.length} user(s) from CSV file...`)
    const insertedIds = await processUsers(usersData)
    console.log(`Successfully inserted ${insertedIds.length} user(s) with IDs:`, insertedIds)
  } catch (error) {
    console.error('Error processing CSV file:', error)
    process.exit(1)
  }
} else {
  // Original CLI argument handling
  if (process.argv.length < 5) {
    console.error(
      'Usage: pnpm run postgres:protect:insert <email> <dob> <salary>\n' +
      '   or: pnpm run postgres:protect:insert --csv <csv-file-path>'
    )
    process.exit(1)
  }
  
  const usersData = [{
    email: process.argv[2],
    dob: process.argv[3],
    salary: process.argv[4]
  }]
  
  await processUsers(usersData)
}
