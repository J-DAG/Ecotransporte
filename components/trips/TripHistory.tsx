"use client"

import { History, Bike, Bus, Train, Star, Calendar, MapPin, Clock, Leaf } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/contexts/AppContext"

export default function TripHistory() {
  const { trips, publicTransportTrips } = useApp()

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
      <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
        <History className="h-6 w-6 text-gray-600" />
        <span>Historial de Viajes</span>
      </h2>

      <Tabs defaultValue="vehicles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vehicles" className="flex items-center space-x-2">
            <Bike className="h-4 w-4" />
            <span>Vehículos Alquilados</span>
          </TabsTrigger>
          <TabsTrigger value="public-transport" className="flex items-center space-x-2">
            <Bus className="h-4 w-4" />
            <span>Transporte Público</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          {trips.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Bike className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tienes viajes en vehículos registrados.</p>
                <p className="text-sm text-gray-400 mt-2">¡Alquila tu primera bicicleta o scooter para comenzar!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => (
                <Card key={trip.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bike className="h-5 w-5 text-green-600" />
                        <span>
                          {trip.vehicleType === "bike" ? "Bicicleta" : "Scooter"} {trip.vehicleId}
                        </span>
                        <Badge variant={trip.status === "completed" ? "default" : "secondary"}>
                          {trip.status === "completed" ? "Completado" : "En progreso"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">{renderStars(trip.rating)}</div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Fecha</p>
                          <p className="text-gray-600">{trip.startTime.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Duración</p>
                          <p className="text-gray-600">{formatDuration(trip.startTime, trip.endTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Ruta</p>
                          <p className="text-gray-600">
                            {trip.origin} → {trip.actualDestination || trip.destination}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Leaf className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">CO₂ Ahorrado</p>
                          <p className="text-green-600 font-semibold">{trip.carbonSaved?.toFixed(2) || "N/A"} kg</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-lg font-bold text-green-600">${trip.cost?.toFixed(2) || "N/A"}</span>
                      {trip.actualDestination !== trip.destination && (
                        <Badge variant="outline" className="text-xs">
                          Terminó antes del destino planeado
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public-transport" className="space-y-4">
          {publicTransportTrips.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tienes viajes en transporte público registrados.</p>
                <p className="text-sm text-gray-400 mt-2">¡Usa un bus o tranvía para comenzar!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {publicTransportTrips.map((trip) => (
                <Card key={trip.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {trip.transportType === "bus" ? (
                          <Bus className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Train className="h-5 w-5 text-green-600" />
                        )}
                        <span>{trip.routeName}</span>
                        <Badge variant={trip.status === "completed" ? "default" : "secondary"}>
                          {trip.status === "completed" ? "Completado" : "En progreso"}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Fecha</p>
                          <p className="text-gray-600">{trip.startTime.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Duración</p>
                          <p className="text-gray-600">{formatDuration(trip.startTime, trip.endTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Ruta</p>
                          <p className="text-gray-600">
                            {trip.startStation} → {trip.actualDestination || trip.plannedDestination}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center space-x-4">
                        {trip.cost !== undefined && (
                          <div className="flex items-center space-x-1">
                            <span className="text-lg font-bold text-green-600">${trip.cost.toFixed(2)}</span>
                            <span className="text-sm text-gray-500">Costo</span>
                          </div>
                        )}
                        {trip.carbonSaved !== undefined && (
                          <div className="flex items-center space-x-1">
                            <Leaf className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600 font-semibold">
                              {trip.carbonSaved.toFixed(2)} kg CO₂
                            </span>
                          </div>
                        )}
                      </div>
                      {trip.actualDestination !== trip.plannedDestination && (
                        <Badge variant="outline" className="text-xs">
                          Bajó antes del destino planeado
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Resumen general */}
      {(trips.length > 0 || publicTransportTrips.length > 0) && (
        <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle>Resumen de tu Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{trips.length}</p>
                <p className="text-sm text-gray-600">Viajes en vehiculos individuales</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{publicTransportTrips.length}</p>
                <p className="text-sm text-gray-600">Viajes en Transporte Público</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  $
                  {(
                    trips.reduce((sum, trip) => sum + (trip.cost || 0), 0) +
                    publicTransportTrips.reduce((sum, trip) => sum + (trip.cost || 0), 0)
                  ).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Total Gastado</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {(
                    trips.reduce((sum, trip) => sum + (trip.carbonSaved || 0), 0) +
                    publicTransportTrips.reduce((sum, trip) => sum + (trip.carbonSaved || 0), 0)
                  ).toFixed(1)}{" "}
                  kg
                </p>
                <p className="text-sm text-gray-600">CO₂ Ahorrado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
