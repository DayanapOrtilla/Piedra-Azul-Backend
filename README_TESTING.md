# Testing Strategy

## Unit tests
Se prueban servicios principales del backend: usuarios, pacientes, profesionales, citas, disponibilidad, autenticación y registro de pacientes.

## Coverage
El proyecto genera reporte de cobertura con:

npm run test:cov

## E2E tests
Se agregó una prueba e2e ligera para validar comportamiento HTTP sin depender de PostgreSQL ni Keycloak.

## Seguridad
Para entrega se recomienda complementar con evidencia de OWASP ZAP sobre el frontend/backend desplegado.
