// ── CONFIG ──────────────────────────────────────────────────────────────
const GITHUB_OWNER = 'zarwalikhatri677-dotcom';
const GITHUB_REPO  = 'cpg-sales-portal-';
const DASHBOARD_URL = 'https://zarwalikhatri677-dotcom.github.io/cpg-sales-portal-';

function getToken() {
  let t = localStorage.getItem('gh_token');
  if (!t) {
    t = prompt('Enter your GitHub token to access the portal:');
    if (t) localStorage.setItem('gh_token', t);
  }
  return t;
}
const GITHUB_TOKEN = getToken();

// ── STATE ────────────────────────────────────────────────────────────────
let companies = [];
let requests  = [];

// ── GITHUB API ───────────────────────────────────────────────────────────
async function ghGet(path) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
  });
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status}`);
  return res.json();
}

async function ghPut(path, content, sha) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `update ${path}`, content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))), sha })
  });
  if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status}`);
  return res.json();
}

async function loadJSON(path) {
  const file = await ghGet(path);
  return { data: JSON.parse(atob(file.content)), sha: file.sha };
}

// ── INIT ──────────────────────────────────────────────────────────────────
async function init() {
  document.getElementById('table-body').innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#888;">Loading...</td></tr>';
  try {
    const [co, rq] = await Promise.all([loadJSON('data/companies.json'), loadJSON('data/requests.json')]);
    companies = co.data;
    requests  = rq.data;
    renderTable(companies);
  } catch (err) {
    document.getElementById('table-body').innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#c0392b;">Error loading data: ${err.message}</td></tr>`;
  }
}

