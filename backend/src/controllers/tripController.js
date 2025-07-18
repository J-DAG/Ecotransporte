// backend/src/controllers/tripController.js
import { query } from "../config/database.js"

// --- Endpoints para Viajes de Vehículos Individuales (Bicicletas/Scooters) ---

export const createVehicleTrip = async (req, res) => {
  const { userId, vehicleId, startStation, plannedDestination } = req.body

  if (!userId || !vehicleId || !startStation || !plannedDestination) {
    return res.status(400).json({ message: "Faltan campos obligatorios para iniciar el viaje de vehículo individual." })
  }

  let client
  try {
    client = await query("BEGIN") // Iniciar transacción

    // 1. Crear el registro en la tabla Viaje_alquiler
    const tripResult = await query(
      `INSERT INTO Viaje_alquiler (id_usuario, id_vehiculo_individual, origen, destino, estado)
       VALUES ($1, $2, $3, $4, 'in-progress')
       RETURNING id_viaje_alquiler, fecha_hora_inicio`,
      [userId, vehicleId, startStation, plannedDestination],
    )
    const newTripId = tripResult.rows[0].id_viaje_alquiler
    const startTime = tripResult.rows[0].fecha_hora_inicio

    // 2. Actualizar el estado del vehículo a 'Fuera de servicio'
    await query(
      `UPDATE Vehiculo_individual
       SET estado = 'Fuera de servicio'
       WHERE id_vehiculo = $1`,
      [vehicleId],
    )

    await query("COMMIT") // Confirmar transacción

    res.status(201).json({
      message: "Viaje de vehículo individual iniciado.",
      trip: {
        id: newTripId,
        userId,
        vehicleId,
        startStation,
        plannedDestination,
        startTime,
        status: "in-progress",
      },
    })
  } catch (error) {
    if (client) await query("ROLLBACK") // Revertir transacción en caso de error
    console.error("Error al crear viaje de vehículo individual:", error)
    res.status(500).json({
      message: "Error interno del servidor al iniciar viaje.",
    })
  }
}

export const updateVehicleTrip = async (req, res) => {
  const { tripId } = req.params
  const { endStation, actualDestination, rating, status } = req.body // rating ya se recibe

  if (!endStation || !actualDestination || rating === undefined || !status) {
    return res.status(400).json({
      message: "Faltan campos obligatorios para finalizar el viaje de vehículo individual.",
    })
  }

  let client
  try {
    client = await query("BEGIN") // Iniciar transacción

    // 1. Obtener los detalles del viaje y del vehículo individual asociado
    const tripDetailsResult = await query(
      `SELECT
         va.fecha_hora_inicio,
         va.id_vehiculo_individual,
         vi.precio_por_minuto,
         vi.factor_huella_de_carbono
       FROM Viaje_alquiler va
       JOIN Vehiculo_individual vi ON va.id_vehiculo_individual = vi.id_vehiculo
       WHERE va.id_viaje_alquiler = $1`,
      [tripId],
    )

    if (tripDetailsResult.rows.length === 0) {
      await query("ROLLBACK")
      return res.status(404).json({ message: "Viaje de vehículo individual no encontrado." })
    }

    const { fecha_hora_inicio, id_vehiculo_individual, precio_por_minuto, factor_huella_de_carbono } =
      tripDetailsResult.rows[0]

    // Asegurarse de que los valores de la DB sean números antes de calcular
    const parsedPrecioPorMinuto = Number.parseFloat(precio_por_minuto)
    const parsedFactorHuellaCarbono = Number.parseFloat(factor_huella_de_carbono)

    // Calcular la duración del viaje en minutos y horas
    const startTime = new Date(fecha_hora_inicio)
    const endTime = new Date()
    const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    const durationInHours = durationInMinutes / 60

    // Calcular el costo y el carbono ahorrado
    const averageSpeedKmH = 18 // km/h
    const simulatedDistanceKm = durationInHours * averageSpeedKmH

    const calculatedCost = durationInMinutes * parsedPrecioPorMinuto
    const calculatedCarbonSaved = simulatedDistanceKm * parsedFactorHuellaCarbono

    // 2. Actualizar el registro en la tabla Viaje_alquiler
    const result = await query(
      `UPDATE Viaje_alquiler
       SET fecha_hora_fin = NOW(), destino = $1, costo = $2, carbon_ahorrado = $3, calificacion = $4, estado = $5
       WHERE id_viaje_alquiler = $6
       RETURNING *`,
      [actualDestination, calculatedCost.toFixed(2), calculatedCarbonSaved.toFixed(2), rating, status, tripId],
    )

    if (result.rows.length === 0) {
      await query("ROLLBACK")
      return res.status(404).json({ message: "Viaje no encontrado." })
    }

    // 3. Obtener el id_vehiculo_individual del Viaje_alquiler para actualizar su estado
    const vehicleId = id_vehiculo_individual

    if (vehicleId) {
      // 4. Actualizar el estado del vehículo a 'Disponible' y su estación
      // Asumimos que endStation es el nombre de la estación, necesitamos su ID
      const stationResult = await query(`SELECT id_estacion FROM Estacion WHERE nombre_ubicacion = $1`, [endStation])
      const stationId = stationResult.rows[0]?.id_estacion

      if (stationId) {
        await query(
          `UPDATE Vehiculo_individual
           SET estado = 'Disponible', id_estacion = $1
           WHERE id_vehiculo = $2`,
          [stationId, vehicleId],
        )
      } else {
        console.warn(`Estación de destino '${endStation}' no encontrada para actualizar vehículo ${vehicleId}.`)
        // Podrías decidir si esto es un error crítico o si el vehículo simplemente queda sin estación asignada
      }
    }

    await query("COMMIT") // Confirmar transacción

    res.status(200).json({ message: "Viaje de vehículo individual finalizado.", trip: result.rows[0] })
  } catch (error) {
    if (client) await query("ROLLBACK")
    console.error("Error al actualizar viaje de vehículo individual:", error)
    res.status(500).json({ message: "Error interno del servidor al finalizar viaje." })
  }
}

