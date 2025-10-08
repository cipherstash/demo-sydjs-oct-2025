import 'dotenv/config'
import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb'

// Set up DynamoDB client for local development
const dynamoClient = new DynamoDBClient({
  region: 'us-west-2', // Use any region; it's ignored by DynamoDB Local
  endpoint: 'http://localhost:8000', // URL of the local DynamoDB instance
  credentials: {
    accessKeyId: 'DUMMYIDEXAMPLE', // Dummy credentials for local development
    secretAccessKey: 'DUMMYEXAMPLEKEY',
  },
})

async function createUsersTable() {
  const command = new CreateTableCommand({
    TableName: 'users',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }, // 'S' indicates a string
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  })

  try {
    await dynamoClient.send(command)
    console.log('Table "users" created successfully.')
    // biome-ignore lint/suspicious/noExplicitAny: Errors
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log('Table "users" already exists.')
    } else {
      console.error('Error creating table:', error)
    }
  }
}

// Run the table creation
await createUsersTable()
