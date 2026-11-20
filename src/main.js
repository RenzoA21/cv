// CV de Renzo Acervo: grafo en D3 con scrollytelling.
// El grafo se arma a partir de window.CV (src/cv-data.js). Al bajar por la página,
// la cámara viaja al grupo de nodos de cada sección y el resto se atenúa.
(function () {
  'use strict';
  if (!window.d3 || !window.CV) return;
  var d3 = window.d3, CV = window.CV;

  // ---------- 1. Datos: del árbol a nodos y enlaces ----------
  var R = 130; // distancia entre niveles del árbol radial
  var root = d3.hierarchy(CV.tree);
  d3.tree().size([2 * Math.PI, 1]).separation(function (a, b) {
    return (a.parent === b.parent ? 1 : 1.6) / Math.max(1, a.depth);
  })(root);

  var nodes = root.descendants().map(function (h) {
    var d = h.data, a = h.x - Math.PI / 2, r = h.depth * R, line = d.line;
    for (var p = h; line === undefined && p; p = p.parent) line = p.data.line; // hereda la línea del padre
    var x = Math.cos(a) * r, y = Math.sin(a) * r;
    return {id: d.id, label: d.label, info: d.info || '', hub: !!d.hub, line: line || 0, depth: h.depth,
            parent: h.parent ? h.parent.data.id : null, x: x, y: y, hx: x, hy: y};
  });
  var byId = {};
  nodes.forEach(function (n) { byId[n.id] = n; });

  var links = root.links().map(function (l) {
    var t = byId[l.target.data.id];
    return {source: byId[l.source.data.id], target: t, line: t.line, x: false};
  });
  CV.transfers.forEach(function (t) {
    links.push({source: byId[t[0]], target: byId[t[1]], line: 0, x: true});
  });

  var nbr = {}; // vecinos de cada nodo, para resaltar al pasar el cursor
  nodes.forEach(function (n) { nbr[n.id] = {}; nbr[n.id][n.id] = 1; });
  links.forEach(function (l) { nbr[l.source.id][l.target.id] = 1; nbr[l.target.id][l.source.id] = 1; });

  var stepById = {};
  CV.steps.forEach(function (s) { stepById[s.id] = s; });

  // ---------- 2. Layout: árbol radial como base, afinado con fuerzas ----------
  var sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .distance(function (l) { return l.x ? 150 : (l.target.hub ? R : R * 0.8); })
      .strength(function (l) { return l.x ? 0.03 : 0.5; }))
    .force('charge', d3.forceManyBody().strength(-260))
    .force('collide', d3.forceCollide(30))
    .force('x', d3.forceX(function (d) { return d.hx; }).strength(0.16))
    .force('y', d3.forceY(function (d) { return d.hy; }).strength(0.16))
    .stop();
  for (var i = 0; i < 260; i++) sim.tick();

  // ---------- 3. Dibujo ----------
  var stage = document.getElementById('stage'), svg = d3.select('#graph');
  var tip = document.getElementById('tip'), sign = document.getElementById('sign');
  var W = stage.clientWidth, H = stage.clientHeight, cam = {x: 0, y: 0, k: 1};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function col(l) { return l ? 'var(--l' + l + ')' : 'var(--ink)'; }
  function rad(d) { return d.id === 'root' ? 21 : (d.hub ? 10 : 6.5); }

  var gL = svg.append('g'), gN = svg.append('g'), gT = svg.append('g');
  var linkSel = gL.selectAll('line').data(links).join('line')
    .attr('class', function (d) { return 'link' + (d.x ? ' x' : ''); })
    .attr('pathLength', function (d) { return d.x ? null : 1; })
    .style('--d', function (d) { return d.target.depth - 1; })
    .style('stroke', function (d) { return d.x ? null : col(d.line); })
    .attr('stroke-width', function (d) { return d.x ? 2 : (d.target.hub ? 6 : 4); });

  var nodeSel = gN.selectAll('g').data(nodes).join('g')
    .attr('class', function (d) { return 'node' + (d.id === 'root' ? ' root' : ''); })
    .style('--d', function (d) { return d.depth; });
  nodeSel.filter(function (d) { return d.hub; }).append('circle').attr('class', 'ring')
    .attr('r', 10).style('stroke', function (d) { return col(d.line); });
  nodeSel.append('circle').attr('class', 'dot').attr('r', rad)
    .style('stroke', function (d) { return col(d.line); })
    .attr('stroke-width', function (d) { return d.hub ? 4.5 : 3.2; });
  nodeSel.filter(function (d) { return d.id === 'root'; }).append('text').attr('class', 'ini').text('RA');

  // primero los nodos de sección: sus etiquetas se colocan antes que las de las estaciones
  var labSel = gT.selectAll('text')
    .data(nodes.filter(function (d) { return d.id !== 'root'; }).sort(function (a, b) { return (b.hub ? 1 : 0) - (a.hub ? 1 : 0); }))
    .join('text').attr('class', function (d) { return 'lab' + (d.hub ? ' hub' : ''); })
    .style('--d', function (d) { return d.depth; })
    .text(function (d) { return d.label; });

  function sx(d) { return (d.x - cam.x) * cam.k + W / 2; }
  function sy(d) { return (d.y - cam.y) * cam.k + H / 2; }

  function draw() {
    linkSel.attr('x1', function (d) { return sx(d.source); }).attr('y1', function (d) { return sy(d.source); })
           .attr('x2', function (d) { return sx(d.target); }).attr('y2', function (d) { return sy(d.target); });
    nodeSel.attr('transform', function (d) { return 'translate(' + sx(d) + ',' + sy(d) + ')'; });

    // Etiquetas: cada una prueba cuatro lados y se queda con el que menos choca
    // con otras etiquetas, con otros nodos o con el borde.
    var placed = [], pts = nodes.map(function (n) { return [sx(n), sy(n), n]; });
    labSel.each(function (d) {
      if (this.classList.contains('hide')) return;
      if (!d.w) d.w = this.getComputedTextLength() || d.label.length * 7;
      var p = byId[d.parent], dx = d.x - p.x, dy = d.y - p.y, r = rad(d) + 7, x = sx(d), y = sy(d), w = d.w, h = 16;
      var horiz = Math.abs(dx) >= Math.abs(dy) * 0.8;
      var out = horiz ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'B' : 'T'), opp = {R: 'L', L: 'R', T: 'B', B: 'T'}[out];
      var perp = horiz ? ['T', 'B'] : ['R', 'L'];
      var order = d.hub ? perp.concat([out, opp]) : [out].concat(perp, [opp]);
      var best = null, bs = 1e9;
      for (var i = 0; i < order.length; i++) {
        var c = order[i], cx = x, cy = y, an = 'middle';
        if (c === 'R') { cx = x + r; an = 'start'; } else if (c === 'L') { cx = x - r; an = 'end'; }
        else if (c === 'T') { cy = y - r - 8; } else { cy = y + r + 8; }
        var x0 = an === 'start' ? cx : (an === 'end' ? cx - w : cx - w / 2);
        var rc = [x0 - 3, cy - h / 2 - 2, x0 + w + 3, cy + h / 2 + 2], sc = i * 0.2, j;
        if (rc[0] < 2 || rc[2] > W - 2 || rc[1] < 2 || rc[3] > H - 2) sc += 4;
        for (j = 0; j < placed.length; j++) {
          var q = placed[j];
          if (rc[0] < q[2] && rc[2] > q[0] && rc[1] < q[3] && rc[3] > q[1]) sc += 3;
        }
        for (j = 0; j < pts.length; j++) {
          var t = pts[j];
          if (t[2] !== d && t[0] > rc[0] - 8 && t[0] < rc[2] + 8 && t[1] > rc[1] - 8 && t[1] < rc[3] + 8) sc += 2;
        }
        if (sc < bs) { bs = sc; best = [cx, cy, an, rc]; }
      }
      placed.push(best[3]);
      this.setAttribute('x', best[0]); this.setAttribute('y', best[1]);
      this.setAttribute('text-anchor', best[2]); this.setAttribute('dominant-baseline', 'central');
    });
  }
  sim.on('tick', draw);

  // ---------- 4. Cámara ----------
  // Encuadra un grupo de nodos (o todo el grafo) dentro del escenario.
  function fit(ids) {
    var ns = ids ? ids.map(function (i) { return byId[i]; }) : nodes, narrow = W < 560;
    var x0 = d3.min(ns, function (d) { return d.x; }), x1 = d3.max(ns, function (d) { return d.x; });
    var y0 = d3.min(ns, function (d) { return d.y; }), y1 = d3.max(ns, function (d) { return d.y; });
    var px = narrow ? (ids ? 88 : 40) : (ids ? 150 : 70), py = narrow ? 50 : (ids ? 84 : 96);
    var bw = Math.max(x1 - x0, 60), bh = Math.max(y1 - y0, 60);
    var k = Math.min((W - 2 * px) / bw, (H - 2 * py) / bh);
    k = Math.max(0.28, Math.min(k, ids ? 1.7 : 1.6));
    return {x: (x0 + x1) / 2, y: (y0 + y1) / 2 - (narrow ? 14 / k : 0), k: k}; // en angosto deja sitio al letrero de arriba
  }
  // Viaje suave entre dos encuadres (d3.interpolateZoom aleja, se desplaza y acerca).
  function flyTo(v, instant) {
    svg.interrupt('cam');
    if (instant || reduce) { cam = v; draw(); return; }
    var it = d3.interpolateZoom([cam.x, cam.y, W / cam.k], [v.x, v.y, W / v.k]);
    svg.transition('cam').duration(Math.max(650, Math.min(1400, it.duration))).ease(d3.easeCubicInOut)
      .tween('cam', function () {
        return function (t) { var p = it(t); cam = {x: p[0], y: p[1], k: W / p[2]}; draw(); };
      });
  }

  // ---------- 5. Estado: qué se resalta ----------
  var cur = 'intro', hover = null;
  function paint() {
    var st = stepById[cur], f = st.focus, on = {};
    if (hover) on = nbr[hover.id];
    else if (f) f.forEach(function (i) { on[i] = 1; });
    var all = !hover && !f, hubs = (!hover && st.hubs) || [];

    nodeSel.classed('off', function (d) { return !all && !on[d.id]; })
           .classed('focus', function (d) { return hubs.indexOf(d.id) >= 0; });
    linkSel.classed('off', function (d) { return !all && !(on[d.source.id] && on[d.target.id]); })
           .classed('flow', function (d) { return d.x && !reduce && !all && on[d.source.id] && on[d.target.id]; })
           .style('display', function (d) { return d.x && cur === 'intro' && !hover ? 'none' : null; });
    labSel.classed('off', function (d) { return !all && !on[d.id] && d.hub; })
          .classed('hide', function (d) {
            if (d.hub) return W < 560 && !hover && !f;   // en pantallas angostas, la vista general va sin etiquetas
            if (hover) return !on[d.id];
            return !(f && on[d.id]);
          });

    sign.innerHTML = (st.line ? '<span class="bul b' + st.line + '">' + CV.lines[st.line].bul + '</span>' : '<span class="plain"></span>') + '<span></span>';
    sign.lastChild.textContent = st.sign;
    d3.selectAll('#legend button, #strip button').attr('aria-current', function () { return this.dataset.step === cur ? 'true' : null; });
    var navOf = {intro: null, edu: 'edu', len: 'len', big: 'len', ana: 'len', ml: 'len', pro: 'pro', mas: null, fin: 'fin'}[cur];
    d3.selectAll('.top nav a').attr('aria-current', function () { return this.dataset.go === navOf ? 'true' : null; });
    draw();
  }
  function go(step, instant) { cur = step; paint(); flyTo(fit(stepById[step].focus), instant); }

  // ---------- 6. Navegación: leyenda, recorrido lateral y enlaces ----------
  function scrollToStep(s) {
    var el = document.querySelector('.step[data-step="' + s + '"]');
    if (el) el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: window.matchMedia('(min-width:821px)').matches ? 'center' : 'start'});
  }
  d3.select('#legend').selectAll('button').data(Object.keys(CV.lines)).join('button')
    .attr('type', 'button').attr('data-step', function (l) { return CV.lines[l].step; })
    .html(function (l) { return '<span class="bul b' + l + '" aria-hidden="true">' + CV.lines[l].bul + '</span><span></span>'; })
    .each(function (l) { this.lastChild.textContent = CV.lines[l].name; })
    .on('click', function (e, l) { scrollToStep(CV.lines[l].step); });

  d3.select('#strip').selectAll('button').data(CV.steps).join('button')
    .attr('type', 'button').attr('data-step', function (s) { return s.id; })
    .attr('aria-label', function (s) { return s.sign; })
    .style('--c', function (s) { return s.line ? 'var(--l' + s.line + ')' : null; })
    .html('<span></span>').each(function (s) { this.firstChild.textContent = s.sign; })
    .on('click', function (e, s) { scrollToStep(s.id); });

  d3.selectAll('[data-go]').on('click', function (e) { e.preventDefault(); scrollToStep(this.dataset.go); });

  function stepOf(d) {
    if (d.id === 'root') return 'intro';
    if (d.id === 'hab') return 'len';
    return d.line ? CV.lines[d.line].step : 'intro';
  }

  // ---------- 7. Interacción con los nodos ----------
  function showTip(d) {
    tip.innerHTML = '<b></b><span></span><i></i>';
    tip.children[0].textContent = d.label;
    tip.children[1].textContent = d.info || (d.hub ? 'Sección del CV' : (d.line ? CV.lines[d.line].name : ''));
    var n = Object.keys(nbr[d.id]).length - 1;
    tip.children[2].textContent = n + (n === 1 ? ' conexión' : ' conexiones');
    tip.hidden = false;
    var x = sx(d) + 18, y = sy(d) + 18, w = tip.offsetWidth, h = tip.offsetHeight;
    if (x + w > W - 8) x = sx(d) - w - 18; if (x < 8) x = 8;
    if (y + h > H - 8) y = sy(d) - h - 18; if (y < 8) y = 8;
    tip.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }
  nodeSel
    .on('pointerenter', function (e, d) { if (e.pointerType === 'touch') return; hover = d; paint(); showTip(d); })
    .on('pointerleave', function () { hover = null; tip.hidden = true; paint(); })
    .on('click', function (e, d) { if (e.defaultPrevented) return; scrollToStep(stepOf(d)); });

  // Arrastrar una estación: el resto del grafo se reacomoda y la estación se queda donde se suelta.
  nodeSel.call(d3.drag()
    .filter(function (e) { return e.pointerType !== 'touch' && !e.button; })
    .on('start', function () { tip.hidden = true; })
    .on('drag', function (e, d) {
      if (!d.drag) { d.drag = true; sim.alphaTarget(0.25).restart(); }
      d.fx = d.x + e.dx / cam.k; d.fy = d.y + e.dy / cam.k; d.x = d.fx; d.y = d.fy;
    })
    .on('end', function (e, d) {
      if (!d.drag) return;
      d.drag = false; d.hx = d.x; d.hy = d.y; d.fx = null; d.fy = null;
      sim.force('x').initialize(nodes); sim.force('y').initialize(nodes); sim.alphaTarget(0);
    }));

  // ---------- 8. Scroll: el paso más cercano al centro manda ----------
  var steps = [].slice.call(document.querySelectorAll('.step')), ticking = false;
  function onScroll() {
    ticking = false;
    var wide = window.matchMedia('(min-width:821px)').matches, rs = stage.getBoundingClientRect();
    var mid = wide ? (rs.top + window.innerHeight) / 2 : rs.bottom + (window.innerHeight - rs.bottom) * 0.42;
    var best = null, bd = 1e9;
    steps.forEach(function (s) {
      var r = s.getBoundingClientRect(), c = wide ? (r.top + r.bottom) / 2 : r.top + Math.min(r.height, 160) / 2, d = Math.abs(c - mid);
      if (d < bd) { bd = d; best = s; }
    });
    if (best && best.dataset.step !== cur) {
      steps.forEach(function (s) { s.classList.toggle('on', s === best); });
      go(best.dataset.step);
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});

  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    svg.attr('viewBox', '0 0 ' + W + ' ' + H);
    cam = fit(stepById[cur].focus); paint();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);

  // ---------- 9. Copiar el correo ----------
  document.getElementById('copy').addEventListener('click', function () {
    var b = this, m = document.getElementById('mail');
    function done() { b.textContent = 'Copiado'; setTimeout(function () { b.textContent = 'Copiar'; }, 1600); }
    function sel() { var r = document.createRange(); r.selectNodeContents(m); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(m.textContent).then(done, sel); else sel();
  });

  // ---------- 10. Arranque: las líneas salen del centro ----------
  resize();
  if (!reduce) {
    svg.classed('boot', true);
    setTimeout(function () { svg.classed('boot', false); }, 2300);
  }
  onScroll();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { nodes.forEach(function (n) { n.w = 0; }); draw(); });
  }
})();
