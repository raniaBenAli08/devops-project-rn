ALTER TABLE users
    ADD CONSTRAINT uk_users_employee_id UNIQUE (employee_id);
