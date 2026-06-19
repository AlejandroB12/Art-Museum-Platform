# Consultas Cypher Avanzadas - Sprint 3

## 1. Recomendar obras del mismo género que el usuario compró

```
MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(obraComprada:Obra)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
MATCH (g)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(recomendada:Obra)
WHERE NOT EXISTS {
    MATCH (c)-[:COMPRO]->(recomendada)
}
AND recomendada.estado = 'Disponible'
RETURN DISTINCT recomendada.id_obra AS id_Obra,
       recomendada.nombre AS Nombre,
       recomendada.precio AS Precio,
       g.nombre AS Genero
ORDER BY recomendada.precio DESC
LIMIT 10
```

## 2. Artistas más comprados (popularidad)

```
MATCH (c:Comprador)-[:COMPRO]->(:Obra)<-[:CREO]-(a:Artista)
RETURN a.id_artista AS id_Artista,
       a.nombre + ' ' + a.apellido AS Artista,
       COUNT(*) AS ObrasVendidas,
       COUNT(DISTINCT c) AS CompradoresUnicos
ORDER BY ObrasVendidas DESC
LIMIT 10
```

## 3. Géneros más populares por volumen de ventas

```
MATCH (c:Comprador)-[:COMPRO]->(o:Obra)<-[:CREO]-(:Artista)-[:TRABAJA_EN]->(g:Genero)
RETURN g.nombre AS Genero,
       COUNT(o) AS ObrasVendidas,
       COUNT(DISTINCT c) AS CompradoresDistintos,
       ROUND(AVG(o.precio), 2) AS PrecioPromedio,
       ROUND(SUM(o.precio), 2) AS IngresoTotal
ORDER BY ObrasVendidas DESC
```

## 4. Recomendación cruzada: "Otros compradores también compraron"

```
MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(o:Obra)
MATCH (c2:Comprador)-[:COMPRO]->(o)
MATCH (c2)-[:COMPRO]->(recomendada:Obra)
WHERE NOT EXISTS {
    MATCH (c)-[:COMPRO]->(recomendada)
}
AND recomendada.estado = 'Disponible'
RETURN recomendada.id_obra AS id_Obra,
       recomendada.nombre AS Nombre,
       recomendada.precio AS Precio,
       COUNT(DISTINCT c2) AS CantidadCoincidencias
ORDER BY CantidadCoincidencias DESC
LIMIT 10
```

## 5. Catálogo completo de un artista con su género

```
MATCH (a:Artista {id_artista: $idArtista})-[:CREO]->(o:Obra)
OPTIONAL MATCH (a)-[:TRABAJA_EN]->(g:Genero)
RETURN a.nombre + ' ' + a.apellido AS Artista,
       o.id_obra AS id_Obra,
       o.nombre AS Obra,
       o.precio AS Precio,
       o.estado AS Estado,
       COLLECT(DISTINCT g.nombre) AS Generos
ORDER BY o.nombre
```

## 6. Compradores con gustos similares (recomendación social)

```
MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(o:Obra)<-[:COMPRO]-(similar:Comprador)
WHERE similar.id_usuario <> $idUsuario
RETURN similar.id_usuario AS id_Similar,
       similar.nombre + ' ' + similar.apellido AS Comprador,
       COUNT(DISTINCT o) AS ObrasEnComun,
       COLLECT(o.nombre)[0..5] AS EjemplosObras
ORDER BY ObrasEnComun DESC
LIMIT 5
```

## 7. Recorrido completo: Comprador → Obra → Artista → Género

```
MATCH path = (c:Comprador)-[:COMPRO]->(o:Obra)<-[:CREO]-(a:Artista)-[:TRABAJA_EN]->(g:Genero)
RETURN c.nombre + ' ' + c.apellido AS Comprador,
       o.nombre AS Obra,
       a.nombre + ' ' + a.apellido AS Artista,
       g.nombre AS Genero
LIMIT 20
```

## 8. Estadísticas del grafo

```
// Conteo de nodos por tipo
MATCH (n)
RETURN labels(n) AS Tipo, count(n) AS Cantidad
ORDER BY Tipo

// Conteo de relaciones por tipo
MATCH ()-[r]->()
RETURN type(r) AS Tipo, count(r) AS Cantidad
ORDER BY Tipo
```

## 9. Obras disponibles del mismo género (para recomendación en catálogo)

```
MATCH (g:Genero {nombre: $generoNombre})<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(o:Obra)
WHERE o.estado = 'Disponible'
RETURN o.id_obra AS id_Obra,
       o.nombre AS Nombre,
       o.precio AS Precio
ORDER BY o.precio ASC
```

## 10. Recomendación personalizada combinada (género + artista favorito)

```
MATCH (c:Comprador {id_usuario: $idUsuario})-[:COMPRO]->(obraComprada:Obra)
WITH c, obraComprada
MATCH (obraComprada)<-[:CREO]-(artistaFavorito:Artista)
WITH c, COLLECT(DISTINCT artistaFavorito) AS artistasPreferidos
UNWIND artistasPreferidos AS artista
MATCH (artista)-[:TRABAJA_EN]->(g:Genero)
WITH c, COLLECT(DISTINCT g) AS generosPreferidos
UNWIND generosPreferidos AS genero
MATCH (genero)<-[:TRABAJA_EN]-(:Artista)-[:CREO]->(recomendada:Obra)
WHERE NOT EXISTS {
    MATCH (c)-[:COMPRO]->(recomendada)
}
AND recomendada.estado = 'Disponible'
RETURN DISTINCT recomendada.id_obra AS id_Obra,
       recomendada.nombre AS Nombre,
       recomendada.precio AS Precio,
       genero.nombre AS Genero
ORDER BY recomendada.precio DESC
LIMIT 10
```
