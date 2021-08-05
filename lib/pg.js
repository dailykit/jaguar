require('dotenv').config()
import { Client } from 'pg'

export const dbClient = new Client({
   user: process.env.PGUSER,
   host: process.env.PGHOST,
   database: process.env.PGDATABASE,
   password: process.env.PGPASSWORD,
   port: process.env.PGPORT
})
