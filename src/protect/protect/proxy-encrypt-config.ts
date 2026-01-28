import 'dotenv/config'
import { buildEncryptConfig } from '@cipherstash/schema'
import { users } from './index'
import { Client } from 'pg'

const encryptConfig = JSON.parse(
  JSON.stringify(buildEncryptConfig(users)).replace(/"cast_as":\s*"string"/g, '"cast_as": "text"')
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

    // Check if users table exists
    console.log('Checking if users table exists...')
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'users' AND table_schema = 'public'
    `)

    if (tableCheck.rows.length === 0) {
      // Create the users table with all encrypted columns
      console.log('Creating users table with encrypted columns...')
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          encrypted_email eql_v2_encrypted,
          encrypted_dob eql_v2_encrypted,
          encrypted_salary eql_v2_encrypted,
          encrypted_jsonb eql_v2_encrypted
        )
      `)
      console.log('Created users table with encrypted columns')

      // The below can be uncommented if you want to add search configurations without the Protect SDK integration

      // Add search configurations for each encrypted column
      console.log('Adding search configurations...')

      await client.query(`SELECT eql_v2.add_search_config(
        'users',
        'encrypted_email',
        'unique',
        'text'
      );`)
      console.log('Added search config for encrypted_email')

      await client.query(`SELECT eql_v2.add_search_config(
        'users',
        'encrypted_dob',
        'unique',
        'text'
      );`)
      console.log('Added search config for encrypted_dob')

      await client.query(`SELECT eql_v2.add_search_config(
        'users',
        'encrypted_salary',
        'unique',
        'text'
      );`)
      console.log('Added search config for encrypted_salary')

      await client.query(`SELECT eql_v2.add_search_config(
        'users',
        'encrypted_jsonb',
        'ste_vec',
        'jsonb',
        '{"prefix": "users/encrypted_jsonb"}'
      );`)
      console.log('Added search config for encrypted_jsonb')
    } else {
      console.log(
        'The users table already exists, skipping the setup. You should be good to run the demo app now!',
      )
    }

    //     Table "public.eql_v2_configuration"
    //    Column   |            Type            | Collation | Nullable |                Default                | Storage  | Compression | Stats target | Description
    // ------------+----------------------------+-----------+----------+---------------------------------------+----------+-------------+--------------+-------------
    //  id         | bigint                     |           | not null | generated always as identity          | plain    |             |              |
    //  state      | eql_v2_configuration_state |           | not null | 'pending'::eql_v2_configuration_state | plain    |             |              |
    //  data       | jsonb                      |           |          |                                       | extended |             |              |
    //  created_at | timestamp with time zone   |           | not null | CURRENT_TIMESTAMP                     | plain    |             |              |
    console.log('Updating eql_v2_configuration...')
    const setInactive = await client.query(`
      UPDATE eql_v2_configuration SET state = 'inactive'
    `)

    // Create the users table with all encrypted columns
    console.log('Inserting eql_v2_configuration...')
    await client.query(
      `
        INSERT INTO eql_v2_configuration (state, data) VALUES ('active', $1)
      `,
      [encryptConfig],
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
