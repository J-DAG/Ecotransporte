/*
// backend/src/controllers/transportDataController.js
import { query } from "../config/database.js"

export const getStationsWithVehicles = async (req, res) => {
  try {
    // Obtener todas las estaciones
    const stationsResult = await query("SELECT * FROM stations ORDER BY name ASC")
    const stations = stationsResult.rows

    // Obtener todos los vehículos
    const vehiclesResult = await query("SELECT * FROM vehicles")
    const vehicles = vehiclesResult.rows

    // Mapear vehículos a sus estaciones correspondientes
    const stationsWithVehicles = stations.map((station) => {
      const stationVehicles = vehicles.filter((v) => v.station_id === station.id)
      const availableVehiclesCount = stationVehicles.filter((v) => v.status === "available").length

      return {
        id: station.id.toString(),
        name: station.name,
        location: { lat: Number.parseFloat(station.latitude), lng: Number.parseFloat(station.longitude) },
        capacity: station.capacity,
        availableVehicles: availableVehiclesCount,
        vehicles: stationVehicles.map((v) => ({
          id: v.id,
          type: v.type,
          batteryLevel: v.battery_level,
          status: v.status,
          stationId: v.station_id.toString(),
        })),
        // publicTransportRoutes se seguirá calculando en el frontend por ahora
        publicTransportRoutes: [], // Se llenará en el frontend
      }
    })

    res.status(200).json({ stations: stationsWithVehicles })
  } catch (error) {
    console.error("Error al obtener estaciones y vehículos:", error)
    res.status(500).json({ message: "Error interno del servidor al obtener datos de transporte." })
  }
}

export const getPublicTransportRoutes = async (req, res) => {
  try {
    const result = await query("SELECT * FROM public_transport_routes ORDER BY name ASC")
    const routes = result.rows.map((route) => ({
      id: route.id,
      name: route.name,
      type: route.type,
      color: route.color,
      estimatedArrival: route.estimated_arrival,
      destinations: route.destinations, // Ya es un array de texto
      fullRoute: route.full_route, // Ya es un array de texto
    }))
    res.status(200).json({ routes })
  } catch (error) {
    console.error("Error al obtener rutas de transporte público:", error)
    res.status(500).json({ message: "Error interno del servidor al obtener rutas de transporte público." })
  }
}
  */
// backend/src/controllers/transportDataController.js
import { query } from "../config/database.js"

export const getStationsWithVehicles = async (req, res) => {
  try {
    // Obtener todas las Estaciones
    const stationsResult = await query("SELECT * FROM Estacion ORDER BY nombre_ubicacion ASC")
    const stations = stationsResult.rows

    // Obtener todos los vehículos individuales con sus tipos específicos
    const vehiclesResult = await query(
      `SELECT
        vi.id_vehiculo,
        vi.estado,
        vi.id_estacion,
        vi.precio_por_minuto,
        vi.factor_huella_de_carbono,
        CASE
            WHEN b.id_vehiculo IS NOT NULL THEN 'bike'
            WHEN s.id_vehiculo IS NOT NULL THEN 'scooter'
            ELSE NULL
        END AS type,
        s.capacidad_bateria,
        b.estado_llantas
       FROM Vehiculo_individual vi
       LEFT JOIN Bicicleta b ON vi.id_vehiculo = b.id_vehiculo
       LEFT JOIN Scooter s ON vi.id_vehiculo = s.id_vehiculo`,
    )
    const vehicles = vehiclesResult.rows

    // Mapear vehículos a sus Estaciones correspondientes
    const stationsWithVehicles = stations.map((station) => {
      const stationVehicles = vehicles.filter((v) => v.id_estacion === station.id_estacion)
      const availableVehiclesCount = stationVehicles.filter((v) => v.estado === "Disponible").length

      return {
        id: station.id_estacion.toString(),
        name: station.nombre_ubicacion,
        location: { lat: Number.parseFloat(station.latitude), lng: Number.parseFloat(station.longitude) },
        capacity: station.capacidad,
        availableVehicles: availableVehiclesCount,
        vehicles: stationVehicles.map((v) => ({
          id: v.id_vehiculo.toString(),
          type: v.type,
          batteryLevel: v.capacidad_bateria !== null ? Number.parseFloat(v.capacidad_bateria) : null,
          tireStatus: v.estado_llantas || null, // Nuevo campo para bicicletas
          status: v.estado,
          stationId: v.id_estacion.toString(),
          pricePerMinute: Number.parseFloat(v.precio_por_minuto),
          carbonFactor: Number.parseFloat(v.factor_huella_de_carbono),
        })),
        publicTransportRoutes: [], // Se llenará en el frontend
      }
    })

    res.status(200).json({ stations: stationsWithVehicles })
  } catch (error) {
    console.error("Error al obtener estaciones y vehículos individuales:", error)
    res.status(500).json({ message: "Error interno del servidor al obtener datos de transporte." })
  }
}

export const getPublicTransportRoutes = async (req, res) => {
  try {
    // Obtener todas las rutas de transporte público
    const routesResult = await query("SELECT * FROM Ruta ORDER BY nombre ASC")
    const routes = routesResult.rows

    // Para cada ruta, obtener sus paradas en orden
    const routesWithFullData = await Promise.all(
      routes.map(async (route) => {
        const fullRouteResult = await query(
          `SELECT p.nombre_parada
           FROM Ruta_parada rp
           JOIN Parada p ON rp.id_parada = p.id_parada
           WHERE rp.id_ruta = $1
           ORDER BY rp.orden ASC`,
          [route.id_ruta],
        )
        const fullRoute = fullRouteResult.rows.map((row) => row.nombre_parada)

        return {
          id: route.id_ruta.toString(),
          name: route.nombre,
          type: route.tipo_transporte,
          color: route.color,
          estimatedArrival: route.tiempo_estimado_llegada || "N/A",
          destinations: route.destinos_principales || [],
          fullRoute: fullRoute,
        }
      }),
    )

    res.status(200).json({ routes: routesWithFullData })
  } catch (error) {
    console.error("Error al obtener rutas de transporte público:", error)
    res.status(500).json({ message: "Error interno del servidor al obtener rutas de transporte público." })
  }
}
