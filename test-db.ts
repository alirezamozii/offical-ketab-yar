import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

async function run() {
  const url = process.env.DATABASE_URL
  console.log("Testing process.env.DATABASE_URL:", url)
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
  try {
    await client.connect()
    console.log("CONNECTED SUCCESSFULLY TO DATABASE!")
    const res = await client.query('SELECT NOW()')
    console.log("Query result:", res.rows[0])
    await client.end()
  } catch (err) {
    console.error("Database connection failed:", err)
  }
}

run()
