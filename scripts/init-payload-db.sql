-- Runs automatically on the Postgres container's first boot (docker-entrypoint-initdb.d).
-- POSTGRES_DB creates the "medusa" database; Payload gets its own database on the same
-- server so the two services' schemas stay fully separate.
CREATE DATABASE payload;
