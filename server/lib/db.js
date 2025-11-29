import { MongoClient, ServerApiVersion } from 'mongodb';

let client;
let database;

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'contesthub';

export async function connectToDatabase() {
  if (database) {
    return database;
  }
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your environment variables.');
  }

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  database = client.db(dbName);
  return database;
}

export function getDb() {
  if (!database) {
    throw new Error('Database has not been initialized. Call connectToDatabase() first.');
  }
  return database;
}

export function getCollection(name) {
  return getDb().collection(name);
}

export async function disconnectFromDatabase() {
  if (client) {
    await client.close();
    client = undefined;
    database = undefined;
  }
}