// ── TABLE RENDERING ───────────────────────────────────────────────────────
function requestStatusForCompany(companyName) {
  const reqs = requests.filter(r => r.companyName === companyName);
  if (reqs.length === 0) return { symbol: '○', label: 'none', cls: 'status-none' };
  const open = reqs.find(r => r.status === 'open');
  if (open) return { symbol: '●', label: 'open', cls: 'status-open' };
  return { symbol: '✓', label: 'answered', cls: 'status-answered' };
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';
  data.forEach(c => {
    const rs = requestStatusForCompany(c.name);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.rank}</td>
      <td class="company-name">${c.name}</td>
      <td>${c.category}</td>
      <td>${c.region}</td>
      <td class="ae-cell">${c.ae}</td>
      <td>${c.landscape}</td>
      <td>${c.projectStatus}</td>
      <td><span class="req-status ${rs.cls}" title="${rs.label}">${rs.symbol}</span></td>
    `;
    tr.addEventListener('click', () => openDetailModal(c));
    tbody.appendChild(tr);
  });
}

// ── SEARCH ────────────────────────────────────────────────────────────────
document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  renderTable(companies.filter(c => c.name.toLowerCase().includes(q)));
});

// ── MODAL HELPERS ─────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.getElementById('btn-request').addEventListener('click', () => {
  populateCompanyDropdown('req-company', companies);
  openModal('modal-request');
});
document.getElementById('req-cancel').addEventListener('click', () => closeModal('modal-request'));

document.getElementById('btn-respond').addEventListener('click', () => {
  const openCompanies = companies.filter(c => requests.some(r => r.companyName === c.name && r.status === 'open'));
  populateCompanyDropdown('res-company', openCompanies);
  openModal('modal-response');
});
document.getElementById('res-cancel').addEventListener('click', () => closeModal('modal-response'));
document.getElementById('detail-close').addEventListener('click', () => closeModal('modal-detail'));

function populateCompanyDropdown(selectId, list) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '<option value="">— Select company —</option>';
  list.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = `${c.rank}. ${c.name}`;
    sel.appendChild(opt);
  });
}

// ── REQUEST UPDATE SUBMIT ─────────────────────────────────────────────────
document.getElementById('req-submit').addEventListener('click', async () => {
  const companyName = document.getElementById('req-company').value;
  const question    = document.getElementById('req-question').value.trim();
  const requestedBy = document.getElementById('req-name').value.trim();

  if (!companyName || !question || !requestedBy) {
    alert('Please fill in all fields.');
    return;
  }

  const company = companies.find(c => c.name === companyName);
  const newRequest = {
    id: `req_${Date.now()}_${companyName.slice(0,4).toLowerCase().replace(/\s/g,'')}`,
    companyRank: company.rank,
    companyName: company.name,
    aeEmail: company.ae,
    requestedBy,
    question,
    requestedAt: new Date().toISOString(),
    status: 'open',
    response: null,
    respondedBy: null,
    respondedAt: null
  };

  try {
    document.getElementById('req-submit').disabled = true;
    document.getElementById('req-submit').textContent = 'Saving...';

    const file = await ghGet('data/requests.json');
    const current = JSON.parse(atob(file.content));
    current.push(newRequest);
    await ghPut('data/requests.json', current, file.sha);

    requests.push(newRequest);
    renderTable(companies);
    closeModal('modal-request');

    document.getElementById('req-question').value = '';
    document.getElementById('req-name').value = '';

    const subject = encodeURIComponent(`[SAP CPG Portal] Update requested for ${company.name}`);
    const body = encodeURIComponent(
`Hi,

A question has been submitted for ${company.name} on the SAP CPG Sales Portal:

"${question}"

Requested by: ${requestedBy}
Date: ${new Date().toLocaleDateString('en-GB')}

Please log your response at: ${DASHBOARD_URL}

Thanks`
    );
    window.location.href = `mailto:${company.ae}?subject=${subject}&body=${body}`;
  } catch (err) {
    alert('Error saving request: ' + err.message);
  } finally {
    document.getElementById('req-submit').disabled = false;
    document.getElementById('req-submit').textContent = 'Send + Email →';
  }
});

// ── SUBMIT RESPONSE ───────────────────────────────────────────────────────
document.getElementById('res-submit').addEventListener('click', async () => {
  const companyName = document.getElementById('res-company').value;
  const response    = document.getElementById('res-response').value.trim();
  const respondedBy = document.getElementById('res-name').value.trim();

  if (!companyName || !response || !respondedBy) {
    alert('Please fill in all fields.');
    return;
  }

  const openReq = requests.find(r => r.companyName === companyName && r.status === 'open');
  if (!openReq) {
    alert('No open request found for this company.');
    return;
  }

  try {
    document.getElementById('res-submit').disabled = true;
    document.getElementById('res-submit').textContent = 'Saving...';

    const file = await ghGet('data/requests.json');
    const current = JSON.parse(atob(file.content));
    const idx = current.findIndex(r => r.id === openReq.id);
    current[idx] = { ...current[idx], status: 'answered', response, respondedBy, respondedAt: new Date().toISOString() };
    await ghPut('data/requests.json', current, file.sha);

    requests[requests.indexOf(openReq)] = current[idx];
    renderTable(companies);
    closeModal('modal-response');

    document.getElementById('res-response').value = '';
    document.getElementById('res-name').value = '';
  } catch (err) {
    alert('Error saving response: ' + err.message);
  } finally {
    document.getElementById('res-submit').disabled = false;
    document.getElementById('res-submit').textContent = 'Submit ✓';
  }
});

// ── COMPANY DETAIL ────────────────────────────────────────────────────────
const LANDSCAPE_LEGEND = { '⇧': 'RISE / S4 Private Cloud', 'S/4': 'S/4 On Prem', 'ECC': 'ECC', 'NN': 'Net New' };
const DEPLOYMENT_LEGEND = { '🍀': 'Greenfield', '💧': 'Bluefield', '⛰️': 'Brownfield', 'L&S': 'Lift and Shift' };
const STATUS_LEGEND = { '✨': 'Live', '⏳': 'In Progress', '💼': 'Shelfware' };

function openDetailModal(company) {
  document.getElementById('detail-name').textContent = `${company.rank}. ${company.name}`;

  const companyRequests = requests.filter(r => r.companyName === company.name);

  document.getElementById('detail-body').innerHTML = `
    <div class="detail-grid">
      <div class="detail-field"><div class="label">Category</div>${company.category || '—'}</div>
      <div class="detail-field"><div class="label">Region</div>${company.region || '—'}</div>
      <div class="detail-field"><div class="label">SCP Status</div>${company.scp || '—'}</div>
      <div class="detail-field"><div class="label">Industry Advisor</div>${company.advisor || '—'}</div>
      <div class="detail-field"><div class="label">Account Executive</div>${company.ae || '—'}</div>
      <div class="detail-field"><div class="label">Landscape</div>${company.landscape} ${LANDSCAPE_LEGEND[company.landscape] || ''}</div>
      <div class="detail-field"><div class="label">Deployment</div>${company.deployment} ${DEPLOYMENT_LEGEND[company.deployment] || ''}</div>
      <div class="detail-field"><div class="label">Previous Software</div>${company.previous || '—'}</div>
      <div class="detail-field"><div class="label">Project Status</div>${company.projectStatus} ${STATUS_LEGEND[company.projectStatus] || ''}</div>
      <div class="detail-field"><div class="label">Contract Signed</div>${company.contractSigned || '—'}</div>
    </div>
    <div class="request-history">
      <h3>Request History (${companyRequests.length})</h3>
      ${companyRequests.length === 0
        ? '<p style="color:#999;font-size:0.88rem;">No requests yet.</p>'
        : companyRequests.map(r => `
          <div class="request-card ${r.status}">
            <strong>${r.question}</strong>
            <div class="meta">Requested by ${r.requestedBy} · ${new Date(r.requestedAt).toLocaleDateString('en-GB')}</div>
            ${r.response ? `<div class="response"><strong>Response:</strong> ${r.response}<div class="meta">By ${r.respondedBy} · ${new Date(r.respondedAt).toLocaleDateString('en-GB')}</div></div>` : '<div class="meta" style="margin-top:6px;color:#e67e22;">Awaiting response</div>'}
          </div>`).join('')
      }
    </div>
  `;

  openModal('modal-detail');
}

init();
