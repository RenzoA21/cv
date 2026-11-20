// Contenido del CV. Para actualizarlo se edita solo este archivo (y el texto de index.html).
// El grafo es un árbol (secciones y elementos) más los "transbordos": conexiones entre secciones.
window.CV = {
  // line: número de línea (color). hub: nodo de sección. info: texto que aparece al pasar el cursor.
  tree: {id: 'root', label: 'Renzo Acervo', info: 'Estudiante de Ciencia de Datos · UTEC · Lima, Perú', children: [
    {id: 'edu', label: 'Educación', line: 1, hub: true, children: [
      {id: 'utec', label: 'UTEC', info: 'Bachiller en Ciencia de Datos · 2021 – 2027 (egreso previsto)'},
      {id: 'nord', label: 'Nord Anglia Education', info: 'Diploma del Bachillerato Internacional (IB) · 2019 – 2020'}]},
    {id: 'ext', label: 'Extracurricular', line: 7, hub: true, children: [
      {id: 'csh', label: 'CSH – UTEC', info: 'Miembro de la organización estudiantil de ciberseguridad de UTEC'}]},
    {id: 'idi', label: 'Idiomas', line: 7, hub: true, children: [
      {id: 'es', label: 'Español', info: 'Nativo'},
      {id: 'en', label: 'Inglés', info: 'Avanzado / bilingüe'}]},
    {id: 'cert', label: 'Certificación', line: 7, hub: true, children: [
      {id: 'ibm', label: 'SQL for Data Science', info: 'IBM · 2025'}]},
    {id: 'hab', label: 'Habilidades técnicas', hub: true, info: 'Cuatro líneas: lenguajes, big data, analítica y machine learning', children: [
      {id: 'len', label: 'Lenguajes', line: 2, hub: true, children: [
        {id: 'sql', label: 'SQL'},
        {id: 'cpp', label: 'C++'},
        {id: 'py', label: 'Python', info: 'pandas · NumPy · scikit-learn', children: [
          {id: 'pandas', label: 'pandas'},
          {id: 'numpy', label: 'NumPy'},
          {id: 'sklearn', label: 'scikit-learn'}]}]},
      {id: 'ana', label: 'Analítica & Visualización', line: 4, hub: true, children: [
        {id: 'pbi', label: 'Power BI'},
        {id: 'xls', label: 'Excel avanzado'}]},
      {id: 'ml', label: 'Machine Learning', line: 5, hub: true, children: [
        {id: 'fe', label: 'Feature engineering'},
        {id: 'prep', label: 'Preprocesamiento'},
        {id: 'clf', label: 'Clasificación / regresión'},
        {id: 'val', label: 'Validación de modelos'}]},
      {id: 'big', label: 'Big Data & Cloud', line: 3, hub: true, children: [
        {id: 'spark', label: 'Apache Spark'},
        {id: 'dask', label: 'Dask'},
        {id: 'modin', label: 'Modin'},
        {id: 'aws', label: 'AWS'},
        {id: 'gcp', label: 'Google Cloud Platform'}]}]},
    {id: 'pro', label: 'Proyectos', line: 6, hub: true, children: [
      {id: 'nube', label: 'Datos a gran escala en la nube', info: 'Procesamiento y análisis de datos a gran escala con Google Cloud Platform y AWS'},
      {id: 'kag', label: 'Data science y ML (Kaggle)', info: 'Limpieza, EDA, modelos de clasificación/regresión y evaluación sobre datasets y competencias de Kaggle'}]}
  ]},

  // Conexiones entre secciones (líneas punteadas).
  transfers: [
    ['kag', 'prep'], ['kag', 'clf'], ['kag', 'val'],
    ['nube', 'gcp'], ['nube', 'aws'],
    ['ibm', 'sql'], ['csh', 'utec'], ['sklearn', 'ml']
  ],

  // Líneas del mapa: nombre, letra de la bala y paso del recorrido al que llevan.
  lines: {
    1: {name: 'Educación', bul: 'E', step: 'edu'},
    2: {name: 'Lenguajes', bul: 'L', step: 'len'},
    3: {name: 'Big Data & Cloud', bul: 'B', step: 'big'},
    4: {name: 'Analítica & Visualización', bul: 'A', step: 'ana'},
    5: {name: 'Machine Learning', bul: 'M', step: 'ml'},
    6: {name: 'Proyectos', bul: 'P', step: 'pro'},
    7: {name: 'Certificación, extracurricular e idiomas', bul: '+', step: 'mas'}
  },

  // Pasos del recorrido: qué nodos se enfocan y qué dice el letrero del mapa.
  steps: [
    {id: 'intro', sign: 'Mapa completo', focus: null},
    {id: 'edu', line: 1, sign: 'Educación', focus: ['edu', 'utec', 'nord'], hubs: ['edu']},
    {id: 'len', line: 2, sign: 'Lenguajes', focus: ['len', 'py', 'pandas', 'numpy', 'sklearn', 'cpp', 'sql'], hubs: ['len']},
    {id: 'big', line: 3, sign: 'Big Data & Cloud', focus: ['big', 'gcp', 'aws', 'spark', 'dask', 'modin'], hubs: ['big']},
    {id: 'ana', line: 4, sign: 'Analítica & Visualización', focus: ['ana', 'pbi', 'xls'], hubs: ['ana']},
    {id: 'ml', line: 5, sign: 'Machine Learning', focus: ['ml', 'prep', 'fe', 'clf', 'val'], hubs: ['ml']},
    {id: 'pro', line: 6, sign: 'Proyectos', focus: ['pro', 'kag', 'nube', 'prep', 'clf', 'val', 'gcp', 'aws'], hubs: ['pro']},
    {id: 'mas', line: 7, sign: 'Certificación · Extracurricular · Idiomas', focus: ['cert', 'ibm', 'sql', 'ext', 'csh', 'utec', 'idi', 'es', 'en'], hubs: ['cert', 'ext', 'idi']},
    {id: 'fin', sign: 'Explora el mapa', focus: null}
  ]
};
