CREATE TABLE address (
    id BIGINT NOT NULL AUTO_INCREMENT,
    street VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    zip_code VARCHAR(255),
    PRIMARY KEY (id)
);

ALTER TABLE person ADD COLUMN address_id BIGINT;

ALTER TABLE person ADD CONSTRAINT fk_person_address FOREIGN KEY (address_id) REFERENCES address (id);
