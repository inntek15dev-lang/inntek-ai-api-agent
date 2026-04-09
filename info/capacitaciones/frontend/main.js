const API_URL = 'http://localhost:3000/api/v1';

const SVC_COLORS = {
  'Doc. Controlada': '#1F4E79',
  'INNTEK': '#2E75B6',
  'RyCE': '#5B9BD5',
  'Transversal': '#7030A0',
  'Verif. Chile': '#375623',
  'Verif. Uruguay': '#70AD47',
};

let collaborators = [];
let selectedPerson = null;
let currentFilter = 'Todos';
let currentSearch = '';
let currentCourseFilter = 'all';

/**
 * Fetch collaborators from API
 */
async function fetchCollaborators() {
  const peopleList = document.getElementById('peopleList');
  if (!peopleList.querySelector('.loader')) {
    // optional: add a small loading overlay or just wait
  }

  try {
    const response = await fetch(`${API_URL}/colaboradores?servicio=${currentFilter}&q=${currentSearch}`, {
      headers: { 'Authorization': `Bearer MOCK_TOKEN_SPRINT_2` }
    });
    if (!response.ok) throw new Error('Error en la carga');
    collaborators = await response.json();
    renderList();
    updateGlobalKPIs();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Render the sidebar list
 */
function renderList() {
  const list = document.getElementById('peopleList');
  list.innerHTML = '';

  if (collaborators.length === 0) {
    list.innerHTML = '<div class="no-results">Sin resultados</div>';
    return;
  }

  collaborators.forEach((p, i) => {
    const compPct = p.total > 0 ? (p.completados / p.total * 100) : 0;
    const procPct = p.total > 0 ? (p.en_proceso / p.total * 100) : 0;
    const color = SVC_COLORS[p.servicio] || '#888';
    
    const card = document.createElement('div');
    card.className = `person-card ${selectedPerson?.id === p.id ? 'active' : ''}`;
    card.onclick = () => selectPerson(p.id, card);
    
    card.innerHTML = `
      <div class="avatar" style="background:${color}">${getInitials(p.nombre)}</div>
      <div class="person-info">
        <div class="person-name">${p.nombre}</div>
        <div class="person-meta">
          <div class="svc-dot" style="background:${color}"></div>
          <span>${p.servicio}</span>
        </div>
        <div class="mini-prog">
          <div class="mini-prog-bar" style="width:${compPct}%;background:#4ade80"></div>
          <div class="mini-prog-bar" style="width:${procPct}%;background:#facc15"></div>
        </div>
      </div>
      <div class="person-count">${p.total}</div>
    `;
    list.appendChild(card);
  });
}

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

/**
 * Update global KPIs
 */
function updateGlobalKPIs() {
  const total = collaborators.reduce((acc, p) => acc + p.total, 0);
  const comp = collaborators.reduce((acc, p) => acc + p.completados, 0);
  document.getElementById('kpi-asig').textContent = total;
  document.getElementById('kpi-comp').textContent = comp;
}

/**
 * Fetch and render person detail (Sprint 4)
 */
async function selectPerson(id, cardEl) {
  document.querySelectorAll('.person-card').forEach(c => c.classList.remove('active'));
  if (cardEl) cardEl.classList.add('active');

  const panel = document.getElementById('rightPanel');
  panel.innerHTML = '<div class="loader">Cargando detalles...</div>';

  try {
    const response = await fetch(`${API_URL}/colaboradores/${id}`, {
      headers: { 'Authorization': `Bearer MOCK_TOKEN_SPRINT_2` }
    });
    if (!response.ok) throw new Error('No se pudo obtener el detalle');
    
    selectedPerson = await response.json();
    renderDetail();
  } catch (error) {
    panel.innerHTML = `<div class="loader">Error: ${error.message}</div>`;
  }
}

function renderDetail() {
  const p = selectedPerson;
  const color = SVC_COLORS[p.servicio] || '#888';
  const compPct = p.total > 0 ? Math.round(p.completados / p.total * 100) : 0;
  const panel = document.getElementById('rightPanel');

  panel.innerHTML = `
    <div class="detail-header">
      <div class="detail-avatar" style="background:${color}">${getInitials(p.nombre)}</div>
      <div>
        <div class="detail-name">${p.nombre}</div>
        <div class="detail-sub">
          <span class="svc-badge" style="background:${color}">● ${p.servicio}</span>
          ${p.rut ? `<span class="rut-badge">RUT: ${p.rut}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-box total">
        <div class="stat-val">${p.total}</div>
        <div class="stat-lbl">Asignadas</div>
      </div>
      <div class="stat-box comp">
        <div class="stat-val">${p.completados}</div>
        <div class="stat-lbl">Completas</div>
      </div>
      <div class="stat-box proc">
        <div class="stat-val">${p.en_proceso}</div>
        <div class="stat-lbl">En proceso</div>
      </div>
      <div class="stat-box pend">
        <div class="stat-val">${p.por_coordinar}</div>
        <div class="stat-lbl">A coordinar</div>
      </div>
    </div>

    <div class="prog-section">
      <div class="prog-header">
        <span class="prog-title">Avance general</span>
        <span class="prog-pct">${compPct}%</span>
      </div>
      <div class="prog-bar-outer">
        <div class="prog-bar-inner" style="width:${compPct}%;background:linear-gradient(90deg,#4ade80,#22c55e)"></div>
      </div>
    </div>

    <div class="courses-title">
      Capacitaciones asignadas
      <span class="count-badge">${p.total}</span>
    </div>
    <div class="course-filter-row" id="courseFilters">
      <button class="cfbtn ${currentCourseFilter === 'all' ? 'active-all' : ''}" data-type="all">Todas (${p.total})</button>
      <button class="cfbtn ${currentCourseFilter === 'comp' ? 'active-comp' : ''}" data-type="comp">✓ (${p.completados})</button>
      <button class="cfbtn ${currentCourseFilter === 'proc' ? 'active-proc' : ''}" data-type="proc">⟳ (${p.en_proceso})</button>
      <button class="cfbtn ${currentCourseFilter === 'pend' ? 'active-pend' : ''}" data-type="pend">○ (${p.por_coordinar})</button>
    </div>
    <div class="courses-grid" id="coursesGrid"></div>
  `;

  renderCourses();

  // Detail event listener for course filters
  document.getElementById('courseFilters').onclick = (e) => {
    if (e.target.classList.contains('cfbtn')) {
      currentCourseFilter = e.target.dataset.type;
      renderDetail(); // Re-render to update active buttons and grid
    }
  };
}

function renderCourses() {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;

  const filtered = currentCourseFilter === 'all' ? selectedPerson.cursos :
    selectedPerson.cursos.filter(c => {
      if (currentCourseFilter === 'comp') return c.estado === 'Completado';
      if (currentCourseFilter === 'proc') return c.estado === 'En proceso';
      if (currentCourseFilter === 'pend') return c.estado === 'Por coordinar';
      return true;
    });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-results" style="grid-column:1/-1">Sin resultados en este filtro</div>';
    return;
  }

  filtered.forEach((c, i) => {
    const sc = c.estado === 'Completado' ? 'comp' : c.estado === 'En proceso' ? 'proc' : 'pend';
    
    const div = document.createElement('div');
    div.className = 'course-item';
    div.style.animationDelay = `${i * 0.03}s`;
    div.innerHTML = `
      <div class="course-num ${sc}">${i + 1}</div>
      <div class="course-text">
        <div class="course-name">${c.nombre}</div>
        <select class="status-select" onchange="updateCourseStatus(${c.asig_id}, this.value)">
          <option value="Por coordinar" ${c.estado === 'Por coordinar' ? 'selected' : ''}>○ Por coordinar</option>
          <option value="En proceso" ${c.estado === 'En proceso' ? 'selected' : ''}>⟳ En proceso</option>
          <option value="Completado" ${c.estado === 'Completado' ? 'selected' : ''}>✓ Completado</option>
        </select>
      </div>
    `;
    grid.appendChild(div);
  });
}

/**
 * Update course status via API (Sprint 5)
 */
window.updateCourseStatus = async (asigId, newStatus) => {
  try {
    const response = await fetch(`${API_URL}/asignaciones/${asigId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer MOCK_TOKEN_SPRINT_2`
      },
      body: JSON.stringify({ 
        estado: newStatus,
        completion_pct: newStatus === 'Completado' ? 100 : (newStatus === 'En proceso' ? 50 : 0)
      })
    });

    if (!response.ok) throw new Error('Error al actualizar');
    
    // Refresh detail and list
    await selectPerson(selectedPerson.id);
    fetchCollaborators();
  } catch (error) {
    alert('Error actualizando estado: ' + error.message);
  }
};

/**
 * Event Listeners & Global View Logic (Sprint 6)
 */
document.getElementById('searchInput').addEventListener('input', (e) => {
  currentSearch = e.target.value;
  fetchCollaborators().then(() => {
    if (document.getElementById('tableView').classList.contains('active-view')) {
      renderGlobalTable();
    }
  });
});

document.getElementById('filterTabs').addEventListener('click', (e) => {
  if (e.target.classList.contains('ftab')) {
    document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.svc;
    fetchCollaborators().then(() => {
      if (document.getElementById('tableView').classList.contains('active-view')) {
        renderGlobalTable();
      }
    });
  }
});

document.getElementById('btnSplitView').onclick = () => toggleView('splitView');
document.getElementById('btnTableView').onclick = () => toggleView('tableView');
document.getElementById('btnExportCSV').onclick = () => exportToCSV();

function toggleView(viewId) {
  document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
  document.getElementById(viewId).classList.add('active-view');
  document.querySelectorAll('.vbtn').forEach(b => b.classList.remove('active'));
  if (viewId === 'splitView') document.getElementById('btnSplitView').classList.add('active');
  else {
    document.getElementById('btnTableView').classList.add('active');
    renderGlobalTable();
  }
}

function renderGlobalTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  collaborators.forEach(p => {
    const compPct = p.total > 0 ? Math.round(p.completados / p.total * 100) : 0;
    const color = SVC_COLORS[p.servicio] || '#888';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.nombre}</strong></td>
      <td><span class="table-svc-badge" style="background:${color}">${p.servicio}</span></td>
      <td>${p.total}</td>
      <td>${p.completados}</td>
      <td>${p.en_proceso}</td>
      <td class="table-prog-cell">
        <span class="table-prog-text">${compPct}%</span>
        <div class="table-prog-outer"><div class="table-prog-inner" style="width:${compPct}%;background:#4ade80"></div></div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function exportToCSV() {
  if (collaborators.length === 0) return alert('No hay datos para exportar');
  const headers = ['Nombre', 'RUT', 'Servicio', 'Asignadas', 'Completadas', 'En Proceso', 'Avance %'];
  const csv = [headers, ...collaborators.map(p => [
    p.nombre, p.rut || 'N/A', p.servicio, p.total, p.completados, p.en_proceso,
    Math.round(p.completados / (p.total || 1) * 100)
  ])].map(e => e.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte_kamel_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
}

document.getElementById('tableHeaders').onclick = (e) => {
  const sortKey = e.target.dataset.sort;
  if (!sortKey) return;
  collaborators.sort((a, b) => {
    let vA = a[sortKey], vB = b[sortKey];
    if (sortKey === 'avance') { vA = a.completados/(a.total||1); vB = b.completados/(b.total||1); }
    return typeof vA === 'string' ? vA.localeCompare(vB) : vB - vA;
  });
  renderGlobalTable();
};

/**
 * ADMIN PANEL LOGIC (SPRINT 7)
 */
const adminModal = document.getElementById('adminModal');
const btnAdmin = document.getElementById('btnAdmin');
const btnCloseAdmin = document.getElementById('btnCloseAdmin');
const adminContent = document.getElementById('adminContent');
let currentAdminTab = 'servicios';

btnAdmin.onclick = () => {
  adminModal.classList.remove('hidden');
  loadAdminTab(currentAdminTab);
};

btnCloseAdmin.onclick = () => adminModal.classList.add('hidden');

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.onclick = (e) => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active', 'bg-azul1'));
    e.target.classList.add('active', 'bg-azul1');
    currentAdminTab = e.target.dataset.tab;
    loadAdminTab(currentAdminTab);
  };
});

async function loadAdminTab(type) {
  adminContent.innerHTML = '<div class="p-8 text-center text-white/50">Cargando...</div>';
  try {
    const response = await fetch(`${API_URL}/admin/${type}`, {
      headers: { 'Authorization': `Bearer MOCK_TOKEN_SPRINT_2` }
    });
    const data = await response.json();
    renderAdminUI(type, data);
  } catch (error) {
    adminContent.innerHTML = `<div class="p-8 text-red-400">Error: ${error.message}</div>`;
  }
}

function renderAdminUI(type, data) {
  const isSvc = type === 'servicios';
  const isCurso = type === 'cursos';
  const isColab = type === 'colaboradores';
  const isAsig = type === 'asignaciones';

  if (isAsig) return renderAsignacionesUI();

  adminContent.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold uppercase tracking-widest">${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
      ${!isAsig ? `<button onclick="showAdminForm('${type}')" class="bg-verde1 hover:bg-verde2 px-4 py-2 rounded-lg text-sm font-bold transition-all">+ Nuevo</button>` : ''}
    </div>
    
    <div class="space-y-4">
      ${data.map(item => `
        <div class="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-white/20 transition-all">
          <div class="flex items-center gap-4">
            ${isSvc ? `<div class="w-4 h-4 rounded-full" style="background:${item.color_hex}"></div>` : ''}
            <div>
              <div class="font-medium">${item.nombre}</div>
              ${isColab ? `<div class="text-xs text-white/40">${item.rut} | ${item.servicio}</div>` : ''}
            </div>
          </div>
          <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="showAdminForm('${type}', ${item.id}, ${JSON.stringify(item).replace(/"/g, '&quot;')})" class="p-2 hover:bg-white/10 rounded-lg text-azul3">✎</button>
            <button onclick="deleteAdminItem('${type}', ${item.id})" class="p-2 hover:bg-red-500/20 rounded-lg text-red-400">✕</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

window.showAdminForm = async (type, id = null, item = null) => {
  const isSvc = type === 'servicios';
  const isColab = type === 'colaboradores';
  
  let services = [];
  if (isColab) {
    const res = await fetch(`${API_URL}/admin/servicios`, { headers: { 'Authorization': `Bearer MOCK_TOKEN_SPRINT_2` } });
    services = await res.json();
  }

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  overlay.innerHTML = `
    <div class="bg-surface2 w-full max-w-md rounded-2xl border border-white/20 p-8 shadow-2xl">
      <h4 class="text-xl font-serif mb-6">${id ? 'Editar' : 'Nuevo'} ${type.slice(0,-1)}</h4>
      <div class="space-y-4">
        <div>
          <label class="block text-xs uppercase text-white/50 mb-2">Nombre Completo</label>
          <input id="form-nombre" type="text" value="${item?.nombre || ''}" class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-azul3 transition-all">
        </div>
        ${isColab ? `
          <div>
            <label class="block text-xs uppercase text-white/50 mb-2">RUT (sin puntos, con guion)</label>
            <input id="form-rut" type="text" value="${item?.rut || ''}" placeholder="12345678-K" class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-azul3 transition-all">
          </div>
          <div>
            <label class="block text-xs uppercase text-white/50 mb-2">Servicio</label>
            <select id="form-servicio" class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-azul3 transition-all">
              ${services.map(s => `<option value="${s.id}" ${s.id === item?.servicio_id ? 'selected' : ''}>${s.nombre}</option>`).join('')}
            </select>
          </div>
        ` : ''}
        ${isSvc ? `
          <div>
            <label class="block text-xs uppercase text-white/50 mb-2">Color Corporativo</label>
            <input id="form-color" type="color" value="${item?.color_hex || '#1F4E79'}" class="w-full h-12 bg-white/5 border border-white/10 rounded-lg p-1 cursor-pointer">
          </div>
        ` : ''}
      </div>
      <div class="flex gap-3 mt-8">
        <button id="btnCancelForm" class="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl transition-colors">Cancelar</button>
        <button id="btnSaveForm" class="flex-1 bg-azul3 hover:brightness-110 py-3 rounded-xl font-bold transition-all shadow-lg shadow-azul3/20">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('btnCancelForm').onclick = () => overlay.remove();
  document.getElementById('btnSaveForm').onclick = async () => {
    const data = {
      nombre: document.getElementById('form-nombre').value,
      rut: isColab ? document.getElementById('form-rut').value : undefined,
      servicio_id: isColab ? document.getElementById('form-servicio').value : undefined,
      color_hex: isSvc ? document.getElementById('form-color').value : undefined
    };
    
    const res = await fetch(`${API_URL}/${isColab ? 'colaboradores' : 'admin/' + type}/${id || ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer MOCK_TOKEN_SPRINT_2` },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      return alert('Error: ' + (err.message || 'Error desconocido'));
    }

    overlay.remove();
    loadAdminTab(type);
    if (isColab) fetchCollaborators();
  };
};

/**
 * MASS ASSIGNMENT UI (SPRINT 8)
 */
async function renderAsignacionesUI() {
  const [resC, resK] = await Promise.all([
    fetch(`${API_URL}/admin/cursos`, { headers: { 'Authorization': `Bearer MOCK_TOKEN_SPRINT_2` } }),
    fetch(`${API_URL}/colaboradores`, { headers: { 'Authorization': `Bearer MOCK_TOKEN_SPRINT_2` } })
  ]);
  const cursos = await resC.json();
  const personas = await resK.json();

  adminContent.innerHTML = `
    <div class="mb-6">
      <h3 class="text-xl font-bold uppercase tracking-widest mb-2">Asignación Masiva</h3>
      <p class="text-sm text-white/40">Vincule un curso a múltiples colaboradores simultáneamente.</p>
    </div>

    <div class="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
      <div>
        <label class="block text-xs uppercase text-white/50 mb-2">Paso 1: Seleccionar Curso</label>
        <select id="asig-curso" class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white">
          ${cursos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
        </select>
      </div>

      <div>
        <label class="block text-xs uppercase text-white/50 mb-2">Paso 2: Seleccionar Colaboradores</label>
        <div class="max-h-48 overflow-y-auto border border-white/10 rounded-lg p-3 space-y-2 bg-black/20">
          ${personas.map(p => `
            <label class="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
              <input type="checkbox" name="colab-check" value="${p.id}" class="w-4 h-4 rounded border-white/10 bg-white/5 text-azul3">
              <span class="text-sm">${p.nombre}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <button id="btnMassAssign" class="w-full bg-verde1 hover:bg-verde2 py-4 rounded-xl font-bold transition-all shadow-lg shadow-verde1/20">Ejecutar Asignación Proporcional</button>
    </div>
  `;

  document.getElementById('btnMassAssign').onclick = async () => {
    const cursoId = document.getElementById('asig-curso').value;
    const selectedIds = Array.from(document.querySelectorAll('input[name="colab-check"]:checked')).map(i => i.value);
    
    if (selectedIds.length === 0) return alert('Seleccione al menos un colaborador');

    // Reuse sync endpoint for simplicity or create a specific one
    await fetch(`${API_URL}/asignaciones/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer MOCK_TOKEN_SPRINT_2` },
      body: JSON.stringify({ 
        personas: selectedIds.map(id => ({ 
          nombre: personas.find(p => p.id == id).nombre,
          cursos: [{ nombre: cursos.find(c => c.id == cursoId).nombre, estado: 'Por coordinar' }]
        }))
      })
    });

    alert('Asignación masiva completada');
    loadAdminTab('asignaciones');
  };
}

window.deleteAdminItem = async (type, id) => {
  if (!confirm('¿Está seguro de eliminar este elemento?')) return;
  await fetch(`${API_URL}/admin/${type}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer MOCK_TOKEN_SPRINT_2` }
  });
  loadAdminTab(type);
};

// Initial Load
fetchCollaborators();
