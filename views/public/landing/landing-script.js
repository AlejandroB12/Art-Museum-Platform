// ============================================================
// Ilustración del Hero (SVG original — línea de arte + grafo de datos)
// Motivo: un "cuadro" enmarcado cuyas líneas se extienden en nodos,
// representando la obra de arte conectada a los 4 motores de BD.
// ============================================================
function renderHeroArt() {
  const mount = document.getElementById('hero-art');
  if (!mount) return;
  mount.innerHTML = `
  <svg viewBox="0 0 440 440" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#00ff00" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#00ff00" stop-opacity="0.25"/>
      </linearGradient>
      <radialGradient id="spotlightGrad" cx="50%" cy="32%" r="62%">
        <stop offset="0%" stop-color="#00ff00" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#00ff00" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="canvasGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0d1a10"/>
        <stop offset="55%" stop-color="#0a0a0a"/>
        <stop offset="100%" stop-color="#0a0f16"/>
      </linearGradient>
      <linearGradient id="strokeGrad1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#00ff00"/>
        <stop offset="100%" stop-color="#5aa0ff"/>
      </linearGradient>
      <filter id="brushBlur" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="11"/>
      </filter>
    </defs>

    <!-- Luz de galería detrás del cuadro -->
    <ellipse cx="220" cy="168" rx="176" ry="150" fill="url(#spotlightGrad)"/>

    <!-- Marco de cuadro -->
    <rect x="130" y="90" width="180" height="220" rx="2" fill="none" stroke="url(#frameGrad)" stroke-width="2"/>
    <rect x="144" y="104" width="152" height="192" rx="1" fill="url(#canvasGrad)" stroke="#1a1a1a" stroke-width="1"/>

    <!-- Escuadras de esquina: lenguaje "spec sheet" que conecta con el resto del sitio -->
    <g stroke="#00ff00" stroke-width="1.4" opacity="0.55" fill="none">
      <path d="M122,98 v-8 h8"/>
      <path d="M310,90 h8 v8"/>
      <path d="M122,302 v8 h8"/>
      <path d="M318,310 h-8 v8"/>
    </g>

    <!-- "Obra" abstracta: pinceladas con profundidad -->
    <g opacity="0.55" filter="url(#brushBlur)">
      <circle cx="183" cy="152" r="32" fill="#00ff00"/>
      <circle cx="252" cy="232" r="28" fill="#5aa0ff"/>
      <circle cx="232" cy="140" r="20" fill="#c878ff"/>
    </g>
    <polyline points="152,258 184,214 208,244 238,178 288,258" fill="none" stroke="url(#strokeGrad1)"
      stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="263" cy="138" r="13" fill="none" stroke="#5aa0ff" stroke-width="1.6" opacity="0.85"/>

    <!-- Constelación fina: sugiere que la obra ES el dato -->
    <g stroke="#ffffff" stroke-width="0.6" opacity="0.3">
      <line x1="160" y1="130" x2="201" y2="116"/>
      <line x1="201" y1="116" x2="246" y2="126"/>
      <line x1="160" y1="130" x2="174" y2="176"/>
      <line x1="246" y1="126" x2="271" y2="171"/>
    </g>
    <g fill="#ffffff" opacity="0.55">
      <circle cx="160" cy="130" r="1.6"/><circle cx="201" cy="116" r="1.6"/>
      <circle cx="246" cy="126" r="1.6"/><circle cx="174" cy="176" r="1.6"/><circle cx="271" cy="171" r="1.6"/>
    </g>

    <!-- Soporte + placa museográfica -->
    <line x1="220" y1="310" x2="220" y2="327" stroke="#333" stroke-width="1.5"/>
    <rect x="170" y="327" width="100" height="30" rx="3" fill="#0a0a0a" stroke="#222" stroke-width="1"/>
    <text x="220" y="341" text-anchor="middle" font-family="JetBrains Mono" font-size="8" letter-spacing="0.5" fill="#8a8a8a">OBRA N.07 &middot; POLÍGLOTA</text>
    <text x="220" y="352" text-anchor="middle" font-family="JetBrains Mono" font-size="7" fill="#00ff00">TÉCNICA MIXTA / DATOS</text>

    <!-- Nodos de datos irradiando desde la obra (mismas líneas, sin tocar sus coordenadas) -->
    <g stroke="#00ff00" stroke-width="1" opacity="0.5">
      <line x1="130" y1="135" x2="70" y2="95" class="pulse-line"/>
      <line x1="130" y1="230" x2="65" y2="255" class="pulse-line" style="animation-delay:.4s"/>
      <line x1="310" y1="135" x2="368" y2="90" class="pulse-line" style="animation-delay:.8s"/>
      <line x1="310" y1="255" x2="372" y2="300" class="pulse-line" style="animation-delay:1.2s"/>
      <line x1="195" y1="310" x2="150" y2="378" class="pulse-line" style="animation-delay:1.6s"/>
      <line x1="255" y1="310" x2="305" y2="380" class="pulse-line" style="animation-delay:2s"/>
    </g>

    <g font-family="JetBrains Mono" font-size="15" font-weight="700">
      <circle cx="70" cy="95" r="10" fill="#5aa0ff" opacity="0.14"/>
      <circle cx="70" cy="95" r="5" fill="#5aa0ff" class="pulse-node"/>
      <text x="87" y="86" fill="#5aa0ff">Postgres</text>

      <circle cx="65" cy="255" r="10" fill="#00ff00" opacity="0.14"/>
      <circle cx="65" cy="255" r="5" fill="#00ff00" class="pulse-node" style="animation-delay:.4s"/>
      <text x="140" y="263" text-anchor="end" fill="#00ff00">Mongo</text>

      <circle cx="368" cy="90" r="10" fill="#ffc800" opacity="0.14"/>
      <circle cx="368" cy="90" r="5" fill="#ffc800" class="pulse-node" style="animation-delay:.8s"/>
      <text x="355" y="76" text-anchor="end" fill="#ffc800">Cassandra</text>

      <circle cx="372" cy="300" r="10" fill="#c878ff" opacity="0.14"/>
      <circle cx="372" cy="300" r="5" fill="#c878ff" class="pulse-node" style="animation-delay:1.2s"/>
      <text x="366" y="332" text-anchor="end" fill="#c878ff">Neo4j</text>

      <circle cx="150" cy="378" r="4" fill="#555"/>
      <circle cx="305" cy="380" r="4" fill="#555"/>
    </g>

    <!-- Partículas decorativas -->
    <g fill="#00ff00" opacity="0.4">
      <circle cx="100" cy="160" r="2"/>
      <circle cx="345" cy="195" r="2"/>
      <circle cx="215" cy="365" r="2"/>
      <circle cx="85" cy="330" r="2"/>
    </g>
  </svg>`;
}

