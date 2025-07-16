"use client"

import { CardDescription } from "@/components/ui/card"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Bike, Zap, MapPin, ArrowRight, Navigation, CheckCircle, Star } from "lucide-react" // Importar Star
import { useApp } from "@/contexts/AppContext"

interface Vehicle {
  id: string
  type: "bike" | "scooter"
  batteryLevel: number | null // Null para bicicletas
  tireStatus: string | null // Nuevo campo para bicicletas
  status: "Disponible" | "Fuera de servicio"
  pricePerMinute: number
  carbonFactor: number
}

interface VehicleRentalModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: Vehicle | null
  stationName: string
}

export default function VehicleRentalModal({ isOpen, onClose, vehicle, stationName }: VehicleRentalModalProps) {
  const { stations, currentTrip, startVehicleTrip, endVehicleTrip } = useApp()
  const [selectedDestination, setSelectedDestination] = useState<string>("")
  const [rating, setRating] = useState<number>(5) // Estado para la calificación

  const handleStartTrip = () => {
    if (vehicle && selectedDestination) {
      startVehicleTrip(vehicle.id, stationName, selectedDestination)
      setSelectedDestination("")
      setRating(5) // Resetear calificación al iniciar un nuevo viaje
    }
  }

  const handleEndTrip = (endStation: string) => {
    endVehicleTrip(endStation, rating) // Enviar la calificación seleccionada
    onClose() // Cerrar el modal después de finalizar
  }

  // Si hay un viaje en progreso, mostrar el seguimiento
  if (currentTrip && currentTrip.status === "in-progress") {
    const elapsedTime = Math.floor((Date.now() - currentTrip.startTime.getTime()) / 1000 / 60) // minutos
    // Usar el costo y carbono guardado del viaje actual si están disponibles
    const estimatedCost = currentTrip.cost !== undefined ? currentTrip.cost : elapsedTime * 50 // Fallback a 50 si no hay costo
    const estimatedCarbonSaved = currentTrip.carbonSaved !== undefined ? currentTrip.carbonSaved : elapsedTime * 0.05 // Fallback a 0.05 si no hay carbono

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-green-600" />
              <span>
                Viaje en Progreso - {currentTrip.vehicleType === "bike" ? "Bicicleta" : "Scooter"}{" "}
                {currentTrip.vehicleId}
              </span>
            </DialogTitle>
            <DialogDescription>
              Desde {currentTrip.origin} hacia {currentTrip.destination}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Estado actual del viaje */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>Viaje Activo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Tiempo transcurrido:</span>
                    <p className="text-lg font-bold text-blue-700">{elapsedTime} min</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Costo estimado:</span>
                    <p className="text-lg font-bold text-blue-700">${estimatedCost.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm">CO₂ ahorrado: {estimatedCarbonSaved.toFixed(2)} kg</span>
                </div>
              </CardContent>
            </Card>

            {/* Ruta sugerida */}
            {currentTrip.suggestedRoute && (
              <Card>
                <CardHeader>
                  <CardTitle>Ruta Sugerida</CardTitle>
                  <CardDescription>Puedes terminar tu viaje en cualquier estación</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentTrip.suggestedRoute.map((point, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          index === 0 ? "bg-green-100 border-green-300" : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {index === 0 && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {index === 1 && <Navigation className="h-4 w-4 text-blue-600" />}
                          {index === 2 && <MapPin className="h-4 w-4 text-gray-600" />}

                          <div>
                            <p className={`${index === 0 ? "font-medium text-green-800" : "text-gray-800"}`}>{point}</p>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Origen
                              </Badge>
                            )}
                            {index === 2 && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Destino planeado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estaciones disponibles para terminar */}
            <Card>
              <CardHeader>
                <CardTitle>Terminar Viaje</CardTitle>
                <CardDescription>Selecciona dónde quieres devolver el vehículo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Calificación */}
                <div className="pt-4 border-t">
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
                <div className="grid gap-3">
                  {stations.map((station) => (
                    <div key={station.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{station.name}</p>
                        <p className="text-sm text-gray-500">{station.availableVehicles} espacios disponibles</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleEndTrip(station.name)}
                        variant={station.name === currentTrip.destination ? "default" : "outline"}
                      >
                        {station.name === currentTrip.destination ? "Destino Original" : "Terminar Aquí"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Vista normal de alquiler
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bike className="h-5 w-5 text-green-600" />
            <span>Alquilar Vehículo desde {stationName}</span>
          </DialogTitle>
          <DialogDescription>Selecciona tu destino para comenzar el viaje</DialogDescription>
        </DialogHeader>

        {vehicle && (
          <div className="space-y-6">
            {/* Información del vehículo */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bike className="h-5 w-5 text-green-600" />
                    <span>
                      {vehicle.type === "bike" ? "Bicicleta" : "Scooter"} {vehicle.id}
                    </span>
                  </div>
                  {vehicle.type === "scooter" && ( // Solo muestra la batería si es un scooter
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Zap className="h-3 w-3" />
                      <span>{vehicle.batteryLevel}%</span>
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Estado:</span>
                    <span className="text-green-600 font-medium">Disponible</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tarifa:</span>
                    <span className="font-medium">${vehicle.pricePerMinute}/min</span>
                  </div>
                  {vehicle.type === "scooter" && vehicle.batteryLevel !== null && (
                    <Progress value={vehicle.batteryLevel} className="mt-2" />
                  )}
                  {vehicle.type === "bike" && vehicle.tireStatus !== null && (
                    <div className="flex justify-between text-sm">
                      <span>Llantas:</span>
                      <span className="font-medium">{vehicle.tireStatus}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Selección de destino */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Selecciona tu Destino</h3>
              <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                <SelectTrigger>
                  <SelectValue placeholder="¿A dónde quieres ir?" />
                </SelectTrigger>
                <SelectContent>
                  {stations
                    .filter((station) => station.name !== stationName)
                    .map((station) => (
                      <SelectItem key={station.id} value={station.name}>
                        {station.name} ({station.availableVehicles} espacios disponibles)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resumen del viaje */}
            {selectedDestination && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Resumen del Viaje</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Vehículo:</span>
                    <span>
                      {vehicle.type === "bike" ? "Bicicleta" : "Scooter"} {vehicle.id}
                    </span>
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
                    <span className="font-medium">Tarifa:</span>
                    <span className="text-blue-700 font-semibold">${vehicle.pricePerMinute} por minuto</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botones de acción */}
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancelar
              </Button>
              <Button onClick={handleStartTrip} disabled={!selectedDestination} className="flex-1">
                Iniciar Viaje
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
