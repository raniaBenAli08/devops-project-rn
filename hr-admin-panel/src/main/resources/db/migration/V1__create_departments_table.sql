CREATE TABLE departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    head_id BIGINT,
    parent_department_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_department_parent FOREIGN KEY (parent_department_id) REFERENCES departments(id)
);

CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
