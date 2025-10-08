import 'dotenv/config'
import { protect, csColumn, csTable } from '@cipherstash/protect'
import { protectDynamoDB } from '@cipherstash/protect-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'

const users = csTable('users', {
  name: csColumn('name').equality().freeTextSearch(),
  email: csColumn('email').equality(),
})

// Set up DynamoDB client for local development
const dynamoClient = new DynamoDBClient({
  region: 'us-west-2',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'DUMMYIDEXAMPLE',
    secretAccessKey: 'DUMMYEXAMPLEKEY',
  },
})

// Create document client for easier operations
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const protectClient = await protect({
  schemas: [users],
})

// Create the DynamoDB helper instance
const protectDynamo = protectDynamoDB({
  protectClient,
})

// Search for a user by email
async function searchUserByEmail(email: string) {
  try {
    console.log(`Searching for user with email: ${email}`)

    // Create search terms for the email column
    const searchTermsResult = await protectDynamo.createSearchTerms([
      {
        value: email,
        column: users.email,
        table: users,
      },
    ])

    if (searchTermsResult.failure) {
      throw new Error(
        `Failed to create search terms: ${searchTermsResult.failure.message}`,
      )
    }

    const [emailHmac] = searchTermsResult.data

    // Use the search term to query DynamoDB
    const scanCommand = new ScanCommand({
      TableName: 'users',
      FilterExpression: 'contains(email__hmac, :email__hmac)',
      ExpressionAttributeValues: {
        ':email__hmac': emailHmac,
      },
    })

    const result = await docClient.send(scanCommand)

    if (!result.Items || result.Items.length === 0) {
      console.log('No users found with that email address.')
      return
    }

    console.log(`Found ${result.Items.length} user(s) with email: ${email}`)

    // Decrypt and display each found user
    for (const item of result.Items) {
      const decryptResult = await protectDynamo.decryptModel(item, users)
      if (decryptResult.failure) {
        console.error(
          'Failed to decrypt user data:',
          decryptResult.failure.message,
        )
        continue
      }

      console.log('User found:', decryptResult.data)
    }
  } catch (error) {
    console.error('Error searching for user:', error)
  }
}

// Get command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: npm run search-user <email>')
  console.error('Example: npm run search-user user@example.com')
  process.exit(1)
}

const email = args[0]

if (!email) {
  console.error('Please provide an email address to search for.')
  process.exit(1)
}

// Run the search
await searchUserByEmail(email)
