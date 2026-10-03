CREATE TABLE positions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    min_salary DECIMAL(15, 2),
    max_salary DECIMAL(15, 2),
    department_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_position_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE INDEX idx_positions_department ON positions(department_id);
CREATE INDEX idx_positions_level ON positions(level);
