-- =============================================================================
-- PT CHIEF LEVEL INDONESIA - KPI Monitor: MySQL Schema
-- Compatible with Hostinger phpMyAdmin (MySQL 5.7+ / MariaDB 10.3+)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS departments (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','manager','staff') NOT NULL DEFAULT 'staff',
  department_id CHAR(36) DEFAULT NULL,
  avatar_url TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kpis (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  department_id CHAR(36) DEFAULT NULL,
  type ENUM('percentage','currency','numerical') NOT NULL DEFAULT 'numerical',
  timeframe ENUM('weekly','monthly','annually') NOT NULL DEFAULT 'monthly',
  target_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  unit VARCHAR(50),
  start_date DATE DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  assigned_to CHAR(36) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by CHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sub_kpis (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  kpi_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kpi_entries (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  kpi_id CHAR(36) NOT NULL,
  sub_kpi_id CHAR(36) DEFAULT NULL,
  submitted_by CHAR(36) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  actual_value DECIMAL(15,2) NOT NULL,
  notes TEXT,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by CHAR(36) DEFAULT NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  review_notes TEXT,
  score DECIMAL(5,2) DEFAULT NULL,
  issue TEXT,
  priority ENUM('low','medium','high','critical') DEFAULT NULL,
  output TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_entry (kpi_id, sub_kpi_id, submitted_by, period_start, period_end),
  FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE,
  FOREIGN KEY (sub_kpi_id) REFERENCES sub_kpis(id) ON DELETE SET NULL,
  FOREIGN KEY (submitted_by) REFERENCES profiles(id),
  FOREIGN KEY (reviewed_by) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_reports (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  content JSON NOT NULL,
  department_id CHAR(36) DEFAULT NULL,
  generated_by VARCHAR(100) NOT NULL DEFAULT 'openclaw',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_kpis_department ON kpis(department_id);
CREATE INDEX idx_kpis_assigned ON kpis(assigned_to);
CREATE INDEX idx_kpis_schedule ON kpis(start_date, due_date);
CREATE INDEX idx_entries_kpi ON kpi_entries(kpi_id);
CREATE INDEX idx_entries_submitted ON kpi_entries(submitted_by);
CREATE INDEX idx_entries_status ON kpi_entries(status);
CREATE INDEX idx_entries_period ON kpi_entries(period_start, period_end);

SET FOREIGN_KEY_CHECKS = 1;
