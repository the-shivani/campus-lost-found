/* ═══════════════════════════════════════════════════════════
   Campus Lost & Found — Application Logic
   ═══════════════════════════════════════════════════════════ */

const API = 'https://campus-backend-q9qw.onrender.com';
// ── DOM References ──────────────────────────────────────
const form        = document.getElementById('item-form');
const nameInput   = document.getElementById('item-name');
const locInput    = document.getElementById('item-location');
const contactInput= document.getElementById('item-contact');
const dateInput   = document.getElementById('item-date');
const typeInput   = document.getElementById('item-type');
const grid        = document.getElementById('items-grid');
const emptyState  = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const filterBtns  = document.querySelectorAll('.filter-btn');
const totalCount  = document.getElementById('total-count');
const lostCount   = document.getElementById('lost-count');
const foundCount  = document.getElementById('found-count');
const returnedCount = document.getElementById('returned-count');
const toastBox    = document.getElementById('toast-container');

let allItems      = [];
let currentFilter = 'all';

// ── Initialize ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set default date to today
  dateInput.value = new Date().toISOString().split('T')[0];
  fetchItems();
});

// ── Fetch Items ─────────────────────────────────────────
async function fetchItems() {
  try {
    const res = await fetch(`${API}/items`);
    allItems = await res.json();
    updateStats();
    renderItems();
  } catch (err) {
    showToast('Failed to connect to server', 'error');
  }
}

// ── Add Item ────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    item_name: nameInput.value.trim(),
    location:  locInput.value.trim(),
    contact:   contactInput.value.trim(),
    date:      dateInput.value,
    type:      typeInput.value
  };

  if (!payload.item_name || !payload.location || !payload.contact || !payload.date || !payload.type) {
    showToast('Please fill all fields', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add');
    showToast('Item added successfully!', 'success');
    form.reset();
    dateInput.value = new Date().toISOString().split('T')[0];
    fetchItems();
  } catch (err) {
    showToast('Error adding item', 'error');
  }
});

// ── Delete Item ─────────────────────────────────────────
async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  try {
    const res = await fetch(`${API}/delete/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    showToast('Item deleted', 'info');
    fetchItems();
  } catch {
    showToast('Error deleting item', 'error');
  }
}

// ── Mark as Returned ────────────────────────────────────
async function markReturned(id) {
  try {
    const res = await fetch(`${API}/return/${id}`, { method: 'PUT' });
    if (!res.ok) throw new Error();
    showToast('Item marked as returned!', 'success');
    fetchItems();
  } catch {
    showToast('Error updating item', 'error');
  }
}

// ── Render Items ────────────────────────────────────────
function renderItems() {
  const query = searchInput.value.toLowerCase().trim();

  const filtered = allItems.filter(item => {
    // filter by tab
    if (currentFilter === 'lost'     && (item.type !== 'lost' || item.status === 'returned')) return false;
    if (currentFilter === 'found'    && (item.type !== 'found' || item.status === 'returned')) return false;
    if (currentFilter === 'returned' && item.status !== 'returned') return false;

    // search
    if (query) {
      const haystack = `${item.item_name} ${item.location} ${item.contact}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  grid.innerHTML = filtered.map((item, i) => buildCard(item, i)).join('');
}

function buildCard(item, index) {
  const isReturned = item.status === 'returned';
  const badgeClass = isReturned ? 'badge-returned' : item.type === 'lost' ? 'badge-lost' : 'badge-found';
  const badgeLabel = isReturned ? '✅ Returned' : item.type === 'lost' ? '🔴 Lost' : '🟢 Found';
  const statusClass = isReturned ? 'status-returned' : 'status-active';
  const statusLabel = isReturned ? 'Returned' : 'Active';

  return `
    <div class="item-card" style="animation-delay: ${index * 0.05}s">
      <div class="card-header">
        <span class="card-name">${escHtml(item.item_name)}</span>
        <span class="badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="card-details">
        <div class="card-detail"><span class="detail-icon">📍</span> ${escHtml(item.location)}</div>
        <div class="card-detail"><span class="detail-icon">📞</span> ${escHtml(item.contact)}</div>
        <div class="card-detail"><span class="detail-icon">📅</span> ${escHtml(item.date)}</div>
      </div>
      <div class="card-status ${statusClass}">Status: ${statusLabel}</div>
      <div class="card-actions">
        <button class="btn btn-sm btn-danger" onclick="deleteItem('${item._id}')">Delete</button>
        ${!isReturned ? `<button class="btn btn-sm btn-success" onclick="markReturned('${item._id}')">Mark Returned</button>` : ''}
      </div>
    </div>
  `;
}

// ── Update Stats ────────────────────────────────────────
function updateStats() {
  const lost = allItems.filter(i => i.type === 'lost' && i.status !== 'returned').length;
  const found = allItems.filter(i => i.type === 'found' && i.status !== 'returned').length;
  const returned = allItems.filter(i => i.status === 'returned').length;

  animateCounter(totalCount, allItems.length);
  animateCounter(lostCount, lost);
  animateCounter(foundCount, found);
  animateCounter(returnedCount, returned);
}

function animateCounter(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const step = target > current ? 1 : -1;
  const duration = 400;
  const steps = Math.abs(target - current);
  const interval = Math.max(duration / steps, 30);
  let val = current;
  const timer = setInterval(() => {
    val += step;
    el.textContent = val;
    if (val === target) clearInterval(timer);
  }, interval);
}

// ── Search (Live) ───────────────────────────────────────
searchInput.addEventListener('input', () => {
  renderItems();
});

// ── Filter Tabs ─────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderItems();
  });
});

// ── Toast Notifications ─────────────────────────────────
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastBox.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ── Helpers ─────────────────────────────────────────────
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
