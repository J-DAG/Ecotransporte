"use client"

import { Leaf } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApp } from "@/contexts/AppContext"

export default function CarbonImpact() {
  const { getCarbonImpact } = useApp()
  const impact = getCarbonImpact()

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
        <Leaf className="h-6 w-6 text-green-600" />
        <span>Impacto Ambiental</span>
      </h2>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Tu contribución</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-5xl font-bold text-green-700">{impact.individual.toFixed(1)} kg</p>
          <p className="text-gray-600">de CO₂ evitados usando bicicletas y scooters.</p>
        </CardContent>
      </Card>
    </div>
  )
}