// ============================================================
// Diagrama de arquitectura (SVG generado dinámicamente)
// ============================================================
function renderDiagram() {
  const mount = document.getElementById('diagram-mount');
  const dbColor = { postgres: '#5aa0ff', mongo: '#00ff00', neo4j: '#c878ff', cassandra: '#ffc800' };
  const dbLabel = { postgres: 'PostgreSQL', mongo: 'MongoDB', neo4j: 'Neo4j', cassandra: 'Cassandra' };

  const cols = 4;
  const svcW = 150, svcH = 60, gapX = 40, gapY = 90;
  const startX = 60, gatewayY = 40, svcY = gatewayY + 120;

  let nodes = '', links = '';
  const gatewayX = (cols * (svcW + gapX) - gapX) / 2 + startX - svcW / 2;
  const nonGateway = SERVICES.filter(s => s.name !== 'gateway');
  const totalRows = Math.ceil(nonGateway.length / cols);

  nonGateway.forEach((s, idx) => {
    const row = Math.floor(idx / cols);
    const itemsInRow = Math.min(cols, nonGateway.length - row * cols);
    const col = idx % cols;
    // Centrar filas que no llenan todas las columnas
    const rowOffset = ((cols - itemsInRow) * (svcW + gapX)) / 2;
    const x = startX + rowOffset + col * (svcW + gapX);
    const y = svcY + row * gapY;
    const color = s.db ? dbColor[s.db] : (s.external ? '#ff8a5c' : '#666');

    links += `<line x1="${gatewayX + svcW/2}" y1="${gatewayY + svcH}" x2="${x + svcW/2}" y2="${y}"
                stroke="#333" stroke-width="1.5"/>`;
    nodes += `
      <g class="svc-node">
        <rect x="${x}" y="${y}" width="${svcW}" height="${svcH}" rx="5" fill="#0a0a0a" stroke="${color}" stroke-width="1.3"/>
        <text x="${x + svcW/2}" y="${y + 24}" text-anchor="middle" fill="#fff" font-size="12" font-family="Inter" font-weight="600">${s.label}</text>
        <text x="${x + svcW/2}" y="${y + 40}" text-anchor="middle" fill="${color}" font-size="10" font-family="JetBrains Mono">:${s.port}</text>
        ${s.db ? `<text x="${x + svcW/2}" y="${y + 53}" text-anchor="middle" fill="${color}" font-size="9" font-family="JetBrains Mono">${dbLabel[s.db]}</text>` : ''}
        ${s.external ? `<text x="${x + svcW/2}" y="${y + 53}" text-anchor="middle" fill="${color}" font-size="8" font-family="JetBrains Mono">${s.external}</text>` : ''}
      </g>`;
  });

  const rows = totalRows;
  const totalH = svcY + rows * gapY + 20;
  const totalW = startX * 2 + cols * (svcW + gapX) - gapX;

  mount.innerHTML = `
    <svg viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg">
      ${links}
      <g>
        <rect x="${gatewayX}" y="${gatewayY}" width="${svcW}" height="${svcH}" rx="5" fill="#0a0a0a" stroke="#00ff00" stroke-width="2"/>
        <text x="${gatewayX + svcW/2}" y="${gatewayY + 24}" text-anchor="middle" fill="#00ff00" font-size="13" font-family="Inter" font-weight="700">API GATEWAY</text>
        <text x="${gatewayX + svcW/2}" y="${gatewayY + 42}" text-anchor="middle" fill="#00ff00" font-size="10" font-family="JetBrains Mono">:3000</text>
      </g>
      ${nodes}
    </svg>`;
}

