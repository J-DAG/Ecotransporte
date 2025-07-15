"use client"

import { Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPanel() {
  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
        <Settings className="h-6 w-6 text-orange-600" />
        <span>Panel de Administración</span>
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Aquí podrás gestionar vehículos, estaciones y ver reportes detallados. (Funcionalidad pendiente de
            implementación)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
