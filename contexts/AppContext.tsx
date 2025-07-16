"use client"

import { useEffect } from "react"

import type React from "react"
import { createContext, useContext, useState, useCallback, useRef } from "react"
import { useAuth } from "./AuthContext"

interface Vehicle {
  id: string
  type: "bike" | "scooter"
  batteryLevel: number | null // Null para bicicletas
  tireStatus: string | null // Nuevo campo para bicicletas
  status: "Disponible" | "Fuera de servicio"
  location: { lat: number; lng: number } // La ubicación del vehículo es la de la estación
  stationId: string // id_estacion
  pricePerMinute: number
  carbonFactor: number
}

interface PublicTransportRoute {
  id: string // id_ruta
  name: string
  type: "bus" | "tranvia" // Cambiado a 'tranvia'
  color: string
  estimatedArrival: string // tiempo_estimado_llegada
  destinations: string[] // destinos_principales
  fullRoute: string[] // Derivado de Ruta_parada
}

interface Station {
  id: string // id_estacion
  name: string // nombre_ubicacion
  location: { lat: number; lng: number }
  capacity: number
  availableVehicles: number // Calculado
  vehicles: Vehicle[] // Los vehículos individuales asociados a este punto
  publicTransportRoutes: PublicTransportRoute[] // Rutas que pasan por esta estación (se calculará en frontend)
}

// Interfaz para Viaje_alquiler (vehículos individuales)
interface VehicleTrip {
  id: string // id_viaje_alquiler
  userId: number // id_usuario
  vehicleId: string // id_vehiculo_individual
  vehicleType: "bike" | "scooter"
  origin: string // origen (nombre de estación)
  destination: string // destino (nombre de estación)
  actualDestination: string // destino (nombre de estación al finalizar)
  status: "in-progress" | "completed" | "cancelled"
  startTime: Date // fecha_hora_inicio
  endTime?: Date // fecha_hora_fin
  cost?: number
  carbonSaved?: number
  rating?: number
  suggestedRoute?: string[] // Esto no se guarda en BD, es para el frontend
}

// Interfaz para Viaje_normal (transporte público)
interface PublicTransportTrip {
  id: string // id_viaje_normal
  userId: number // id_usuario
  vehicleColectivoId: number // id_vehiculo_colectivo
  routeId: string // id_ruta
  routeName: string
  transportType: "bus" | "tranvia" // Cambiado a 'tranvia'
  startStation: string // origen (nombre de parada)
  plannedDestination: string // destino (nombre de parada)
  actualDestination?: string // destino (nombre de parada al finalizar)
  status: "in-progress" | "completed" | "cancelled"
  startTime: Date // fecha_hora_inicio
  endTime?: Date // fecha_hora_fin
  cost?: number
  carbonSaved?: number
  rating?: number
  currentStationIndex: number
  fullRoute: string[] // full_route_snapshot
}

interface AppContextType {
  stations: Station[]
  trips: VehicleTrip[]
  currentTrip: VehicleTrip | null
  publicTransportTrips: PublicTransportTrip[]
  currentPublicTransportTrip: PublicTransportTrip | null
  allBusRoutes: PublicTransportRoute[]
  reserveVehicle: (vehicleId: string, stationId: string) => Promise<boolean>
  startVehicleTrip: (vehicleId: string, startStation: string, destination: string) => Promise<void>
  endVehicleTrip: (endStation: string, rating: number) => Promise<void>
  getBusRoutes: () => any[] // Esta función puede ser eliminada o adaptada si ya no es necesaria
  getAllBusRoutes: () => PublicTransportRoute[]
  getCarbonImpact: () => { individual: number; total: number }
  getPublicTransportForStation: (stationId: string) => PublicTransportRoute[]
  startPublicTransportTrip: (routeId: string, startStation: string, destination: string) => Promise<void>
  getOffPublicTransport: (stationName: string, rating: number) => Promise<void> // Añadir rating
  advancePublicTransportTrip: () => Promise<void>
  fetchUserTrips: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()

  const [stations, setStations] = useState<Station[]>([])
  const [allBusRoutes, setAllBusRoutes] = useState<PublicTransportRoute[]>([])