export const getVehicleTrips = async (req, res) => {
  const { userId } = req.params
  if (!userId) {
    return res.status(400).json({ message: "ID de usuario es obligatorio." })
  }

  try {
    const result = await query(
      `SELECT
      va.id_viaje_alquiler AS id,
      va.id_usuario AS user_id,
      va.id_vehiculo_individual AS vehicle_id,
      CASE
          WHEN b.id_vehiculo IS NOT NULL THEN 'bike'
          WHEN s.id_vehiculo IS NOT NULL THEN 'scooter'
          ELSE NULL
      END AS vehicle_type,
      va.fecha_hora_inicio AS start_time,
      va.fecha_hora_fin AS end_time,
      va.origen AS start_station,
      va.destino AS planned_destination,
      va.destino AS actual_destination, -- El destino final es el que se planeó/actualizó
      va.costo,
      va.carbon_ahorrado AS carbon_saved,
      va.calificacion AS rating,
      va.estado AS status
     FROM Viaje_alquiler va
     JOIN Vehiculo_individual vi ON va.id_vehiculo_individual = vi.id_vehiculo
     LEFT JOIN Bicicleta b ON vi.id_vehiculo = b.id_vehiculo
     LEFT JOIN Scooter s ON vi.id_vehiculo = s.id_vehiculo
     WHERE va.id_usuario = $1
     ORDER BY va.fecha_hora_inicio DESC`,
      [userId],
    )
    res.status(200).json({
      trips: result.rows,
    })
  } catch (error) {
    console.error("Error al obtener viajes de vehículo individual:", error)
    res.status(500).json({
      message: "Error interno del servidor al obtener viajes de vehículo individual.",
    })
  }
}

// --- Endpoints para Viajes de Transporte Público (Buses/Tranvías) ---

