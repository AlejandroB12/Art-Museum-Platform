# Sprint 3 - Redes de Conocimiento y Recomendaciones (Neo4j)

**Duración:** Semanas 5 y 6  
**Enfoque:** Relaciones complejas y búsqueda de patrones  
**Contexto:** Entender las preferencias de los visitantes para ofrecer recomendaciones precisas basadas en géneros y artistas

---

## Metas y Entregables

### 1. Modelo del grafo

```
(Comprador)-[:COMPRO]->(Obra)<-[:CREO]-(Artista)-[:TRABAJA_EN]->(Genero)
```

### 2. Archivos incluidos

| Archivo | Descripción |
|---------|-------------|
| `modelo-grafo.md` | Diagrama visual del grafo con nodos, relaciones y propiedades |
| `consultas-cypher-avanzadas.md` | 10 consultas Cypher para recomendaciones y análisis |
| `../../config/neo4j.js` | Conexión a Neo4j Aura DB |
| `../../scripts/seed-neo4j.js` | Script para poblar el grafo desde MySQL y MongoDB |
| `../../routes/Recomendaciones.js` | API REST de recomendaciones personalizadas |

### 3. Consultas destacadas

- **Q1:** Obras del mismo género que el usuario compró
- **Q2:** Artistas más populares por ventas
- **Q3:** Géneros con mejores ingresos
- **Q4:** "Otros compradores también compraron" (filtro colaborativo)
- **Q10:** Recomendación personalizada combinada (género + artista favorito)

### 4. API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/recomendaciones/mismo-genero/:idUsuario` | Obras del mismo género que compró |
| GET | `/api/recomendaciones/colaborativo/:idUsuario` | Filtro colaborativo |
| GET | `/api/recomendaciones/personalizadas/:idUsuario` | Recomendación combinada |
| GET | `/api/recomendaciones/artistas-populares` | Artistas más vendidos |
| GET | `/api/recomendaciones/generos-populares` | Géneros más populares |
| GET | `/api/grafo/estadisticas` | Estadísticas del grafo |

---

## Instrucciones

1. Configurar credenciales en `.env`:
   ```
   NEO4J_URI=neo4j+s://<tu-instancia>.databases.neo4j.io
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=tu_contraseña_neo4j
   ```

2. Poblar el grafo:
   ```bash
   npm run seed:neo4j
   ```

3. Iniciar servidor:
   ```bash
   npm run dev
   ```

4. Probar recomendaciones:
   ```bash
   npm run recomendaciones
   ```