  const [trips, setTrips] = useState<VehicleTrip[]>([])
  const [currentTrip, setCurrentTrip] = useState<VehicleTrip | null>(null)
  const [publicTransportTrips, setPublicTransportTrips] = useState<PublicTransportTrip[]>([])
  const [currentPublicTransportTrip, setCurrentPublicTransportTrip] = useState<PublicTransportTrip | null>(null)

  const publicTransportIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTransportData = useCallback(async () => {
    try {
      // Fetch Estaciones y Vehículos Individuales
      const stationsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/data/stations-with-vehicles`)
      const stationsData = await stationsResponse.json()
      if (stationsResponse.ok) {
        const mappedStations: Station[] = stationsData.stations.map((station: any) => ({
          id: station.id, // id_estacion
          name: station.name, // nombre_ubicacion
          location: { lat: Number.parseFloat(station.location.lat), lng: Number.parseFloat(station.location.lng) },
          capacity: station.capacity,
          availableVehicles: station.availableVehicles,
          vehicles: station.vehicles.map((v: any) => ({
            id: v.id,
            type: v.type,
            batteryLevel: v.batteryLevel,
            tireStatus: v.tireStatus, // Nuevo campo
            status: v.status,
            stationId: v.stationId,
            pricePerMinute: v.pricePerMinute,
            carbonFactor: v.carbonFactor,
            location: station.location, // La ubicación del vehículo es la de la estación
          })),
          publicTransportRoutes: [], // Se llenará después
        }))
        setStations(mappedStations)
      } else {
        console.error("Error al obtener estaciones:", stationsData.message)
      }

      // Fetch Rutas de Transporte Público
      const routesResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/data/public-transport-routes`)
      const routesData = await routesResponse.json()
      if (routesResponse.ok) {
        const mappedRoutes: PublicTransportRoute[] = routesData.routes.map((route: any) => ({
          id: route.id,
          name: route.name,
          type: route.type,
          color: route.color,
          estimatedArrival: route.estimatedArrival,
          destinations: route.destinations || [],
          fullRoute: route.fullRoute || [],
        }))
        setAllBusRoutes(mappedRoutes)
      } else {
        console.error("Error al obtener rutas de transporte público:", routesData.message)
      }
    } catch (error) {
      console.error("Error de conexión al obtener datos de transporte:", error)
    }
  }, [])

  const fetchUserTrips = useCallback(async () => {
    if (!user?.id) return

    try {
      // Fetch Viajes de Vehículos Individuales
      const vehicleResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/trips/vehicles/user/${user.id}`)
      const vehicleData = await vehicleResponse.json()
      if (vehicleResponse.ok) {
        setTrips(
          vehicleData.trips.map((trip: any) => {
            console.log("Datos crudos de viaje de vehículo:", trip) // Log para depuración
            const parsedCost = Number.parseFloat(trip.cost)
            const finalCost = Number.isNaN(parsedCost) ? undefined : parsedCost

            const parsedCarbonSaved = Number.parseFloat(trip.carbon_saved)
            const finalCarbonSaved = Number.isNaN(parsedCarbonSaved) ? undefined : parsedCarbonSaved

            return {
              id: trip.id.toString(),
              userId: Number.parseInt(trip.user_id),
              vehicleId: trip.vehicle_id.toString(),
              vehicleType: trip.vehicle_type,
              origin: trip.start_station,
              destination: trip.planned_destination, // Usar planned_destination como destino final
              actualDestination: trip.actual_destination || "", // Puede ser null inicialmente
              status: trip.status,
              startTime: new Date(trip.start_time),
              endTime: trip.end_time ? new Date(trip.end_time) : undefined,
              cost: finalCost,
              carbonSaved: finalCarbonSaved,
              rating: trip.rating !== null ? Number.parseInt(trip.rating) : undefined,
              suggestedRoute: Array.isArray(trip.suggested_route) ? trip.suggested_route : [],
            }
          }),
        )
      } else {
        console.error("Error al obtener viajes de vehículo:", vehicleData.message)
      }

      // Fetch Viajes de Transporte Público
      const publicTransportResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/trips/public-transport/user/${user.id}`,
      )
      const publicTransportData = await publicTransportResponse.json()
      if (publicTransportResponse.ok) {
        setPublicTransportTrips(
          publicTransportData.trips.map((trip: any) => {
            console.log("Datos crudos de viaje de transporte público:", trip) // Log para depuración
            const parsedCost = Number.parseFloat(trip.cost)
            const finalCost = Number.isNaN(parsedCost) ? undefined : parsedCost

            const parsedCarbonSaved = Number.parseFloat(trip.carbon_saved)
            const finalCarbonSaved = Number.isNaN(parsedCarbonSaved) ? undefined : parsedCarbonSaved

            return {
              id: trip.id.toString(),
              userId: Number.parseInt(trip.user_id),
              vehicleColectivoId: trip.vehicle_colectivo_id.toString(),
              routeId: trip.route_id.toString(),
              routeName: trip.route_name,
              transportType: trip.transport_type,
              startStation: trip.start_station,
              plannedDestination: trip.planned_destination,
              actualDestination: trip.actual_destination,
              status: trip.status,
              startTime: new Date(trip.start_time),
              endTime: trip.end_time ? new Date(trip.end_time) : undefined,
              cost: finalCost,
              carbonSaved: finalCarbonSaved,
              rating: trip.rating !== null ? Number.parseInt(trip.rating) : undefined,
              currentStationIndex: typeof trip.current_station_index === "number" ? trip.current_station_index : 0,
              fullRoute: Array.isArray(trip.full_route)
                ? trip.full_route.filter((s: string | null | undefined) => s != null)
                : [],
            }
          }),
        )
      } else {
        console.error("Error al obtener viajes de transporte público:", publicTransportData.message)
      }

      // Obtener viaje en progreso
      const currentTripResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/trips/current-trip/user/${user.id}`,
      )
      const currentTripData = await currentTripResponse.json()
      if (currentTripResponse.ok && currentTripData.currentTrip) {
        if (currentTripData.type === "vehicle") {
          const parsedCurrentCost = Number.parseFloat(currentTripData.currentTrip.cost)
          const finalCurrentCost = Number.isNaN(parsedCurrentCost) ? undefined : parsedCurrentCost

          const parsedCurrentCarbonSaved = Number.parseFloat(currentTripData.currentTrip.carbon_saved)
          const finalCurrentCarbonSaved = Number.isNaN(parsedCurrentCarbonSaved) ? undefined : parsedCurrentCarbonSaved

          setCurrentTrip({
            id: currentTripData.currentTrip.id.toString(),
            userId: Number.parseInt(currentTripData.currentTrip.user_id),
            vehicleId: currentTripData.currentTrip.vehicle_id.toString(),
            vehicleType: currentTripData.currentTrip.vehicle_type,
            startTime: new Date(currentTripData.currentTrip.start_time),
            endTime: currentTripData.currentTrip.end_time ? new Date(currentTripData.currentTrip.end_time) : undefined,
            origin: currentTripData.currentTrip.start_station,
            destination: currentTripData.currentTrip.planned_destination,
            actualDestination: currentTripData.currentTrip.actual_destination,
            cost: finalCurrentCost,
            carbonSaved: finalCurrentCarbonSaved,
            rating:
              currentTripData.currentTrip.rating !== null
                ? Number.parseInt(currentTripData.currentTrip.rating)
                : undefined,
            status: currentTripData.currentTrip.status,
            suggestedRoute: Array.isArray(currentTripData.currentTrip.suggested_route)
              ? currentTripData.currentTrip.suggested_route
              : [],
          })
          setCurrentPublicTransportTrip(null)
        } else if (currentTripData.type === "public-transport") {
          const parsedCurrentCost = Number.parseFloat(currentTripData.currentTrip.cost)
          const finalCurrentCost = Number.isNaN(parsedCurrentCost) ? undefined : parsedCurrentCost

          const parsedCurrentCarbonSaved = Number.parseFloat(currentTripData.currentTrip.carbon_saved)
          const finalCurrentCarbonSaved = Number.isNaN(parsedCurrentCarbonSaved) ? undefined : parsedCurrentCarbonSaved

          setCurrentPublicTransportTrip({
            id: currentTripData.currentTrip.id.toString(),
            userId: Number.parseInt(currentTripData.currentTrip.user_id),
            vehicleColectivoId: currentTripData.currentTrip.vehicle_colectivo_id.toString(),
            routeId: currentTripData.currentTrip.route_id.toString(),
            routeName: currentTripData.currentTrip.route_name,
            transportType: currentTripData.currentTrip.transport_type,
            startStation: currentTripData.currentTrip.start_station,
            plannedDestination: currentTripData.currentTrip.planned_destination,
            actualDestination: currentTripData.currentTrip.actual_destination,
            startTime: new Date(currentTripData.currentTrip.start_time),
            endTime: currentTripData.currentTrip.end_time ? new Date(currentTripData.currentTrip.end_time) : undefined,
            cost: finalCurrentCost,
            carbonSaved: finalCurrentCarbonSaved,
            rating:
              currentTripData.currentTrip.rating !== null
                ? Number.parseInt(currentTripData.currentTrip.rating)
                : undefined,
            currentStationIndex:
              typeof currentTripData.currentTrip.current_station_index === "number"
                ? currentTripData.currentTrip.current_station_index
                : 0,
            fullRoute: Array.isArray(currentTripData.currentTrip.full_route)
              ? currentTripData.currentTrip.full_route.filter((s: string | null | undefined) => s != null)
              : [],
            status: currentTripData.currentTrip.status,
          })
          setCurrentTrip(null)
        }
      } else {
        setCurrentTrip(null)
        setCurrentPublicTransportTrip(null)
      }
    } catch (error) {
      console.error("Error al obtener todos los viajes del usuario:", error)
    }
  }, [user?.id])

  useEffect(() => {
    fetchTransportData()
  }, [fetchTransportData])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserTrips()
    }
  }, [isAuthenticated, user?.id, fetchUserTrips])

  const reserveVehicle = async (vehicleId: string, stationId: string): Promise<boolean> => {
    console.log(`Reservando vehículo ${vehicleId} en estación ${stationId}`)
    // Lógica de reserva (puede ser una llamada a backend real)
    return true
  }

  const startVehicleTrip = async (vehicleId: string, startStation: string, destination: string) => {
    if (!user?.id) {
      console.error("Usuario no autenticado para iniciar viaje.")
      return
    }
    const vehicle = stations.flatMap((s) => s.vehicles).find((v) => v.id === vehicleId)
    if (!vehicle) {
      console.error("Vehículo no encontrado.")
      return
    }

    const suggestedRoute = [startStation, "Ruta Directa", destination] // Esto es solo para el frontend

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/trips/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          vehicleId: vehicle.id,
          startStation,
          plannedDestination: destination,
          // suggestedRoute, // No se envía al backend directamente
        }),
      })
      const data = await response.json()

      if (response.ok) {
        const newTrip: VehicleTrip = {
          id: data.trip.id.toString(),
          userId: Number.parseInt(data.trip.userId),
          vehicleId: data.trip.vehicleId.toString(),
          vehicleType: vehicle.type, // Se obtiene del frontend
          origin: data.trip.startStation,
          destination: data.trip.plannedDestination,
          actualDestination: data.trip.actualDestination || "", // Puede ser null inicialmente
          status: data.trip.status,
          startTime: new Date(data.trip.startTime),
          suggestedRoute, // Se mantiene en el frontend
        }
        setCurrentTrip(newTrip)
        console.log("Viaje de vehículo iniciado y guardado en BD.")
      } else {
        console.error("Error al iniciar viaje de vehículo:", data.message)
      }
    } catch (error) {
      console.error("Error de conexión al iniciar viaje de vehículo:", error)
    }
  }

  const endVehicleTrip = async (endStation: string, rating: number) => {
    if (!currentTrip || !user?.id) {
      console.error("No hay viaje en progreso para finalizar o usuario no autenticado.")
      return
    }

    // Ya no calculamos costo y carbono aquí, el backend lo hará
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/trips/vehicles/${currentTrip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endStation,
          actualDestination: endStation,
          rating, // Enviar la calificación
          status: "completed",
          // Ya no enviamos cost ni carbonSaved
        }),
      })
      const data = await response.json()

      if (response.ok) {
        setCurrentTrip(null) // Limpiar el viaje actual
        await fetchUserTrips() // Re-fetch completo del historial
        console.log("Viaje de vehículo finalizado y actualizado en BD.")
      } else {
        console.error("Error al finalizar viaje de vehículo:", data.message)
      }
    } catch (error) {
      console.error("Error de conexión al finalizar viaje de vehículo:", error)
    }
  }

  const getBusRoutes = () => {
    return [
      { id: "1", name: "Ruta A1", estimatedTime: "5 min", status: "on-time" },
      { id: "2", name: "Ruta B2", estimatedTime: "12 min", status: "delayed" },
      { id: "3", name: "Ruta C3", estimatedTime: "8 min", status: "on-time" },
    ]
  }

  const getAllBusRoutes = () => {
    return allBusRoutes
  }

  const getCarbonImpact = () => {
    const individual = trips.reduce((sum, trip) => sum + (trip.carbonSaved || 0), 0)
    // Sumar también el carbono ahorrado de los viajes de transporte público
    const publicTransportCarbon = publicTransportTrips.reduce((sum, trip) => sum + (trip.carbonSaved || 0), 0)
    return {
      individual: individual + publicTransportCarbon, // Suma ambos tipos de viajes
      total: (individual + publicTransportCarbon) * 1000, // Ajusta el total si es necesario
    }
  }

  const getPublicTransportForStation = (stationId: string) => {
    const station = stations.find((s) => s.id === stationId)
    if (!station) return []
    // Filtra las rutas de allBusRoutes que incluyen el nombre de la estación en su fullRoute
    return allBusRoutes.filter((route) => route.fullRoute.includes(station.name))
  }

  const getOffPublicTransport = useCallback(
    async (stationName: string, rating: number) => {
      if (!currentPublicTransportTrip || !user?.id || currentPublicTransportTrip.status === "completed") {
        console.warn(
          "Intento de finalizar viaje de transporte público sin un viaje en progreso o usuario no autenticado.",
        )
        return
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/trips/public-transport/${currentPublicTransportTrip.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actualDestination: stationName,
              status: "completed",
              rating, // Enviar la calificación
            }),
          },
        )
        const data = await response.json()

        if (response.ok) {
          setCurrentPublicTransportTrip(null) // Limpiar el viaje actual
          await fetchUserTrips() // Re-fetch completo del historial
          console.log("Viaje en transporte público finalizado y actualizado en BD.")
        } else {
          console.error("Error al finalizar viaje en transporte público:", data.message)
        }
      } catch (error) {
        console.error("Error de conexión al finalizar viaje en transporte público:", error)
      }
    },
    [currentPublicTransportTrip, user?.id, fetchUserTrips],
  )

  const startPublicTransportTrip = async (routeId: string, startStation: string, destination: string) => {
    if (!user?.id) {
      console.error("Usuario no autenticado para iniciar viaje en transporte público.")
      return
    }
    const route = allBusRoutes.find((r) => r.id === routeId)

    if (!route) {
      console.error("Ruta de transporte público no encontrada.")
      return
    }

    const initialStationIndex = route.fullRoute.indexOf(startStation)
    if (initialStationIndex === -1) {
      console.error("La estación de inicio seleccionada no se encontró en la ruta completa.")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/trips/public-transport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          routeId,
          startStation,
          plannedDestination: destination,
          fullRoute: route.fullRoute,
          currentStationIndex: initialStationIndex,
        }),
      })
      const data = await response.json()

      if (response.ok) {
        const newTrip: PublicTransportTrip = {
          id: data.trip.id.toString(),
          userId: Number.parseInt(data.trip.userId),
          vehicleColectivoId: data.trip.vehicleColectivoId?.toString() || "", // Asegúrate de que no sea null/undefined antes de toString()
          routeId: data.trip.routeId.toString(),
          routeName: data.trip.routeName,
          transportType: data.trip.transportType,
          startStation: data.trip.startStation,
          plannedDestination: data.trip.plannedDestination,
          actualDestination: data.trip.actualDestination,
          startTime: new Date(data.trip.startTime),
          endTime: data.trip.endTime ? new Date(data.trip.endTime) : undefined,
          currentStationIndex: typeof data.trip.currentStationIndex === "number" ? data.trip.currentStationIndex : 0,
          fullRoute: Array.isArray(data.trip.fullRoute)
            ? data.trip.fullRoute.filter((s: string | null | undefined) => s != null)
            : [],
          status: data.trip.status,
          cost: data.trip.cost !== null ? Number.parseFloat(data.trip.cost) : undefined,
          carbonSaved: data.trip.carbonSaved !== null ? Number.parseFloat(data.trip.carbonSaved) : undefined,
          rating: data.trip.rating !== null ? Number.parseInt(data.trip.rating) : undefined,
        }
        setCurrentPublicTransportTrip(newTrip)
        console.log("Viaje en transporte público iniciado y guardado en BD.")
      } else {
        console.error("Error al iniciar viaje en transporte público:", data.message)
      }
    } catch (error) {
      console.error("Error de conexión al iniciar viaje en transporte público:", error)
    }
  }

  useEffect(() => {
    if (publicTransportIntervalRef.current) {
      clearInterval(publicTransportIntervalRef.current)
      publicTransportIntervalRef.current = null
    }

    if (currentPublicTransportTrip && currentPublicTransportTrip.status === "in-progress") {
      publicTransportIntervalRef.current = setInterval(() => {
        setCurrentPublicTransportTrip((prevTrip) => {
          if (!prevTrip || prevTrip.status === "completed") {
            if (publicTransportIntervalRef.current) {
              clearInterval(publicTransportIntervalRef.current)
              publicTransportIntervalRef.current = null
            }
            return prevTrip
          }

          const plannedDestinationIndex = prevTrip.fullRoute.indexOf(prevTrip.plannedDestination)
          const nextIndex = prevTrip.currentStationIndex + 1

          if (nextIndex >= plannedDestinationIndex) {
            if (publicTransportIntervalRef.current) {
              clearInterval(publicTransportIntervalRef.current)
              publicTransportIntervalRef.current = null
            }
            // Al finalizar automáticamente, se envía una calificación predeterminada de 5
            getOffPublicTransport(prevTrip.plannedDestination, 5)
              .then(() => console.log("Viaje de transporte público finalizado automáticamente."))
              .catch((err) => console.error("Error al finalizar viaje automáticamente:", err))

            return {
              ...prevTrip,
              status: "completed",
              endTime: new Date(),
              actualDestination: prevTrip.plannedDestination,
              currentStationIndex: plannedDestinationIndex,
            }
          } else {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/trips/public-transport/${prevTrip.id}/advance`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ currentStationIndex: nextIndex }),
            }).catch((err) => console.error("Error al actualizar estación en backend:", err))

            return {
              ...prevTrip,
              currentStationIndex: nextIndex,
            }
          }
        })
      }, 3000)
    }

    return () => {
      if (publicTransportIntervalRef.current) {
        clearInterval(publicTransportIntervalRef.current)
        publicTransportIntervalRef.current = null
      }
    }
  }, [currentPublicTransportTrip, getOffPublicTransport])

  const advancePublicTransportTrip = async () => {
    console.log("Advance Public Transport Trip (frontend simulation only)")
  }

  return (
    <AppContext.Provider
      value={{
        stations,
        trips,
        currentTrip,
        publicTransportTrips,
        currentPublicTransportTrip,
        allBusRoutes,
        reserveVehicle,
        startVehicleTrip,
        endVehicleTrip,
        getBusRoutes,
        getAllBusRoutes,
        getCarbonImpact,
        getPublicTransportForStation,
        startPublicTransportTrip,
        getOffPublicTransport,
        advancePublicTransportTrip,
        fetchUserTrips,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
