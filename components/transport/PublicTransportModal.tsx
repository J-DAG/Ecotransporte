"use client"

import { CardDescription } from "@/components/ui/card"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Bus, Train, Clock, MapPin, ArrowRight, Navigation, CheckCircle, Star } from "lucide-react" // Importar Star
import { useApp } from "@/contexts/AppContext"

interface PublicTransportRoute {
  id: string
  name: string
  type: "bus" | "tranvia"
  color: string
  estimatedArrival: string
  destinations: string[]
  fullRoute: string[]
}

interface PublicTransportModalProps {
  isOpen: boolean
  onClose: () => void
  stationName: string
  routes: PublicTransportRoute[]
}

export default function PublicTransportModal({ isOpen, onClose, stationName, routes }: PublicTransportModalProps) {
  const { currentPublicTransportTrip, startPublicTransportTrip, getOffPublicTransport } = useApp()
  const [selectedRoute, setSelectedRoute] = useState<string>("")
  const [selectedDestination, setSelectedDestination] = useState<string>("")
  const [rating, setRating] = useState<number>(5) // Estado para la calificación

  const handlePlanTrip = () => {
    if (selectedRoute && selectedDestination) {
      startPublicTransportTrip(selectedRoute, stationName, selectedDestination)
      setSelectedRoute("")
      setSelectedDestination("")
      setRating(5) // Resetear calificación al iniciar un nuevo viaje
    }
  }

  const handleGetOff = (stationName: string) => {
    getOffPublicTransport(stationName, rating) // Pasar la calificación seleccionada
    onClose() // Cerrar el modal después de finalizar
  }

  const selectedRouteData = routes.find((r) => r.id === selectedRoute)

  // Si hay un viaje en progreso, mostrar el seguimiento
  if (currentPublicTransportTrip) {
    const currentStation = currentPublicTransportTrip.fullRoute[currentPublicTransportTrip.currentStationIndex]
    const progress =
      ((currentPublicTransportTrip.currentStationIndex + 1) / currentPublicTransportTrip.fullRoute.length) * 100
    const plannedDestinationIndex = currentPublicTransportTrip.fullRoute.indexOf(
      currentPublicTransportTrip.plannedDestination,
    )

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-green-600" />
              <span>Viaje en Progreso - {currentPublicTransportTrip.routeName}</span>
            </DialogTitle>
            <DialogDescription>
              Desde {currentPublicTransportTrip.startStation} hacia {currentPublicTransportTrip.plannedDestination}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progreso del viaje */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>Estación Actual: {currentStation}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="mb-4" />
                <p className="text-sm text-blue-700">
                  Progreso: {currentPublicTransportTrip.currentStationIndex + 1} de{" "}
                  {currentPublicTransportTrip.fullRoute.length} estaciones
                </p>
              </CardContent>
            </Card>

            {/* Lista de estaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Recorrido de la Ruta</CardTitle>
                <CardDescription>Puedes bajar en cualquier estación</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Calificación */}
                <div className="pt-4 border-t mb-4">
                  <label className="block text-sm font-medium mb-2">Califica tu experiencia:</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {currentPublicTransportTrip.fullRoute.map((station, index) => {
                    const isPassed = index < currentPublicTransportTrip.currentStationIndex
                    const isCurrent = index === currentPublicTransportTrip.currentStationIndex
                    const isPlannedDestination = index === plannedDestinationIndex
                    const canGetOff = index >= currentPublicTransportTrip.currentStationIndex && index > 0

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isCurrent
                            ? "bg-blue-100 border-blue-300"
                            : isPassed
                              ? "bg-gray-100 border-gray-200"
                              : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {isPassed && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {isCurrent && <Navigation className="h-4 w-4 text-blue-600" />}
                          {!isPassed && !isCurrent && <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}

                          <div>
                            <p
                              className={`font-medium ${isCurrent ? "text-blue-800" : isPassed ? "text-gray-600" : "text-gray-800"}`}
                            >
                              {station}
                            </p>
                            {isPlannedDestination && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Tu destino
                              </Badge>
                            )}
                          </div>
                        </div>

                        {canGetOff && (
                          <Button
                            size="sm"
                            variant={isPlannedDestination ? "default" : "outline"}
                            onClick={() => handleGetOff(station)}
                            disabled={!isCurrent}
                          >
                            {isCurrent ? "Bajar aquí" : "Próxima"}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Información del viaje */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Hora de inicio:</span>
                    <p>{currentPublicTransportTrip.startTime.toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Tipo de transporte:</span>
                    <p className="capitalize">
                      {currentPublicTransportTrip.transportType === "bus" ? "Bus" : "Tranvía"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Vista normal de selección de ruta
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>Transporte Público desde {stationName}</span>
          </DialogTitle>
          <DialogDescription>Selecciona una ruta y tu destino para planificar tu viaje</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de rutas disponibles */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Rutas Disponibles</h3>
            <div className="grid gap-3">
              {routes.map((route) => (
                <Card
                  key={route.id}
                  className={`cursor-pointer transition-all ${
                    selectedRoute === route.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedRoute(route.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center space-x-2">
                        {route.type === "bus" ? (
                          <Bus className="h-4 w-4" style={{ color: route.color }} />
                        ) : (
                          <Train className="h-4 w-4" style={{ color: route.color }} />
                        )}
                        <span>{route.name}</span>
                      </div>
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{route.estimatedArrival}</span>
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{route.destinations.length} destinos principales</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Selección de destino */}
          {selectedRoute && selectedRouteData && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Selecciona tu Destino</h3>
              <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                <SelectTrigger>
                  <SelectValue placeholder="¿A dónde quieres ir?" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRouteData.destinations.map((destination) => (
                    <SelectItem key={destination} value={destination}>
                      {destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Resumen del viaje */}
          {selectedRoute && selectedDestination && selectedRouteData && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>Resumen del Viaje</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Ruta:</span>
                  <span>{selectedRouteData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Origen:</span>
                  <span>{stationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Destino:</span>
                  <span>{selectedDestination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Llegada estimada:</span>
                  <span className="text-green-700 font-semibold">{selectedRouteData.estimatedArrival}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handlePlanTrip} disabled={!selectedRoute || !selectedDestination} className="flex-1">
              Iniciar Viaje
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
