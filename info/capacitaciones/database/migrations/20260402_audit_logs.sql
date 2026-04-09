-- Migration: Create audit_logs table for Event Sourcing
-- Date: 2026-04-02

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, etc.
    entity VARCHAR(50) NOT NULL, -- colaboradores, cursos, etc.
    entity_id BIGINT,
    data_json JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Performance Indexes (Sprint 9 Optimization)
CREATE INDEX idx_colab_rut ON colaboradores(rut);
CREATE INDEX idx_asig_colab ON asignaciones(colaborador_id);
CREATE INDEX idx_asig_curso ON asignaciones(curso_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
