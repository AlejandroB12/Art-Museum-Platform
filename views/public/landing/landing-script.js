// ============================================================
// Diagrama de arquitectura (SVG generado dinámicamente)
// ============================================================
function renderDiagram() {
  const mount = document.getElementById('diagram-mount');
  const dbColor = { mysql: '#5aa0ff', mongo: '#00ff00', neo4j: '#c878ff', cassandra: '#ffc800' };
  const dbLabel = { mysql: 'MySQL', mongo: 'MongoDB', neo4j: 'Neo4j', cassandra: 'Cassandra' };

  const cols = 4;
  const svcW = 150, svcH = 60, gapX = 40, gapY = 90;
  const startX = 60, gatewayY = 40, svcY = gatewayY + 120;

  let nodes = '', links = '';
  const gatewayX = (cols * (svcW + gapX) - gapX) / 2 + startX - svcW / 2;

  SERVICES.forEach((s, i) => {
    if (s.name === 'gateway') return;
    const col = (i - 1) % cols;
    const row = Math.floor((i - 1) / cols);
    const x = startX + col * (svcW + gapX);
    const y = svcY + row * gapY;
    const color = s.db ? dbColor[s.db] : '#666';

    links += `<line x1="${gatewayX + svcW/2}" y1="${gatewayY + svcH}" x2="${x + svcW/2}" y2="${y}"
                stroke="#333" stroke-width="1.5"/>`;
    nodes += `
      <g class="svc-node">
        <rect x="${x}" y="${y}" width="${svcW}" height="${svcH}" rx="5" fill="#0a0a0a" stroke="${color}" stroke-width="1.3"/>
        <text x="${x + svcW/2}" y="${y + 24}" text-anchor="middle" fill="#fff" font-size="12" font-family="Inter" font-weight="600">${s.label}</text>
        <text x="${x + svcW/2}" y="${y + 40}" text-anchor="middle" fill="${color}" font-size="10" font-family="JetBrains Mono">:${s.port}</text>
        ${s.db ? `<text x="${x + svcW/2}" y="${y + 53}" text-anchor="middle" fill="${color}" font-size="9" font-family="JetBrains Mono">${dbLabel[s.db]}</text>` : ''}
      </g>`;
  });

  const rows = Math.ceil((SERVICES.length - 1) / cols);
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
document.addEventListener('DOMContentLoaded', () => {
  renderDiagram();
  renderDictionary();
  renderApiAccordion();
  renderDemoSteps();
  document.getElementById('btn-run-demo').addEventListener('click', runDemo);
});
