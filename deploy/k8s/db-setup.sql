-- Mevcut PostgreSQL sunucunda bir kez çalıştır (superuser ile):
--   psql -h <sunucu> -U postgres -f deploy/k8s/db-setup.sql
-- Tabloları API ilk açılışta kendisi oluşturur.
CREATE ROLE trustnobody WITH LOGIN PASSWORD 'CHANGE_ME';
CREATE DATABASE trustnobody OWNER trustnobody;
\connect trustnobody
ALTER SCHEMA public OWNER TO trustnobody;
