-- Initial Migration: 20260402_initial_schema.sql
-- Motor InnoDB - MySQL 8.0+

CREATE DATABASE IF NOT EXISTS kamel_capacitaciones;
USE kamel_capacitaciones;

-- Table: servicios
CREATE TABLE IF NOT EXISTS servicios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    color_hex VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: cursos
CREATE TABLE IF NOT EXISTS cursos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: colaboradores (Sprint 1 - Base structure)
CREATE TABLE IF NOT EXISTS colaboradores (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(15) NOT NULL UNIQUE,
    servicio_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: asignaciones (Sprint 1 - Base structure)
CREATE TABLE IF NOT EXISTS asignaciones (
    id BIGINT NOT NULL AUTO_INCREMENT,
    colaborador_id BIGINT NOT NULL,
    curso_id BIGINT NOT NULL,
    estado ENUM('Completado', 'En proceso', 'Por coordinar') NOT NULL DEFAULT 'Por coordinar',
    completion_pct INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_colaborador FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    CONSTRAINT fk_curso FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