export const createPublicTransportTrip = async (req, res) => {
  const { userId, routeId, startStation, plannedDestination, fullRoute, currentStationIndex } = req.body

  if (!userId || !routeId || !startStation || !plannedDestination || !fullRoute || currentStationIndex === undefined) {
    return res.status(400).json({ message: "Faltan campos obligatorios para iniciar el viaje en transporte público." })
  }

  let client
  try {
    client = await query("BEGIN") // Iniciar transacción

    // Obtener detalles de la ruta para el nombre y tipo de transporte
    const routeDetails = await query(`SELECT nombre, tipo_transporte FROM Ruta WHERE id_ruta = $1`, [routeId])
    if (routeDetails.rows.length === 0) {
      await query("ROLLBACK")
      return res.status(404).json({ message: "Ruta de transporte público no encontrada." })
    }
    const { nombre: routeName, tipo_transporte: transportType } = routeDetails.rows[0]

    // Asignar un vehículo colectivo disponible de esa ruta (simulación)
    const vehicleColectivoResult = await query(
      `SELECT id_vehiculo_colectivo FROM Vehiculo_colectivo WHERE id_ruta = $1 AND estado = 'Disponible' LIMIT 1`,
      [routeId],
    )
    const idVehiculoColectivo = vehicleColectivoResult.rows[0]?.id_vehiculo_colectivo || null

    if (!idVehiculoColectivo) {
      console.warn(
        `No hay vehículo colectivo disponible para la ruta ${routeId}. El viaje se iniciará sin un vehículo asociado.`,
      )
      // Podrías decidir si esto es un error crítico o si el viaje no se puede iniciar
      await query("ROLLBACK")
      return res.status(400).json({ message: "No hay vehículos disponibles para esta ruta en este momento." })
    }

    // Obtener IDs de parada de inicio y fin
    const startParadaResult = await query(`SELECT id_parada FROM Parada WHERE nombre_parada = $1`, [startStation])
    const startParadaId = startParadaResult.rows[0]?.id_parada
    const endParadaResult = await query(`SELECT id_parada FROM Parada WHERE nombre_parada = $1`, [plannedDestination])
    const endParadaId = endParadaResult.rows[0]?.id_parada

    if (!startParadaId || !endParadaId) {
      await query("ROLLBACK")
      return res.status(400).json({ message: "Parada de inicio o destino no encontrada." })
    }

    // 1. Crear el registro en la tabla Viaje_normal
    const tripResult = await query(
      `INSERT INTO Viaje_normal (id_usuario, id_vehiculo_colectivo, id_parada_inicio, id_parada_fin, origen, destino, estado, current_station_index, ruta_tomada)
       VALUES ($1, $2, $3, $4, $5, $6, 'in-progress', $7, $8)
       RETURNING id_viaje_normal, fecha_hora_inicio`,
      [
        userId,
        idVehiculoColectivo,
        startParadaId,
        endParadaId,
        startStation,
        plannedDestination,
        currentStationIndex,
        fullRoute,
      ],
    )
    const newTripId = tripResult.rows[0].id_viaje_normal
    const startTime = tripResult.rows[0].fecha_hora_inicio

    await query("COMMIT") // Confirmar transacción

    res.status(201).json({
      message: "Viaje en transporte público iniciado.",
      trip: {
        id: newTripId,
        userId,
        routeId,
        routeName,
        transportType,
        startStation,
        plannedDestination,
        startTime,
        currentStationIndex,
        fullRoute,
        status: "in-progress",
        vehicleColectivoId: idVehiculoColectivo,
      },
    })
  } catch (error) {
    if (client) await query("ROLLBACK")
    console.error("Error al crear viaje en transporte público:", error)
    res.status(500).json({ message: "Error interno del servidor al iniciar viaje en transporte público." })
  }
}

