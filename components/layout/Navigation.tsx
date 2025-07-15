"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Bike, Bus, History, Leaf, Settings, LogOut, User } from "lucide-react"

type Page = "dashboard" | "vehicles" | "buses" | "history" | "carbon" | "admin"

interface NavigationProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { user, logout } = useAuth()

  const navItems = [
    { id: "dashboard", label: "Inicio", icon: Home },
    { id: "vehicles", label: "Vehículos", icon: Bike },
    { id: "buses", label: "Buses", icon: Bus },
    { id: "history", label: "Historial", icon: History },
    { id: "carbon", label: "Impacto", icon: Leaf },
  ]

  if (user?.type === "employee") {
    navItems.push({ id: "admin", label: "Admin", icon: Settings })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Bike className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">EcoTransport</span>
            </div>

            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    onClick={() => onPageChange(item.id as Page)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt={user?.nombres} />
                  <AvatarFallback>
                    {user?.nombres
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block">{user?.nombres}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
