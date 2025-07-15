-- scripts/001_create_tables.sql

-- Tabla de Usuario
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Almacena el hash de la contraseña
    tipo_usuario TEXT NOT NULL DEFAULT 'viajero', -- 'viajero', 'empleado', 'admin'
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Parada (para transporte colectivo: buses, tranvías)
CREATE TABLE IF NOT EXISTS Parada (
    id_parada SERIAL PRIMARY KEY,
    nombre_parada VARCHAR(100) NOT NULL UNIQUE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL
);

-- Tabla de Ruta (para transporte colectivo: buses, tranvías)
CREATE TABLE IF NOT EXISTS Ruta (
    id_ruta SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo_transporte TEXT NOT NULL, -- 'bus', 'tranvia'
    color TEXT NOT NULL, -- Ej. '#4CAF50'
    tiempo_estimado_llegada TEXT, -- Ej. '5 min'
    destinos_principales TEXT[] -- Array de nombres de destinos principales
);

-- Tabla de unión para Ruta y Parada (define el recorrido completo de una ruta)
CREATE TABLE IF NOT EXISTS Ruta_parada (
    id_ruta_parada SERIAL PRIMARY KEY, -- Nueva PK para simplificar
    id_ruta INT NOT NULL REFERENCES Ruta(id_ruta) ON DELETE CASCADE,
    id_parada INT NOT NULL REFERENCES Parada(id_parada) ON DELETE CASCADE,
    orden INT NOT NULL, -- Determina el orden de las paradas en la ruta
    UNIQUE (id_ruta, id_parada) -- Asegura que una parada solo aparezca una vez por ruta
);

-- Tabla de Vehiculo_colectivo (padre para Bus, Tranvia)
CREATE TABLE IF NOT EXISTS Vehiculo_colectivo (
    id_vehiculo_colectivo SERIAL PRIMARY KEY,
    estado VARCHAR(50) CHECK (estado IN ('Disponible','Fuera de servicio')) NOT NULL,
    id_ruta INT REFERENCES Ruta(id_ruta) ON DELETE SET NULL, -- La línea a la que pertenece el vehículo colectivo
    precio_por_viaje DECIMAL(10,2) CHECK (precio_por_viaje >= 0) NOT NULL,
    capacidad_pasajeros INT CHECK (capacidad_pasajeros > 0) NOT NULL,
    factor_huella_de_carbono DECIMAL(10,2) CHECK (factor_huella_de_carbono >= 0) NOT NULL
);

-- Tabla de Bus (hereda de Vehiculo_colectivo)
CREATE TABLE IF NOT EXISTS Bus (
    id_vehiculo INT PRIMARY KEY REFERENCES Vehiculo_colectivo(id_vehiculo_colectivo) ON DELETE CASCADE,
    placa VARCHAR(20) UNIQUE NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    marca VARCHAR(50) NOT NULL
);

-- Tabla de Tranvia (hereda de Vehiculo_colectivo)
CREATE TABLE IF NOT EXISTS Tranvia (
    id_vehiculo INT PRIMARY KEY REFERENCES Vehiculo_colectivo(id_vehiculo_colectivo) ON DELETE CASCADE
);

-- Tabla de Estacion (para vehículos individuales)
CREATE TABLE IF NOT EXISTS Estacion (
    id_estacion SERIAL PRIMARY KEY,
    nombre_ubicacion VARCHAR(100) NOT NULL UNIQUE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    capacidad INTEGER CHECK (capacidad >= 0) NOT NULL -- Capacidad total de vehículos
);

-- Tabla de Vehiculo_individual (padre para Bicicleta, Scooter)
CREATE TABLE IF NOT EXISTS Vehiculo_individual (
    id_vehiculo SERIAL PRIMARY KEY,
    estado VARCHAR(50) CHECK (estado IN ('Disponible','Fuera de servicio')) NOT NULL,
    id_estacion INT REFERENCES Estacion(id_estacion) ON DELETE SET NULL, -- Ubicación actual del vehículo
    precio_por_minuto DECIMAL(10,2) CHECK (precio_por_minuto >= 0) NOT NULL,
    factor_huella_de_carbono DECIMAL(10,2) CHECK (factor_huella_de_carbono >= 0) NOT NULL
);

-- Tabla de Bicicleta (hereda de Vehiculo_individual)
CREATE TABLE IF NOT EXISTS Bicicleta (
    id_vehiculo INT PRIMARY KEY REFERENCES Vehiculo_individual(id_vehiculo) ON DELETE CASCADE,
    estado_llantas TEXT -- Nuevo campo para el estado de las llantas
);

-- Tabla de Scooter (hereda de Vehiculo_individual)
CREATE TABLE IF NOT EXISTS Scooter (
    id_vehiculo INT PRIMARY KEY REFERENCES Vehiculo_individual(id_vehiculo) ON DELETE CASCADE,
    capacidad_bateria DECIMAL(5,2) CHECK (capacidad_bateria >= 0) NOT NULL -- Capacidad de batería en %
);

-- Tabla de Viaje_alquiler (para vehículos individuales: bicicletas, scooters)
CREATE TABLE IF NOT EXISTS Viaje_alquiler (
    id_viaje_alquiler SERIAL PRIMARY KEY, -- Cambiado a SERIAL para auto-incremento
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_vehiculo_individual INT NOT NULL REFERENCES Vehiculo_individual(id_vehiculo) ON DELETE CASCADE,
    origen TEXT NOT NULL, -- Nombre de la estación o ubicación de inicio
    destino TEXT NOT NULL, -- Nombre de la estación o ubicación de destino
    estado TEXT NOT NULL DEFAULT 'in-progress', -- 'in-progress', 'completed', 'cancelled'
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_fin TIMESTAMP WITH TIME ZONE, -- Puede ser NULL si el viaje está en progreso
    costo DECIMAL(10,2), -- Costo total del viaje, puede ser NULL inicialmente
    carbon_ahorrado DECIMAL(10,2), -- CO2 ahorrado, puede ser NULL inicialmente
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5) -- Calificación del viaje, puede ser NULL
);

-- Tabla de Viaje_normal (para transporte colectivo: buses, tranvías)
CREATE TABLE IF NOT EXISTS Viaje_normal (
    id_viaje_normal SERIAL PRIMARY KEY, -- Cambiado a SERIAL para auto-incremento
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_vehiculo_colectivo INT NOT NULL REFERENCES Vehiculo_colectivo(id_vehiculo_colectivo) ON DELETE CASCADE,
    id_parada_inicio INT NOT NULL REFERENCES Parada(id_parada) ON DELETE CASCADE,
    id_parada_fin INT NOT NULL REFERENCES Parada(id_parada) ON DELETE CASCADE,
    origen TEXT NOT NULL, -- Nombre de la parada de inicio
    destino TEXT NOT NULL, -- Nombre de la parada de destino
    estado TEXT NOT NULL DEFAULT 'in-progress', -- 'in-progress', 'completed', 'cancelled'
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_fin TIMESTAMP WITH TIME ZONE, -- Puede ser NULL si el viaje está en progreso
    costo DECIMAL(10,2), -- Costo total del viaje, puede ser NULL inicialmente
    carbon_ahorrado DECIMAL(10,2), -- CO2 ahorrado, puede ser NULL inicialmente
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5), -- Calificación del viaje, puede ser NULL
    current_station_index INTEGER NOT NULL DEFAULT 0, -- Índice de la estación actual en full_route_snapshot
    full_route_snapshot TEXT[] -- Copia de la ruta completa para este viaje específico
);
