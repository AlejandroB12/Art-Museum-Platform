# Sprint 3 - Modelo del Grafo (Neo4j)

## Redes de Conocimiento y Recomendaciones

### Nodos

| Tipo       | Propiedades                                    | Descripción               |
|------------|------------------------------------------------|---------------------------|
| :Comprador | id_usuario, nombre, apellido, email            | Usuario que compra obras  |
| :Obra      | id_obra, nombre, precio, estado               | Obra de arte              |
| :Artista   | id_artista, nombre, apellido, nacionalidad     | Artista / Autor           |
| :Genero    | nombre                                         | Género artístico          |

### Relaciones

```
(Comprador)-[:COMPRO]->(Obra)
(Artista)-[:CREO]->(Obra)
(Artista)-[:TRABAJA_EN]->(Genero)
```

### Diagrama del Grafo

```
                    ┌─────────────┐
                    │  Comprador  │
                    │ (id_usuario)│
                    └──────┬──────┘
                           │
                      ╔════╧═══╗
                      ║ COMPRO ║
                      ╚════╤═══╝
                           │
                    ┌──────▼──────┐
              ┌────►│    Obra     │◄────┐
              │     │  (id_obra)  │     │
              │     └─────────────┘     │
              │                         │
         ╔════╧═══╗               ╔════╧═══╗
         ║ CREO   ║               ║ CREO   ║
         ╚════╤═══╝               ╚════╤═══╝
              │                         │
       ┌──────▼──────┐                 │
       │   Artista   │─────────────────┘
       │ (id_artista)│
       └──────┬──────┘
              │
         ╔════╧════╗
         ║TRABAJA_EN║
         ╚════╤════╝
              │
       ┌──────▼──────┐
       │   Genero    │
       │  (nombre)   │
       └─────────────┘
```
