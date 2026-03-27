# Piedra Azul Backend

Backend API para el sistema de gestión de citas médicas "Piedra Azul", desarrollado con NestJS.

## Descripción

Este proyecto es una aplicación backend construida con NestJS que proporciona una API REST para gestionar citas médicas, incluyendo módulos para profesionales, pacientes, citas y disponibilidades entre otras.

## Tecnologías Utilizadas

- **NestJS**: Framework para Node.js
- **TypeScript**: Lenguaje de programación
- **TypeORM**: ORM para bases de datos
- **PostgreSQL**: Base de datos
- **Docker**: Contenedorización
- **Jest**: Framework de testing
- **ESLint**: Linting de código
- **Prettier**: Formateo de código

## Requisitos Previos

- Node.js (versión 18 o superior)
- npm o yarn
- Docker y Docker Compose (requerido para ejecutar la base de datos PostgreSQL)

### Instalación de Docker

Si no tienes Docker instalado, sigue estos pasos:

#### En Windows:
1. Descarga Docker Desktop desde [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Instala el ejecutable descargado
3. Inicia Docker Desktop y asegúrate de que esté corriendo

#### En macOS:
1. Descarga Docker Desktop desde [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Instala el ejecutable descargado
3. Inicia Docker Desktop

#### En Linux:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Agrega tu usuario al grupo docker (opcional)
sudo usermod -aG docker $USER
```

Verifica la instalación:
```bash
docker --version
docker-compose --version
```

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd piedra-azul-back
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos

#### Opción A: Usar Docker Compose (Recomendado)

Ejecuta el siguiente comando para iniciar la base de datos PostgreSQL en un contenedor:

```bash
docker-compose up -d
```

Esto iniciará PostgreSQL en el puerto 5433.

#### Opción B: Base de datos local

Si prefieres usar una instalación local de PostgreSQL, asegúrate de tenerla corriendo y configura las variables de entorno según tu configuración.

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=user
DB_PASSWORD=password
DB_NAME=piedra_azul_db
```

Si usas una base de datos local, ajusta los valores según tu configuración.

## Ejecutar el Proyecto

### Modo desarrollo

```bash
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Modo producción

```bash
npm run build
npm run start:prod
```

### Modo debug

```bash
npm run start:debug
```

## Testing

### Ejecutar tests unitarios

```bash
npm run test
```

### Ejecutar tests en modo watch

```bash
npm run test:watch
```

### Ejecutar tests de cobertura

```bash
npm run test:cov
```

### Ejecutar tests end-to-end

```bash
npm run test:e2e
```

## Linting y Formateo

### Ejecutar ESLint

```bash
npm run lint
```

### Formatear código con Prettier

```bash
npm run format
```

## Estructura del Proyecto

```
src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── main.ts
├── modules/
│   ├── appointments/
│   │   ├── appointments.module.ts
│   │   ├── controllers/
│   │   │   └── appointments.controller.ts
│   │   ├── dto/
│   │   │   └── create-appointment.dto.ts
│   │   ├── entities/
│   │   │   └── appointment.entity.ts
│   │   └── services/
│   │       └── appointments.service.ts
│   ├── availabilities/
│   │   ├── availabilities.module.ts
│   │   ├── controllers/
│   │   │   └── availabilities.controller.ts
│   │   ├── dto/
│   │   │   └── update-availability.dto.ts
│   │   ├── entities/
│   │   │   └── availability.entity.ts
│   │   └── services/
│   │       └── availability.service.ts
│   ├── patients/
│   │   ├── patients.module.ts
│   │   ├── controllers/
│   │   │   └── patients.controller.ts
│   │   ├── dto/
│   │   │   └── create-patient.dto.ts
│   │   ├── entities/
│   │   │   └── patient.entity.ts
│   │   └── services/
│   │       └── patients.service.ts
│   └── professionals/
│       ├── professionals.module.ts
│       ├── controllers/
│       │   └── professionals.controller.ts
│       ├── dto/
│       │   └── create-professional.dto.ts
│       ├── entities/
│       │   └── professional.entity.ts
│       └── services/
│           └── professionals.service.ts
└── shared/
    └── enum/
        ├── appointment-status.enum.ts
        ├── patient-gender.enum.ts
        ├── professional-speciality.enum.ts
        └── professional-type.enum.ts
```

## API Endpoints

La API proporciona endpoints para:

- **Profesionales**: CRUD de profesionales médicos
- **Pacientes**: CRUD de pacientes
- **Citas**: Gestión de citas médicas
- **Disponibilidades**: Gestión de horarios disponibles

## Contribución

1. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
2. Realiza tus cambios
3. Ejecuta los tests (`npm run test`)
4. Ejecuta el linter (`npm run lint`)
5. Haz commit de tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
6. Push a la rama (`git push origin feature/nueva-funcionalidad`)
7. Crea un Pull Request

## Licencia

Este proyecto está bajo la licencia UNLICENSED.

