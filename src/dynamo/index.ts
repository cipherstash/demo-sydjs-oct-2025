import 'dotenv/config'
import { protect, csColumn, csTable } from '@cipherstash/protect'
import { protectDynamoDB } from '@cipherstash/protect-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'

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

// Create and store a user using both CipherStash encryption and raw AWS SDK
async function createAndStoreUser() {
  try {
    // First, encrypt the user data with CipherStash
    const userData = {
      id: 'user-1',
      name: 'John Doe',
      email: 'user@example.com',
    }

    const encryptResult = await protectDynamo.encryptModel(userData, users)

    const r = await protectClient.encryptModel(userData, users)

    if (r.failure) {
      throw new Error(`Failed to encrypt user: ${r.failure.message}`)
    }

    console.log(
      'Raw encrypted user data used for other databases, such as Postgres:',
      r.data,
    )

    if (encryptResult.failure) {
      throw new Error(
        `Failed to encrypt user: ${encryptResult.failure.message}`,
      )
    }

    console.log('User encrypted:', encryptResult.data)

    // Save the encrypted data to DynamoDB using raw AWS SDK
    const putCommand = new PutCommand({
      TableName: 'users',
      Item: encryptResult.data,
    })

    await docClient.send(putCommand)
    console.log('User saved to DynamoDB successfully!')

    // Retrieve the user to verify it was saved
    const getCommand = new GetCommand({
      TableName: 'users',
      Key: { id: 'user-1' },
    })

    const result = await docClient.send(getCommand)
    console.log('Retrieved encrypted user data:', result.Item)

    // Decrypt the data to verify it works
    if (result.Item) {
      const decryptResult = await protectDynamo.decryptModel(result.Item, users)
      if (decryptResult.failure) {
        throw new Error(decryptResult.failure.message)
      }

      console.log('Decrypted user data:', decryptResult.data)
    }
  } catch (error) {
    console.error('Error creating and storing user:', error)
  }
}

// Run the example
await createAndStoreUser()
