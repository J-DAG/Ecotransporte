-- 003_alter_vehicles_battery_level.sql
-- Permite que la columna battery_level en la tabla vehicles sea NULL.
-- Esto es útil para vehículos como bicicletas que no tienen batería.

ALTER TABLE vehicles
ALTER COLUMN battery_level DROP NOT NULL;

-- Opcional: Si ya tienes datos y quieres establecer battery_level a NULL para las bicicletas existentes
-- UPDATE vehicles SET battery_level = NULL WHERE type = 'bike';

-- Nota: En un sistema de producción real, se considerarían tablas separadas
-- para bicicletas y scooters para una mejor normalización de la base de datos.
