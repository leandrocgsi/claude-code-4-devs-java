INSERT INTO address (id, street, city, state, zip_code)
SELECT
    id,
    NULL,
    TRIM(SUBSTRING_INDEX(address, ',', 1)),
    CASE WHEN LOCATE(',', address) > 0
         THEN TRIM(SUBSTRING(address, LOCATE(',', address) + 1))
         ELSE NULL
    END,
    NULL
FROM person
WHERE address IS NOT NULL;

UPDATE person SET address_id = id WHERE address IS NOT NULL;

ALTER TABLE person DROP COLUMN address;
