"use client"

import { useState } from "react"
import { Bus, Train, Clock, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/AppContext"
import BusTripPlannerModal from "./BusTripPlannerModal"

export default function BusRoutes() {
  const { getAllBusRoutes } = useApp()
  const allRoutes = getAllBusRoutes()
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<any>(null)

  const handlePlanTrip = (route: any) => {
    setSelectedRoute(route)
    setIsPlannerModalOpen(true)
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
        <Bus className="h-6 w-6 text-blue-600" />
        <span>Todas las Rutas de Transporte Público</span>
      </h2>

      <div className="grid gap-6">
        {allRoutes.map((route) => (
          <Card key={route.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {route.type === "bus" ? (
                    <Bus className="h-5 w-5" style={{ color: route.color }} />
                  ) : (
                    <Train className="h-5 w-5" style={{ color: route.color }} />
                  )}
                  <span>{route.name}</span>
                </div>
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Próximo: {route.estimatedArrival}</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Información general */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tipo: {route.type === "bus" ? "Bus" : "Tranvía"}</span>
                <span className="text-gray-600">{route.fullRoute.length} estaciones</span>
              </div>

              {/* Ruta completa */}
              <div>
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Recorrido Completo:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {route.fullRoute.map((station, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md text-sm">
                      <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="truncate">{station}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destinos principales */}
              <div>
                <h4 className="font-medium mb-2">Destinos Principales:</h4>
                <div className="flex flex-wrap gap-2">
                  {route.destinations.map((destination, index) => (
                    <Badge key={index} variant="outline" style={{ borderColor: route.color }}>
                      {destination}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end pt-2">
                <Button onClick={() => handlePlanTrip(route)} style={{ backgroundColor: route.color, color: "white" }}>
                  Planificar Viaje
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estadísticas generales */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader>
          <CardTitle>Resumen del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{allRoutes.filter((r) => r.type === "bus").length}</p>
              <p className="text-sm text-gray-600">Rutas de Bus</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{allRoutes.filter((r) => r.type === "tranvia").length}</p>
              <p className="text-sm text-gray-600">Líneas de Tranvía</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {allRoutes.reduce((sum, route) => sum + route.fullRoute.length, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Estaciones</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(allRoutes.reduce((sum, route) => sum + route.fullRoute.length, 0) / allRoutes.length)}
              </p>
              <p className="text-sm text-gray-600">Promedio por Ruta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Planificación de Viaje */}
      <BusTripPlannerModal
        isOpen={isPlannerModalOpen}
        onClose={() => setIsPlannerModalOpen(false)}
        route={selectedRoute}
      />
    </div>
  )
}
