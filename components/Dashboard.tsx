"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useApp } from "@/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bike, Zap, MapPin, Clock, Leaf } from "lucide-react"
import PublicTransportModal from "@/components/transport/PublicTransportModal"
import { useState } from "react"

interface DashboardProps {
  onNavigate: (page: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth()
  const { stations, trips, currentTrip, getCarbonImpact, getPublicTransportForStation } = useApp()
  const carbonImpact = getCarbonImpact()

  const totalAvailableVehicles = stations.reduce((sum, station) => sum + station.availableVehicles, 0)
  const userTrips = trips.length
  const avgRating = trips.length > 0 ? trips.reduce((sum, trip) => sum + (trip.rating || 0), 0) / trips.length : 0

  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState<any>(null)

  const handleViewStation = (station: any) => {
    setSelectedStation(station)
    setIsTransportModalOpen(true)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Hola, {user?.nombres} {user?.apellidos}!
        </h1>
        <p className="text-gray-600 mt-2">¿Listo para tu próximo viaje eco-amigable?</p>
      </div>

      {currentTrip && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Viaje en Curso</CardTitle>
            <CardDescription>
              Iniciado desde {currentTrip.origin} a las {currentTrip.startTime.toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {currentTrip.vehicleType === "bike" ? "Bicicleta" : "Scooter"} {currentTrip.vehicleId}
              </Badge>
              <Button size="sm">Ver en Mapa</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehículos Cerca</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAvailableVehicles}</div>
            <p className="text-xs text-muted-foreground">Disponibles ahora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Viajes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userTrips}</div>
            <p className="text-xs text-muted-foreground">Viajes completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi Calificación</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Promedio de estrellas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Ahorrado</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carbonImpact.individual.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Tu contribución</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estaciones Cercanas</CardTitle>
            <CardDescription>Encuentra vehículos disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stations.map((station) => (
                <div key={station.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{station.name}</p>
                    <p className="text-sm text-gray-500">0.5 km de distancia</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{station.availableVehicles} disponibles</Badge>
                    <Button size="sm" className="ml-2" onClick={() => handleViewStation(station)}>
                      Ver Transporte
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>¿Qué quieres hacer hoy?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" onClick={() => onNavigate("vehicles")}>
                <Bike className="mr-2 h-4 w-4" />
                Alquilar Vehículo
              </Button>
              <Button
                className="w-full justify-start bg-transparent"
                variant="outline"
                onClick={() => onNavigate("buses")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Ver Rutas de Bus
              </Button>
              <Button
                className="w-full justify-start bg-transparent"
                variant="outline"
                onClick={() => onNavigate("history")}
              >
                <Clock className="mr-2 h-4 w-4" />
                Mi Historial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Transporte Público */}
      <PublicTransportModal
        isOpen={isTransportModalOpen}
        onClose={() => setIsTransportModalOpen(false)}
        stationName={selectedStation?.name || ""}
        routes={selectedStation ? getPublicTransportForStation(selectedStation.id) : []}
      />
    </div>
  )
}