// ============================================================
// Diccionario de datos (tabs)
// ============================================================
function renderDictionary() {
  const panels = document.getElementById('dict-panels');
  const order = ['sql', 'mongo', 'cassandra', 'neo4j'];
  panels.innerHTML = order.map((key, i) => {
    const s = SCHEMAS[key];
    return `
      <div class="tab-panel ${i === 0 ? 'active' : ''}" data-panel="${key}">
        <p class="schema-note" style="margin-bottom:20px;">${s.note}</p>
        <div class="schema-grid">
          ${s.tables.map(t => `<div class="schema-card"><pre>${escapeHtml(t)}</pre></div>`).join('')}
        </div>
      </div>`;
  }).join('');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`.tab-panel[data-panel="${btn.dataset.tab}"]`).classList.add('active');

      // Asegurar que el inicio del diccionario quede visible, sin que el navbar fijo lo tape
      const section = document.getElementById('diccionario');
      const navH = document.querySelector('.navbar').offsetHeight;
      const top = section.getBoundingClientRect().top + window.scrollY - navH - 16;
      if (section.getBoundingClientRect().top < navH) {
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// Acordeón de APIs
// ============================================================
function renderApiAccordion() {
  const mount = document.getElementById('api-accordion');
  mount.innerHTML = API_GROUPS.map((g, i) => `
    <div class="api-group ${i === 0 ? 'open' : ''}">
      <div class="api-group-head" data-idx="${i}">
        <h4>${g.service}</h4>
        <div style="display:flex;align-items:center;gap:14px;">
          <span class="port">:${g.port}</span>
          <span class="chevron">▾</span>
        </div>
      </div>
      <div class="api-group-body">
        ${g.endpoints.map(([method, path]) => `
          <div class="endpoint-row">
            <span class="method ${method.toLowerCase()}">${method}</span>
            <span class="endpoint-path">${path}</span>
          </div>`).join('')}
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.api-group-head').forEach(head => {
    head.addEventListener('click', () => {
      head.closest('.api-group').classList.toggle('open');
    });
  });
}

// ============================================================
// Live Demo runner (fetch real contra el Gateway del usuario)
// ============================================================
function renderDemoSteps() {
  const mount = document.getElementById('demo-flow');
  mount.innerHTML = DEMO_STEPS.map((s, i) => `
    <div class="demo-step" id="demo-step-${i}">
      <span class="demo-step-num">PASO ${i + 1} · ${s.db}</span>
      <h4>${s.label}</h4>
      <span class="status">En espera</span>
      <pre style="display:none;"></pre>
    </div>
  `).join('');
}

async function runDemo() {
  const base = document.getElementById('api-base').value.replace(/\/$/, '');
  const btn = document.getElementById('btn-run-demo');
  btn.disabled = true;
  btn.textContent = '⏳ Ejecutando...';

  for (let i = 0; i < DEMO_STEPS.length; i++) {
    const step = DEMO_STEPS[i];
    const el = document.getElementById(`demo-step-${i}`);
    el.classList.add('active');
    el.querySelector('.status').textContent = 'Ejecutando…';

    try {
      const opts = { method: step.method, headers: { 'Content-Type': 'application/json' } };
      if (step.body) opts.body = JSON.stringify(step.body);
      const res = await fetch(base + step.path, opts);
      const data = await res.json().catch(() => ({}));

      el.classList.remove('active');
      el.classList.add(res.ok ? 'done' : 'error');
      el.querySelector('.status').textContent = res.ok ? `OK · ${res.status}` : `Error · ${res.status}`;
      const pre = el.querySelector('pre');
      pre.style.display = 'block';
      pre.textContent = JSON.stringify(data, null, 2).slice(0, 400);
    } catch (err) {
      el.classList.remove('active');
      el.classList.add('error');
      el.querySelector('.status').textContent = 'Sin conexión';
      const pre = el.querySelector('pre');
      pre.style.display = 'block';
      pre.textContent = `No se pudo contactar ${base}${step.path}\n${err.message}`;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  btn.disabled = false;
  btn.textContent = '▶ Ejecutar flujo completo';
}

// ============================================================
// Init
// ============================================================
// ============================================================
// Efecto sutil: fade-in + slide-up al entrar en viewport
// ============================================================
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.section-head, .diagram-mount, .schema-card, .api-group, .cap-card, .demo-config, .demo-step, .fault-card, .team-card, .quorum-note, .cta-final'
  );
  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeroArt();
  renderDiagram();
  renderDictionary();
  renderApiAccordion();
  renderDemoSteps();
  document.getElementById('btn-run-demo').addEventListener('click', runDemo);
  initScrollReveal();
});
