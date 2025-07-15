// backend/src/routes/transportDataRoutes.js
import express from "express"
import { getStationsWithVehicles, getPublicTransportRoutes } from "../controllers/transportDataController.js"

const router = express.Router()

router.get("/stations-with-vehicles", getStationsWithVehicles)
router.get("/public-transport-routes", getPublicTransportRoutes)

export default router
