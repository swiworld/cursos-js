// ── dataService.js ───────────────────────────────────────────────────────────
// Módulo central para mostrar cursos de idiomas desde Google Sheets.
// Uso en cada página:
//
//   <div id="resultados"></div>
//   <script type="module">
//     import { mostrarCursos } from '/js/dataService.js';
//     mostrarCursos('Q2', 'Bàsic 1');
//   </script>
//   13wDuCIwLTSxFQ4qBNtl_d0xrohkfnqm9iJyzKRet-HY
// 
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_ID = '1Uob7MPl3OIELL9AvIV9Ha7EdTDFnMykm2c0kkkh5VCg';
const _cache = {};

// ── Carga y cachea los datos de una pestaña del Google Sheet ─────────────────
async function getData(sheetName) {
  if (_cache[sheetName]) return _cache[sheetName];

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(
    text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/)[1]
  );

  const cols = json.table.cols.map(c => c.label);
  _cache[sheetName] = json.table.rows.map(row => {
    const obj = {};
    row.c.forEach((cell, i) => {
      obj[cols[i]] = cell?.v ?? cell?.f ?? '';
    });
    return obj;
  });

  return _cache[sheetName];
}

// ── Convierte fechas del formato Google Sheets a dd/mm/yyyy ─────────────────
function formatDate(val) {
  if (!val) return '—';
  if (typeof val === 'string' && val.startsWith('Date(')) {
    const parts = val.replace('Date(', '').replace(')', '').split(',');
    const d = new Date(+parts[0], +parts[1], +parts[2]);
    return d.toLocaleDateString('ca-ES');
  }
  return val;
}

// ── Devuelve la clase CSS según la modalitat ─────────────────────────────────
function badgeClass(modalitat) {
  if (!modalitat) return '';
  const m = modalitat.toLowerCase();
  if (m.includes('presencial')) return 'presencial';
  if (m.includes('online') || m.includes('en línia')) return 'online';
  return '';
}

// ── Pinta las cards en el div#resultados ─────────────────────────────────────
function renderCards(cursos, curso) {
  const container = document.getElementById('resultados');
  if (!container) return;

  if (!cursos.length) {
    container.innerHTML = `<p>No s'han trobat cursos per a "${curso}".</p>`;
    return;
  }

 container.innerHTML = `<div class="grid">${cursos.map(row => `

<div class="table-responsive">
<table class="table table-stripped" summary="Detall d'estructura de la taula de registres">
<tbody>
<tr>
<td colspan="4" ><strong>Codi: ${row['Codi'] || ''}. <strong>Inici</strong>: ${formatDate(row['Inici'])} - Final: ${formatDate(row['Final'])}</strong></td>
</tr>
<tr>
<td class="fonsDestacat1" ><strong>Activitat</strong></td>
<td class="fonsDestacat1" ><strong>Sessions<br /></strong></td>
<td class="fonsDestacat1" ><strong>Aula</strong></td>
<td class="fonsDestacat1" ><strong>Professorat</strong></td>
</tr>
<tr>
<td nowrap="nowrap">
<p>${row['Curs'] || ''} ${row['Estiu'] || ''}</p>
<p style="text-transform:capitalize;">${row['Modalitat'] || '—'}</p>
</td>
<td nowrap="nowrap">
<p><strong>${row['Dia sessió'] || '—'}</strong><strong>, ${row['Horari'] || '—'}</strong> </p>
<p>${(row['Sessions'] || '—').toString().replace(/\n/g, '<br>')}</p>
</td>
<td nowrap="nowrap" style="text-transform:capitalize;">${row['Aula'] || '—'}</td>
<td nowrap="nowrap">${row['Tutor'] || '—'}</td>
</tr>
</tbody>
</table>
</div>
    `).join('')}</div>`;
  }

// ── Función principal — esta es la que se llama desde cada página ────────────
export async function mostrarCursos(cuatrimestre, curso) {
  const container = document.getElementById('resultados');
  if (!container) return;

  try {
    const allData = await getData(cuatrimestre);
    const filtrados = allData.filter(row =>
      row['Curs']?.toLowerCase().includes(curso.toLowerCase())
    );
    renderCards(filtrados, curso);
  } catch (e) {
    if (container) container.innerHTML = `<p>Error en carregar les dades.</p>`;
    console.error(e);
  }
}
