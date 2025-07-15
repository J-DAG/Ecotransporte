// backend/src/config/database.js
import pg from "pg"
import dotenv from "dotenv"

dotenv.config() // Carga las variables de entorno desde .env
/*
const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number.parseInt(process.env.DB_PORT || "5432", 10),
  // ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Descomentar si usas un servicio con SSL (ej. Supabase, Neon)
})
  */

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Descomentar si usas un servicio con SSL (ej. Supabase, Neon)
})

pool.on("error", (err, client) => {
  console.error("Error inesperado en el cliente de PostgreSQL", err)
  process.exit(-1)
})

export const query = (text, params) => pool.query(text, params)

console.log("Conexión a PostgreSQL configurada.")
