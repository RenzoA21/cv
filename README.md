# CV de Renzo Acervo en D3.js

Mi currículum como una visualización: un grafo dibujado como mapa de metro que se recorre con scroll.
Cada línea de color es una sección del CV (educación, lenguajes, big data, machine learning, proyectos…)
y cada estación es un elemento. Las líneas punteadas son los "transbordos": conexiones entre secciones,
por ejemplo qué habilidades usa cada proyecto.

## Cómo verlo

No necesita instalar nada ni un servidor: basta abrir `index.html` en el navegador.

Si prefieres servirlo:

```bash
python3 -m http.server 8000
```

y abrir `http://localhost:8000/`.

## Estructura

```
index.html          Página y texto del CV
src/cv-data.js      Datos del grafo: nodos, transbordos, líneas y pasos del recorrido
src/main.js         Visualización en D3: layout, cámara, scroll e interacción
src/styles.css      Estilos (modo claro y oscuro, versión para celular e impresión)
lib/d3.min.js       D3 v7.9.0 (licencia en lib/LICENSE.d3)
assets/             PDF del CV para descargar
```

## Cómo funciona

- **Layout:** el CV es un árbol (yo → secciones → elementos). Se coloca con `d3.tree` en forma radial y se
  afina con `d3.forceSimulation` para que no se encimen los nodos.
- **Scrollytelling:** el grafo queda fijo y, al bajar, la cámara viaja al grupo de nodos de cada sección
  con `d3.interpolateZoom`. Lo demás se atenúa.
- **Interacción:** pasar el cursor por una estación muestra su detalle y resalta sus conexiones; se puede
  arrastrar; un clic lleva a su sección. La leyenda y las paradas del borde derecho también navegan.
- **Etiquetas:** cada etiqueta prueba cuatro posiciones y se queda con la que menos choca.

## Cómo actualizarlo

1. Editar `src/cv-data.js`: agregar el nodo en `tree` y, si se conecta con otra sección, un par en `transfers`.
2. Agregar el mismo contenido en el texto de `index.html`.
3. Si es una sección nueva, sumarla a `lines` y `steps`, y su color `--l8` en `src/styles.css`.

## Publicarlo en GitHub Pages

```bash
git init
git add .
git commit -m "CV en D3"
git branch -M main
git remote add origin https://github.com/RenzoA21/cv.git
git push -u origin main
```

Luego, en GitHub: Settings → Pages → Source: `main`, carpeta `/ (root)`.