export const updatePublicTransportTrip = async (req, res) => {
  const { tripId } = req.params
  const { actualDestination, status, rating } = req.body // rating ya se recibe

  if (!actualDestination || !status || rating === undefined) {
    return res
      .status(400)
      .json({ message: "Faltan campos obligatorios para finalizar el viaje en transporte público." })
  }

  let client
  try {
    client = await query("BEGIN")

    // 1. Obtener los detalles del viaje, las paradas y el vehículo colectivo asociado
    const tripDetailsResult = await query(
      `SELECT
         vn.fecha_hora_inicio,
         vn.id_vehiculo_colectivo,
         vn.id_parada_inicio,
         vn.id_parada_fin,
         vc.precio_por_viaje,
         vc.factor_huella_de_carbono,
         vc.id_ruta
       FROM Viaje_normal vn
       JOIN Vehiculo_colectivo vc ON vn.id_vehiculo_colectivo = vc.id_vehiculo_colectivo
       WHERE vn.id_viaje_normal = $1`,
      [tripId],
    )

    if (tripDetailsResult.rows.length === 0) {
      await query("ROLLBACK")
      return res.status(404).json({ message: "Viaje en transporte público no encontrado." })
    }

    const {
      fecha_hora_inicio,
      id_vehiculo_colectivo,
      id_parada_inicio,
      id_parada_fin,
      precio_por_viaje,
      factor_huella_de_carbono,
      id_ruta,
    } = tripDetailsResult.rows[0]

    // Asegurarse de que los valores de la DB sean números antes de calcular
    const parsedPrecioPorViaje = Number.parseFloat(precio_por_viaje)
    const parsedFactorHuellaCarbono = Number.parseFloat(factor_huella_de_carbono)

    // Obtener el orden de las paradas de inicio y fin
    const startOrderResult = await query(`SELECT orden FROM Ruta_parada WHERE id_ruta = $1 AND id_parada = $2`, [
      id_ruta,
      id_parada_inicio,
    ])
    const endOrderResult = await query(`SELECT orden FROM Ruta_parada WHERE id_ruta = $1 AND id_parada = $2`, [
      id_ruta,
      id_parada_fin,
    ])

    const startOrder = startOrderResult.rows[0]?.orden
    const endOrder = endOrderResult.rows[0]?.orden

    if (startOrder === undefined || endOrder === undefined) {
      console.warn(
        `No se pudo determinar el orden de las paradas para el cálculo de distancia. id_ruta: ${id_ruta}, inicio: ${id_parada_inicio}, fin: ${id_parada_fin}`,
      )
      await query("ROLLBACK")
      return res.status(500).json({ message: "Error al calcular la distancia del viaje." })
    }

    // Calcular la distancia simulada (0.5 km entre paradas)
    const simulatedDistanceKm = Math.abs(endOrder - startOrder) * 0.5

    // Calcular el costo y el carbono ahorrado
    const calculatedCost = parsedPrecioPorViaje // Costo fijo por viaje
    const calculatedCarbonSaved = simulatedDistanceKm * parsedFactorHuellaCarbono // Carbono ahorrado basado en distancia y factor

    // 2. Actualizar el registro en la tabla Viaje_normal
    const result = await query(
      `UPDATE Viaje_normal
       SET fecha_hora_fin = NOW(), destino = $1, estado = $2, costo = $3, carbon_ahorrado = $4, calificacion = $5
       WHERE id_viaje_normal = $6
       RETURNING *`,
      [actualDestination, status, calculatedCost.toFixed(2), calculatedCarbonSaved.toFixed(2), rating, tripId],
    )

    if (result.rows.length === 0) {
      await query("ROLLBACK")
      return res.status(404).json({ message: "Viaje en transporte público no encontrado." })
    }
    await query("COMMIT")

    res.status(200).json({ message: "Viaje en transporte público finalizado.", trip: result.rows[0] })
  } catch (error) {
    if (client) await query("ROLLBACK")
    console.error("Error al actualizar viaje en transporte público:", error)
    res.status(500).json({ message: "Error interno del servidor al finalizar viaje en transporte público." })
  }
}

export const getPublicTransportTrips = async (req, res) => {
  const { userId } = req.params
  if (!userId) {
    return res.status(400).json({ message: "ID de usuario es obligatorio." })
  }

  try {
    const result = await query(
      `SELECT
      vn.id_viaje_normal AS id,
      vn.id_usuario AS user_id,
      vn.id_vehiculo_colectivo AS vehicle_colectivo_id,
      r.id_ruta AS route_id,
      r.nombre AS route_name,
      r.tipo_transporte AS transport_type,
      vn.fecha_hora_inicio AS start_time,
      vn.fecha_hora_fin AS end_time,
      vn.origen AS start_station,
      vn.destino AS planned_destination,
      vn.destino AS actual_destination, -- El destino final es el que se planeó/actualizó
      vn.current_station_index,
      vn.ruta_tomada AS full_route,
      vn.estado AS status,
      vn.costo,
      vn.carbon_ahorrado AS carbon_saved,
      vn.calificacion AS rating
     FROM Viaje_normal vn
     JOIN Vehiculo_colectivo vc ON vn.id_vehiculo_colectivo = vc.id_vehiculo_colectivo
     JOIN Ruta r ON vc.id_ruta = r.id_ruta
     WHERE vn.id_usuario = $1
     ORDER BY vn.fecha_hora_inicio DESC`,
      [userId],
    )
    res.status(200).json({ trips: result.rows })
  } catch (error) {
    console.error("Error al obtener viajes en transporte público:", error)
    res.status(500).json({ message: "Error interno del servidor al obtener viajes en transporte público." })
  }
}

