import { Client } from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface UserData {
  email: string
  dateOfBirth: string
  salary: string
}

function parseCommandLineArgs(): UserData {
  const args = process.argv.slice(2)

  if (args.length !== 3) {
    console.error('Usage: pnpm run insert-user <email> <dateOfBirth> <salary>')
    console.error(
      'Example: pnpm run insert-user john@example.com 1990-01-15 75000',
    )
    process.exit(1)
  }

  const [email, dateOfBirth, salary] = args

  // Basic validation
  if (!email || !dateOfBirth || !salary) {
    console.error(
      'Error: All arguments (email, dateOfBirth, salary) are required',
    )
    process.exit(1)
  }

  return {
    email,
    dateOfBirth,
    salary,
  }
}

async function insertUser(userData: UserData) {
  // Connection configuration for CipherStash proxy
  const client = new Client({
    host: 'localhost',
    port: 6432, // CipherStash proxy port from docker-compose.yaml
    database: 'postgres',
    user: 'postgres',
    password: 'password',
  })

  try {
    console.log('Connecting to CipherStash proxy...')
    await client.connect()
    console.log('Successfully connected to CipherStash proxy!')

    // Create the JSON data to be encrypted
    const userJson = {
      email: userData.email,
      dateOfBirth: userData.dateOfBirth,
      salary: userData.salary,
    }

    console.log('Inserting user with data:', userJson)

    // Insert the user with encrypted JSONB data
    const result = await client.query(
      'INSERT INTO users (encrypted_email, encrypted_dob, encrypted_salary, encrypted_jsonb) VALUES ($1, $2, $3, $4)',
      [
        userData.email,
        userData.dateOfBirth,
        userData.salary,
        JSON.stringify(userJson),
      ],
    )

    console.log('Successfully inserted user!')
    console.log(
      'User data has been encrypted and stored in the encrypted_jsonb column',
    )
  } catch (error) {
    console.error('Error connecting to database or inserting user:', error)
    process.exit(1)
  } finally {
    client.end()
    console.log('Connection closed.')
    process.exit(0)
  }
}

// Parse command line arguments
const userData = parseCommandLineArgs()

// Insert the user
insertUser(userData)
