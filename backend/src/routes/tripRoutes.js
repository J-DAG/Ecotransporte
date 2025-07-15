// backend/src/routes/tripRoutes.js
import express from "express"
import {
  createVehicleTrip,
  updateVehicleTrip,
  getVehicleTrips,
  createPublicTransportTrip,
  updatePublicTransportTrip,
  getPublicTransportTrips,
  getCurrentTrip,
  advancePublicTransportTripStation,
} from "../controllers/tripController.js"

const router = express.Router()

// Rutas para viajes de vehículos
router.post("/vehicles", createVehicleTrip)
router.put("/vehicles/:tripId", updateVehicleTrip)
router.get("/vehicles/user/:userId", getVehicleTrips)

// Rutas para viajes de transporte público
router.post("/public-transport", createPublicTransportTrip)
router.put("/public-transport/:tripId", updatePublicTransportTrip)
router.get("/public-transport/user/:userId", getPublicTransportTrips)
router.put("/public-transport/:tripId/advance", advancePublicTransportTripStation)

// Ruta para obtener el viaje en progreso (vehículo o transporte público)
router.get("/current-trip/user/:userId", getCurrentTrip)

export default router