// Endpoint para obtener el viaje en progreso (vehículo o transporte público)
export const getCurrentTrip = async (req, res) => {
  const { userId } = req.params
  if (!userId) {
    return res.status(400).json({ message: "ID de usuario es obligatorio." })
  }

  try {
    // Buscar viaje de vehículo individual en progreso
    const vehicleTripResult = await query(
      `SELECT
      va.id_viaje_alquiler AS id,
      va.id_usuario AS user_id,
      va.id_vehiculo_individual AS vehicle_id,
      CASE
          WHEN b.id_vehiculo IS NOT NULL THEN 'bike'
          WHEN s.id_vehiculo IS NOT NULL THEN 'scooter'
          ELSE NULL
      END AS vehicle_type,
      s.capacidad_bateria AS battery_level, -- Solo para scooters
      b.estado_llantas AS tire_status, -- Solo para bicicletas
      va.fecha_hora_inicio AS start_time,
      va.fecha_hora_fin AS end_time,
      va.origen AS start_station,
      va.destino AS planned_destination,
      va.destino AS actual_destination,
      va.costo,
      va.carbon_ahorrado AS carbon_saved,
      va.calificacion AS rating,
      va.estado AS status
     FROM Viaje_alquiler va
     JOIN Vehiculo_individual vi ON va.id_vehiculo_individual = vi.id_vehiculo
     LEFT JOIN Bicicleta b ON vi.id_vehiculo = b.id_vehiculo
     LEFT JOIN Scooter s ON vi.id_vehiculo = s.id_vehiculo
     WHERE va.id_usuario = $1 AND va.estado = 'in-progress'`,
      [userId],
    )

    if (vehicleTripResult.rows.length > 0) {
      return res.status(200).json({ currentTrip: vehicleTripResult.rows[0], type: "vehicle" })
    }

    // Buscar viaje de transporte público en progreso
    const publicTransportTripResult = await query(
      `SELECT
      vn.id_viaje_normal AS id,
      vn.id_usuario AS user_id,
      vn.id_vehiculo_colectivo AS vehicle_colectivo_id,
      r.id_ruta AS route_id,
      r.nombre AS route_name,
      r.tipo_transporte AS transport_type,
      vn.fecha_hora_inicio AS start_time,
      vn.fecha_hora_fin AS end_time,
      vn.origen AS start_station,
      vn.destino AS planned_destination,
      vn.destino AS actual_destination,
      vn.current_station_index,
      vn.ruta_tomada AS full_route,
      vn.estado AS status,
      vn.costo,
      vn.carbon_ahorrado AS carbon_saved,
      vn.calificacion AS rating
     FROM Viaje_normal vn
     JOIN Vehiculo_colectivo vc ON vn.id_vehiculo_colectivo = vc.id_vehiculo_colectivo
     JOIN Ruta r ON vc.id_ruta = r.id_ruta
     WHERE vn.id_usuario = $1 AND vn.estado = 'in-progress'`,
      [userId],
    )

    if (publicTransportTripResult.rows.length > 0) {
      return res.status(200).json({ currentTrip: publicTransportTripResult.rows[0], type: "public-transport" })
    }

    res.status(200).json({ currentTrip: null }) // No hay viajes en progreso
  } catch (error) {
    console.error("Error al obtener viaje en progreso:", error)
    res.status(500).json({ message: "Error interno del servidor al obtener viaje en progreso." })
  }
}

// Endpoint para avanzar la estación en un viaje de transporte público
export const advancePublicTransportTripStation = async (req, res) => {
  const { tripId } = req.params
  const { currentStationIndex } = req.body

  if (currentStationIndex === undefined || currentStationIndex < 0) {
    return res.status(400).json({ message: "Índice de estación inválido." })
  }

  try {
    const result = await query(
      `UPDATE Viaje_normal
       SET current_station_index = $1
       WHERE id_viaje_normal = $2 AND estado = 'in-progress'
       RETURNING *`,
      [currentStationIndex, tripId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Viaje en progreso no encontrado o ya finalizado." })
    }
    res.status(200).json({ message: "Estación de viaje actualizada.", trip: result.rows[0] })
  } catch (error) {
    console.error("Error al avanzar estación de viaje en transporte público:", error)
    res.status(500).json({ message: "Error interno del servidor al avanzar estación." })
  }
}
