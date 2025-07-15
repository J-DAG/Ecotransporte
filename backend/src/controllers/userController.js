// backend/src/controllers/userController.js
import { query } from "../config/database.js"
// import bcrypt from 'bcrypt'; // Descomentar para hasheo de contraseñas en producción

export const registerUser = async (req, res) => {
  const { nombres, apellidos, email, password } = req.body

  if (!nombres || !apellidos || !email || !password) {
    return res.status(400).json({ message: "Todos los campos son obligatorios." })
  }

  try {
    // 1. Verificar si el email ya existe
    const existingUser = await query("SELECT id_usuario FROM usuario WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "El email ya está registrado." })
    }

    // 2. Hashear la contraseña (¡IMPORTANTE para producción!)
    // const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPassword = password // Por ahora, sin hasheo real para simplificar la demo

    // 3. Insertar nuevo usuario
    const result = await query(
      "INSERT INTO usuario (nombres, apellidos, email, password_hash, tipo_usuario) VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario, nombres, apellidos, email, tipo_usuario",
      [nombres, apellidos, email, hashedPassword, "viajero"],
    )

    const newUser = result.rows[0]
    res.status(201).json({ message: "Usuario registrado exitosamente", user: newUser })
  } catch (error) {
    console.error("Error al registrar usuario:", error)
    res.status(500).json({ message: "Error interno del servidor." })
  }
}

export const loginUser = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son obligatorios." })
  }

  try {
    // 1. Buscar usuario por email
    const result = await query("SELECT * FROM usuario WHERE email = $1", [email])
    const user = result.rows[0]

    if (!user) {
      return res.status(400).json({ message: "Credenciales inválidas." })
    }

    // 2. Comparar contraseña (¡IMPORTANTE para producción, usar bcrypt.compare!)
    // const isMatch = await bcrypt.compare(password, user.password_hash);
    const isMatch = password === user.password_hash // Por ahora, comparación simple

    if (!isMatch) {
      return res.status(400).json({ message: "Credenciales inválidas." })
    }

    // 3. Login exitoso
    // En un proyecto real, aquí generarías un JWT (JSON Web Token)
    res.status(200).json({
      message: "Login exitoso",
      user: {
        id: user.id_usuario,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        type: user.tipo_usuario,
      },
      // token: 'tu_jwt_aqui' // Si usas JWT
    })
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    res.status(500).json({ message: "Error interno del servidor." })
  }
}
