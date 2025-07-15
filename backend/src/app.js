// backend/src/app.js
import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import userRoutes from "./routes/userRoutes.js"
import tripRoutes from "./routes/tripRoutes.js"
import transportDataRoutes from "./routes/transportDataRoutes.js" // Importa las nuevas rutas
import { query } from "./config/database.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(express.json())

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
}
app.use(cors(corsOptions))

// Rutas
app.use("/api/users", userRoutes)
app.use("/api/trips", tripRoutes)
app.use("/api/data", transportDataRoutes) // Usa las nuevas rutas de datos de transporte

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Backend de EcoTransport funcionando!")
})

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`)
  query("SELECT NOW()")
    .then((res) => console.log("Conexión a DB exitosa:", res.rows[0].now))
    .catch((err) => console.error("Error al conectar a la DB:", err.message))
})
