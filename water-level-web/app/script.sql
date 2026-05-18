-- Proyecto: Water Level / Panel de Control
-- Sprint: 3 | KR: 3.1
-- Descripción: Script inicial de creación de la Base de Datos
-- ==================================================================================

CREATE DATABASE WaterLevelDB;
GO

USE WaterLevelDB;
GO

-- 1. Tabla de Usuarios (Soporte para Autenticación)
CREATE TABLE Usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BIT DEFAULT 1
);

-- 2. Tabla de Dispositivos (Módulos ESP32 / Tinacos)
CREATE TABLE Dispositivos (
    id_dispositivo INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    identificador_hardware VARCHAR(50) UNIQUE NOT NULL,
    nombre_alias VARCHAR(100) NOT NULL,
    capacidad_total_litros DECIMAL(10,2) NOT NULL,
    ubicacion VARCHAR(255),
    fecha_instalacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);

-- 3. Tabla de Historial de Lecturas (Para Reportes de Consumo)
CREATE TABLE Historial_Lecturas (
    id_lectura BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_dispositivo INT NOT NULL,
    nivel_porcentaje DECIMAL(5,2) NOT NULL, -- Ej: 85.50
    volumen_estimado_litros DECIMAL(10,2),
    timestamp_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_dispositivo) REFERENCES Dispositivos(id_dispositivo) ON DELETE CASCADE
);

-- 4. Tabla de Alertas y Logs (Para el sistema de notificaciones)
CREATE TABLE Alertas (
    id_alerta INT IDENTITY(1,1) PRIMARY KEY,
    id_dispositivo INT NOT NULL,
    tipo_alerta VARCHAR(50) NOT NULL, -- Ej: 'NIVEL_CRITICO', 'DESCONEXION_RED'
    mensaje_log VARCHAR(255) NOT NULL,
    latencia_e2e_ms INT, -- Para el KR de E2E Latency
    timestamp_alerta DATETIME DEFAULT CURRENT_TIMESTAMP,
    resuelta BIT DEFAULT 0,
    FOREIGN KEY (id_dispositivo) REFERENCES Dispositivos(id_dispositivo) ON DELETE CASCADE
);

-- Índices para optimizar las consultas de los reportes semanales
CREATE INDEX IX_Lecturas_Fechas ON Historial_Lecturas(timestamp_registro);
CREATE INDEX IX_Alertas_Dispositivo ON Alertas(id_dispositivo, timestamp_alerta);
GO