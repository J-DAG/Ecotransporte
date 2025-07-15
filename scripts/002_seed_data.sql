-- scripts/002_seed_data.sql

-- Insertar usuario de prueba
INSERT INTO usuarios (nombres, apellidos, email, password_hash, tipo_usuario) VALUES
('Juan', 'Pérez', 'juan@example.com', '123456', 'viajero') -- Contraseña sin hashear para la demo
ON CONFLICT (email) DO NOTHING; -- Evita duplicados si se ejecuta varias veces

-- Insertar estaciones de ejemplo
INSERT INTO stations (name, latitude, longitude, capacity) VALUES
('Estación Central', 40.7128, -74.0060, 20),
('Parque del Sol', 40.7200, -73.9900, 15),
('Plaza Mayor', 40.7050, -74.0150, 10),
('Centro Comercial', 40.7300, -73.9800, 25)
ON CONFLICT (name) DO NOTHING;

-- Insertar vehículos de ejemplo (asumiendo IDs de estaciones existentes)
-- Primero, obtener los IDs de las estaciones para usarlos en las inserciones de vehículos
DO $$
DECLARE
    central_id INTEGER;
    parque_id INTEGER;
    plaza_id INTEGER;
    comercial_id INTEGER;
BEGIN
    SELECT id INTO central_id FROM stations WHERE name = 'Estación Central';
    SELECT id INTO parque_id FROM stations WHERE name = 'Parque del Sol';
    SELECT id INTO plaza_id FROM stations WHERE name = 'Plaza Mayor';
    SELECT id INTO comercial_id FROM stations WHERE name = 'Centro Comercial';

    -- Insertar bicicletas
    INSERT INTO vehicles (id, type, battery_level, status, station_id) VALUES
    ('BIKE001', 'bike', NULL, 'available', central_id),
    ('BIKE002', 'bike', NULL, 'available', central_id),
    ('BIKE003', 'bike', NULL, 'available', parque_id),
    ('BIKE004', 'bike', NULL, 'available', plaza_id)
    ON CONFLICT (id) DO NOTHING;

    -- Insertar scooters
    INSERT INTO vehicles (id, type, battery_level, status, station_id) VALUES
    ('SCOOTER001', 'scooter', 85, 'available', central_id),
    ('SCOOTER002', 'scooter', 70, 'available', parque_id),
    ('SCOOTER003', 'scooter', 95, 'available', plaza_id),
    ('SCOOTER004', 'scooter', 60, 'available', comercial_id)
    ON CONFLICT (id) DO NOTHING;

END $$;

-- Insertar rutas de transporte público de ejemplo
INSERT INTO public_transport_routes (id, name, type, color, estimated_arrival, destinations, full_route) VALUES
('BUS_R1', 'Ruta Verde', 'bus', '#4CAF50', '5 min', ARRAY['Plaza Mayor', 'Centro Comercial'], ARRAY['Estación Central', 'Parque del Sol', 'Plaza Mayor', 'Centro Comercial', 'Terminal Norte']),
('TRAM_L1', 'Línea Azul', 'tram', '#2196F3', '10 min', ARRAY['Estación Central', 'Parque del Sol'], ARRAY['Terminal Sur', 'Plaza Mayor', 'Estación Central', 'Parque del Sol', 'Museo de Arte'])
ON CONFLICT (id) DO NOTHING;

-- No se insertan datos en 'trips' ni 'public_transport_trips' aquí,
-- ya que estos se generan a través de las acciones del usuario en la aplicación.
