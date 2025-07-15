/*"use client"

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

      {/* Modal de Transporte Público *//*}
      <PublicTransportModal
        isOpen={isTransportModalOpen}
        onClose={() => setIsTransportModalOpen(false)}
        stationName={selectedStation?.name || ""}
        routes={selectedStation ? getPublicTransportForStation(selectedStation.id) : []}
      />
    </div>
  )
}
*/
"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useApp } from "@/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bike, Zap, MapPin, Clock, Leaf, History, Star, Bus, Train } from "lucide-react"
// PublicTransportModal ya no se usa directamente aquí, se mantiene en AppRouter si es necesario para otras vistas
// import PublicTransportModal from "@/components/transport/PublicTransportModal"
// import { useState } from "react" // Ya no es necesario para el modal de estaciones

interface DashboardProps {
  onNavigate: (page: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth()
  const { trips, publicTransportTrips, currentTrip, getCarbonImpact } = useApp()
  const carbonImpact = getCarbonImpact()

  const totalAvailableVehicles = 0 // Ya no se muestra directamente en el dashboard
  // stations.reduce((sum, station) => sum + station.availableVehicles, 0) // Esto se puede calcular si se necesita en otro lugar

  const userTripsCount = trips.length + publicTransportTrips.length
  const avgRating = trips.length > 0 ? trips.reduce((sum, trip) => sum + (trip.rating || 0), 0) / trips.length : 0

  // Combinar y ordenar los últimos viajes
  const allUserTrips = [...trips, ...publicTransportTrips].sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  const latestTrips = allUserTrips.slice(0, 3) // Mostrar los 3 últimos viajes

  const renderStars = (rating: number | undefined) => {
    if (rating === undefined) return null
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!endTime) return "En progreso"
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60)
    return `${duration} min`
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
              <Button size="sm" onClick={() => onNavigate("vehicles")}>
                Ver en Mapa
              </Button>
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
            <div className="text-2xl font-bold">N/A</div> {/* Ya no se muestra directamente */}
            <p className="text-xs text-muted-foreground">Disponibles ahora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Viajes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userTripsCount}</div>
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
        {/* Nueva tarjeta: Historial de Últimos Viajes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5 text-gray-600" />
              <span>Últimos Viajes Realizados</span>
            </CardTitle>
            <CardDescription>Tu actividad reciente en EcoTransport</CardDescription>
          </CardHeader>
          <CardContent>
            {latestTrips.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No tienes viajes registrados aún.</p>
                <p className="text-sm mt-2">¡Comienza tu primer viaje eco-amigable!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {latestTrips.map((trip: any) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center space-x-3">
                      {trip.vehicleType ? ( // Es un viaje de vehículo individual
                        <Bike className="h-5 w-5 text-green-600" />
                      ) : // Es un viaje de transporte público
                      trip.transportType === "bus" ? (
                        <Bus className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Train className="h-5 w-5 text-purple-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {trip.vehicleType
                            ? `${trip.vehicleType === "bike" ? "Bici" : "Scooter"} ${trip.vehicleId}`
                            : trip.routeName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {trip.origin || trip.startStation} →{" "}
                          {trip.actualDestination || trip.destination || trip.plannedDestination}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {formatDuration(trip.startTime, trip.endTime)}
                      </p>
                      <p className="text-xs text-green-600 font-semibold">${trip.cost?.toFixed(2) || "N/A"}</p>
                    </div>
                  </div>
                ))}
                <Button className="w-full mt-4 bg-transparent" variant="outline" onClick={() => onNavigate("history")}>
                  Ver Historial Completo
                </Button>
              </div>
            )}
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

      {/* PublicTransportModal ya no se renderiza aquí, se asume que se maneja en AppRouter o en la vista de buses */}
      {/* <PublicTransportModal
        isOpen={isTransportModalOpen}
        onClose={() => setIsTransportModalOpen(false)}
        stationName={selectedStation?.name || ""}
        routes={selectedStation ? getPublicTransportForStation(selectedStation.id) : []}
      /> */}
    </div>
  )
}
