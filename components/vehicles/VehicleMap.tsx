"use client"

import { useState } from "react"
import { Bike, MapPin, Train, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/AppContext"
import VehicleRentalModal from "./VehicleRentalModal"

export default function VehicleMap() {
  const { stations } = useApp()
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [selectedStation, setSelectedStation] = useState<string>("")

  const handleRentVehicle = (vehicle: any, stationName: string) => {
    setSelectedVehicle(vehicle)
    setSelectedStation(stationName)
    setIsRentalModalOpen(true)
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
        <Bike className="h-6 w-6 text-green-600" />
        <span>Mapa de Vehículos</span>
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stations.map((station) => (
          <Card key={station.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{station.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500">Capacidad: {station.capacity}</p>
              <Badge variant="secondary">{station.availableVehicles} vehículos disponibles</Badge>

              {station.vehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center space-x-3">
                    {v.type === "bike" && <Bike className="h-4 w-4 text-green-600" />}
                    {v.type === "scooter" && <Bike className="h-4 w-4 text-blue-600" />}
                    {/* {v.type === "" && <Train className="h-4 w-4 text-purple-600" />}*/}
                    <div>
                      <span className="font-medium">
                        {v.type === "bike" ? "Bici" : v.type === "scooter" ? "Scooter" : "Tranvía"} {v.id}
                      </span>
                      {v.type === "scooter" && ( // Solo muestra la batería si es un scooter
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Zap className="h-3 w-3" />
                          <span>{v.batteryLevel}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleRentVehicle(v, station.name)}>
                    Alquilar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <VehicleRentalModal
        isOpen={isRentalModalOpen}
        onClose={() => setIsRentalModalOpen(false)}
        vehicle={selectedVehicle}
        stationName={selectedStation}
      />
    </div>
  )
}
