"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  nombres: string
  apellidos: string
  email: string
  type: "traveler" | "employee"// Solo viajeros por ahora
  phone?: string
  paymentMethods?: string[]
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  isAuthenticated: boolean
}

interface RegisterData {
  nombres: string
  apellidos: string
  email: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Simulación de base de datos de usuarios (en memoria)
  // Elimina la línea: `const [usersDatabase, setUsersDatabase] = useState<Array<RegisterData & { id: string }>>([...]);`

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.message || "Error al iniciar sesión." }
      }

      const authenticatedUser: User = {
        id: data.user.id,
        nombres: data.user.nombres,
        apellidos: data.user.apellidos,
        email: data.user.email,
        type: data.user.type,
      }

      setUser(authenticatedUser)
      setIsAuthenticated(true)
      localStorage.setItem("user", JSON.stringify(authenticatedUser))

      console.log("Login exitoso:", authenticatedUser)
      return { success: true }
    } catch (error) {
      console.error("Error en login:", error)
      return { success: false, message: "Error de conexión con el servidor." }
    }
  }

  const register = async (userData: RegisterData): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.message || "Error al crear la cuenta." }
      }

      const newUser: User = {
        id: data.user.id,
        nombres: data.user.nombres,
        apellidos: data.user.apellidos,
        email: data.user.email,
        type: data.user.type,
      }

      setUser(newUser)
      setIsAuthenticated(true)
      localStorage.setItem("user", JSON.stringify(newUser))

      console.log("Registro exitoso:", newUser)
      return { success: true }
    } catch (error) {
      console.error("Error en registro:", error)
      return { success: false, message: "Error de conexión con el servidor." }
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("user")
    console.log("Usuario deslogueado")
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
