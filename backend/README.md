# ManagementFiles — Backend

API REST para gestión de archivos construida con **FastAPI** y **MongoDB**.

## Stack

- **Python** 3.11+
- **FastAPI** — framework web asíncrono
- **MongoDB** — base de datos (via `pymongo` / `motor`)
- **Uvicorn** — servidor ASGI
- **Pydantic** — validación de datos

## Requisitos

- Python 3.11 o superior
- MongoDB corriendo (local o remoto)
- `venv` (recomendado) o `pip`

## Setup

```bash
cd backend

# Crear y activar virtual env (Windows)
python -m venv venv
.\venv\Scripts\activate

# O en Linux/macOS
# python -m venv venv
# source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

## Configuración

Editar `.env` en la raíz de `backend/`:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
STORAGE_DIR="/app/storage"
```

| Variable | Descripción | Default |
|----------|-------------|---------|
| `MONGO_URL` | URI de conexión a MongoDB | `mongodb://localhost:27017` |
| `DB_NAME` | Nombre de la base de datos | `test_database` |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) | `*` |
| `STORAGE_DIR` | Directorio donde se almacenan los archivos | `/app/storage` |

## Ejecutar

```bash
uvicorn server:app --reload --port 8000
```

El servidor arranca en `http://localhost:8000`.

## Endpoints

Todos los endpoints están bajo el prefijo `/api`:

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/` | Health check / bienvenida |
| `GET` | `/api/files` | Listar archivos (opcional: `?search=query`) |
| `GET` | `/api/files/{path}` | Obtener contenido de un archivo |
| `POST` | `/api/files` | Crear archivo (`{path, content}`) |
| `PUT` | `/api/files/{path}` | Actualizar contenido (`{content}`) |
| `DELETE` | `/api/files/{path}` | Eliminar archivo o carpeta |
| `PUT` | `/api/files/rename` | Renombrar (`{old_path, new_name}`) |
| `POST` | `/api/folders` | Crear carpeta (`{path}`) |

## Documentación interactiva

Con el server corriendo, abrir:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Tests

```bash
pytest
```

## Linting y formato

```bash
black .
isort .
flake8
mypy .
```
