-- scripts/001_create_tables.sql

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- En un entorno de producción, esto debería ser un hash seguro
    tipo_usuario TEXT NOT NULL DEFAULT 'viajero' -- 'viajero', 'empleado', 'admin'
);

-- Tabla de Estaciones
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    capacity INTEGER NOT NULL
);

-- Tabla de Vehículos
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY, -- Ej: 'BIKE001', 'SCOOTER001'
    type TEXT NOT NULL, -- 'bike', 'scooter'
    battery_level INTEGER, -- NULL para bicicletas, % para scooters
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'in-use', 'maintenance'
    station_id INTEGER REFERENCES stations(id) -- Estación actual donde se encuentra
);

-- Tabla de Viajes de Vehículos (Bicicletas/Scooters)
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id),
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
    vehicle_type TEXT NOT NULL, -- 'bike', 'scooter'
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    start_station TEXT NOT NULL,
    end_station TEXT,
    planned_destination TEXT NOT NULL,
    actual_destination TEXT,
    cost NUMERIC(10, 2),
    carbon_saved NUMERIC(10, 2),
    rating INTEGER, -- 1-5 estrellas
    status TEXT NOT NULL DEFAULT 'in-progress', -- 'in-progress', 'completed'
    suggested_route TEXT[] -- Array de nombres de puntos/estaciones
);

-- Tabla de Rutas de Transporte Público
CREATE TABLE IF NOT EXISTS public_transport_routes (
    id TEXT PRIMARY KEY, -- Ej: 'BUS_R1', 'TRAM_L1'
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- 'bus', 'tram'
    color TEXT NOT NULL, -- Color para identificar la ruta (ej. '#FF5733')
    estimated_arrival TEXT NOT NULL, -- Ej. '5 min', '12:30 PM'
    destinations TEXT[], -- Array de nombres de destinos principales
    full_route TEXT[] -- Array de nombres de todas las estaciones en orden
);

-- Tabla de Viajes de Transporte Público
CREATE TABLE IF NOT EXISTS public_transport_trips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id),
    route_id TEXT NOT NULL REFERENCES public_transport_routes(id),
    route_name TEXT NOT NULL,
    transport_type TEXT NOT NULL, -- 'bus', 'tram'
    start_station TEXT NOT NULL,
    planned_destination TEXT NOT NULL,
    actual_destination TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    current_station_index INTEGER NOT NULL DEFAULT 0, -- Índice de la estación actual en full_route
    full_route TEXT[], -- Copia de la ruta completa para el historial
    status TEXT NOT NULL DEFAULT 'in-progress' -- 'in-progress', 'completed'
);
