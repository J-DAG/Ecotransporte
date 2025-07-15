"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import LoginPage from "@/components/auth/LoginPage"
import RegisterPage from "@/components/auth/RegisterPage"
import Dashboard from "@/components/dashboard/Dashboard"
import VehicleMap from "@/components/vehicles/VehicleMap"
import BusRoutes from "@/components/buses/BusRoutes"
import TripHistory from "@/components/trips/TripHistory"
import CarbonImpact from "@/components/carbon/CarbonImpact"
import AdminPanel from "@/components/admin/AdminPanel"
import Navigation from "@/components/layout/Navigation"

type Page = "login" | "register" | "dashboard" | "vehicles" | "buses" | "history" | "carbon" | "admin"

export default function AppRouter() {
  const { isAuthenticated, user } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {currentPage === "login" ? (
          <LoginPage onSwitchToRegister={() => setCurrentPage("register")} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setCurrentPage("login")} />
        )}
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} />
      case "vehicles":
        return <VehicleMap />
      case "buses":
        return <BusRoutes />
      case "history":
        return <TripHistory />
      case "carbon":
        return <CarbonImpact />
      case "admin":
        return user?.type === "employee" ? <AdminPanel /> : <Dashboard onNavigate={setCurrentPage} />
      default:
        return <Dashboard onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="pt-16">{renderPage()}</main>
    </div>
  )
}
