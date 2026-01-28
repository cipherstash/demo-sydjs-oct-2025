import 'dotenv/config'
import { buildEncryptConfig } from '@cipherstash/schema'
import { users } from './index'
import { Client } from 'pg'

const encryptConfig = buildEncryptConfig(users)
// After line 6, add:
const fixedConfig = JSON.parse(
  JSON.stringify(encryptConfig).replace(/"cast_as":\s*"string"/g, '"cast_as": "text"')
);


async function connectToCipherStash() {
  // Connection configuration for CipherStash proxy
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'password',
  })

  try {
    console.log('Connecting to Postgres...')
    await client.connect()
    console.log('Successfully connected to Postgres!')

    //     Table "public.eql_v2_configuration"
    //    Column   |            Type            | Collation | Nullable |                Default                | Storage  | Compression | Stats target | Description
    // ------------+----------------------------+-----------+----------+---------------------------------------+----------+-------------+--------------+-------------
    //  id         | bigint                     |           | not null | generated always as identity          | plain    |             |              |
    //  state      | eql_v2_configuration_state |           | not null | 'pending'::eql_v2_configuration_state | plain    |             |              |
    //  data       | jsonb                      |           |          |                                       | extended |             |              |
    //  created_at | timestamp with time zone   |           | not null | CURRENT_TIMESTAMP                     | plain    |             |              |
    console.log('Updating eql_v2_configuration...')
    const tableCheck = await client.query(`
      UPDATE eql_v2_configuration SET state = 'inactive'
    `)

    // Create the users table with all encrypted columns
    console.log('Inserting eql_v2_configuration...')
    await client.query(
      `
        INSERT INTO eql_v2_configuration (state, data) VALUES ('active', $1)
      `,
      [fixedConfig],
    )
    console.log('Updated eql_v2_configuration')
  } catch (error) {
    console.error('Error connecting to Postgres or executing query:', error)
  } finally {
    client.end()
    console.log('Connection to Postgres closed.')
    process.exit(0)
  }
}

// Run the connection
connectToCipherStash()
