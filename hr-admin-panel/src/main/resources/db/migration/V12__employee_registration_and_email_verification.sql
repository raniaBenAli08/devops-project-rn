ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN registration_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN registration_first_name VARCHAR(100),
    ADD COLUMN registration_last_name VARCHAR(100),
    ADD COLUMN registration_phone VARCHAR(30),
    ADD COLUMN registration_date_of_birth DATE;

CREATE TABLE email_verification_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_verification_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_verification_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_users_registration_status ON users(registration_status);
