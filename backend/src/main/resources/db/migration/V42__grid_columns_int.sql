-- Hibernate maps gridRow/gridCol as Integer; keep the DB type aligned.
ALTER TABLE units
    MODIFY COLUMN grid_row INT NULL,
    MODIFY COLUMN grid_col INT NULL;
