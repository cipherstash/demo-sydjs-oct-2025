import { Client } from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function connectToCipherStash() {
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

    // Execute the SELECT * FROM users query
    console.log('Executing SELECT * FROM users query...')
    const result = await client.query('SELECT * FROM users')

    console.log('Query executed successfully!')
    console.log('Number of rows:', result.rows.length)
    if (result.rows.length === 0) {
      console.log('No users found.')
    } else {
      console.log('Users:')
      for (const row of result.rows) {
        // Print out the user data as inserted by insert-user.ts
        // The relevant data is in the encrypted_jsonb column (as JSON string)
        if (row.encrypted_jsonb) {
          try {
            const user =
              typeof row.encrypted_jsonb === 'string'
                ? JSON.parse(row.encrypted_jsonb)
                : row.encrypted_jsonb
            console.log(
              `- Email: ${user.email}, Date of Birth: ${user.dateOfBirth}, Salary: ${user.salary}`,
            )
          } catch (e) {
            console.log('- Could not parse user JSON:', row.encrypted_jsonb)
          }
        } else {
          // Fallback: print the row as is
          console.log('- Row:', row)
        }
      }
    }
  } catch (error) {
    console.error('Error connecting to database or executing query:', error)
  } finally {
    client.end()
    console.log('Connection closed.')
    process.exit(0)
  }
}

// Run the connection
connectToCipherStash()
