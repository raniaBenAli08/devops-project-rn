CREATE TABLE attendance_qr_tokens (
    token_date DATE PRIMARY KEY,
    token VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
