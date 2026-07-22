import { Client } from 'pg'

async function run() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_g4pKMWyRbEc9@ep-wispy-sound-ascuczxo-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require"
  })
  try {
    console.log("Connecting...")
    await client.connect()
    console.log("Connected successfully!")
    const res = await client.query('SELECT NOW()')
    console.log("Query result:", res.rows[0])
    await client.end()
  } catch (err) {
    console.error("Connection failed:", err)
  }
}

run()
