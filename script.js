// --- KONFIGURASI SUPABASE ---
const SUPABASE_URL = 'https://hdgfyrrtmbrsbtmhjdrf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2Z5cnJ0bWJyc2J0bWhqZHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTI3MjIsImV4cCI6MjEwODY2ODcyMn0.EiBVQ6Vv6eS7mWnzPKUec_3MfHSBPeTG6GcWQ-CzHWw';

// State Application
let transactions = JSON.parse(localStorage.getItem('hematku_transactions')) || [];
let currentType = 'expense'; // 'expense' or 'income'
let editingId = null;
let categoryChart = null;
let deleteTargetId = null;

// Categories definition
const categories = {
  expense: ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lain-lain'],
  income: ['Gaji', 'Bonus', 'Investasi', 'Penjualan', 'Hadiah', 'Lain-lain']
};

// Category Color Mapping
const categoryColors = {
  'Makanan': '#f97316',
  'Transportasi': '#06b6d4',
  'Belanja': '#ec4899',
  'Tagihan': '#ef4444',
  'Hiburan': '#8b5cf6',
  'Kesehatan': '#10b981',
  'Pendidikan': '#3b82f6',
  'Gaji': '#10b981',
  'Bonus': '#84cc16',
  'Investasi': '#6366f1',
  'Penjualan': '#eab308',
  'Hadiah': '#d946ef',
  'Lain-lain': '#64748b'
};

// DOM Elements
const form = document.getElementById('transaction-form');
const formTitle = document.getElementById('form-title');
const btnTypeExpense = document.getElementById('btn-type-expense');
const btnTypeIncome = document.getElementById('btn-type-income');
const categorySelect = document.getElementById('category');
const filterCategorySelect = document.getElementById('filter-category');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const searchInput = document.getElementById('search-input');
const filterTypeSelect = document.getElementById('filter-type');
const modalConfirm = document.getElementById('modal-confirm');

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  setupCategoryOptions();
  setupFilterCategoryOptions();
  renderUI();
  lucide.createIcons();
});

// Toggle Transaction Type (Pemasukan / Pengeluaran)
btnTypeExpense.addEventListener('click', () => setType('expense'));
btnTypeIncome.addEventListener('click', () => setType('income'));

function setType(type) {
  currentType = type;
  if (type === 'expense') {
    btnTypeExpense.className = "py-2 px-3 text-xs font-semibold rounded-lg transition-all shadow-sm bg-white text-rose-600 flex items-center justify-center cursor-pointer";
    btnTypeIncome.className = "py-2 px-3 text-xs font-semibold rounded-lg transition-all text-slate-600 hover:text-emerald-600 flex items-center justify-center cursor-pointer";
  } else {
    btnTypeIncome.className = "py-2 px-3 text-xs font-semibold rounded-lg transition-all shadow-sm bg-white text-emerald-600 flex items-center justify-center cursor-pointer";
    btnTypeExpense.className = "py-2 px-3 text-xs font-semibold rounded-lg transition-all text-slate-600 hover:text-rose-600 flex items-center justify-center cursor-pointer";
  }
  setupCategoryOptions();
}

function setupCategoryOptions() {
  categorySelect.innerHTML = '';
  categories[currentType].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function setupFilterCategoryOptions() {
  const allCat = [...new Set([...categories.expense, ...categories.income])];
  filterCategorySelect.innerHTML = '<option value="all">Semua Kategori</option>';
  allCat.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filterCategorySelect.appendChild(opt);
  });
}

// Format Currency
function formatRp(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
}

// Format Date ID
function formatDate(dateStr) {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('id-ID', options);
}

// Save Data to LocalStorage
function saveData() {
  localStorage.setItem('hematku_transactions', JSON.stringify(transactions));
}

// Add or Update Transaction
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const note = document.getElementById('note').value.trim();

  if (!title || isNaN(amount) || amount <= 0) return;

  if (editingId) {
    transactions = transactions.map(t => t.id === editingId ? { id: editingId, title, amount, category, date, note, type: currentType } : t);
    editingId = null;
    formTitle.innerHTML = `<i data-lucide="plus-circle" class="w-5 h-5 mr-2 text-indigo-600"></i> Tambah Transaksi`;
    cancelEditBtn.classList.add('hidden');
  } else {
    const newTx = {
      id: Date.now().toString(),
      title,
      amount,
      category,
      date,
      note,
      type: currentType
    };
    transactions.unshift(newTx);
  }

  saveData();
  form.reset();
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  setType('expense');
  renderUI();
  lucide.createIcons();
});

// Start Edit Transaction
window.editTransaction = function(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  editingId = tx.id;
  document.getElementById('title').value = tx.title;
  document.getElementById('amount').value = tx.amount;
  document.getElementById('date').value = tx.date;
  document.getElementById('note').value = tx.note || '';

  setType(tx.type);
  document.getElementById('category').value = tx.category;

  formTitle.innerHTML = `<i data-lucide="edit" class="w-5 h-5 mr-2 text-indigo-600"></i> Edit Transaksi`;
  cancelEditBtn.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

cancelEditBtn.addEventListener('click', () => {
  editingId = null;
  form.reset();
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  setType('expense');
  formTitle.innerHTML = `<i data-lucide="plus-circle" class="w-5 h-5 mr-2 text-indigo-600"></i> Tambah Transaksi`;
  cancelEditBtn.classList.add('hidden');
});

// Delete Confirmation Modal Handler
window.promptDelete = function(id) {
  deleteTargetId = id;
  document.getElementById('modal-title').textContent = 'Hapus Transaksi?';
  document.getElementById('modal-desc').textContent = 'Transaksi ini akan dihapus secara permanen.';
  modalConfirm.classList.remove('hidden');
};

document.getElementById('modal-cancel-btn').addEventListener('click', () => {
  modalConfirm.classList.add('hidden');
  deleteTargetId = null;
});

document.getElementById('modal-action-btn').addEventListener('click', () => {
  if (deleteTargetId === 'ALL') {
    transactions = [];
  } else if (deleteTargetId) {
    transactions = transactions.filter(t => t.id !== deleteTargetId);
  }
  saveData();
  renderUI();
  modalConfirm.classList.add('hidden');
  deleteTargetId = null;
  lucide.createIcons();
});

// Clear All Trigger
document.getElementById('clear-all-btn').addEventListener('click', () => {
  if (transactions.length === 0) return;
  deleteTargetId = 'ALL';
  document.getElementById('modal-title').textContent = 'Hapus Semua Data?';
  document.getElementById('modal-desc').textContent = 'Semua riwayat transaksi akan dihapus bersih.';
  modalConfirm.classList.remove('hidden');
});

// Filters & Search Inputs Listener
searchInput.addEventListener('input', renderUI);
filterTypeSelect.addEventListener('change', renderUI);
filterCategorySelect.addEventListener('change', renderUI);

// Main Render Function
function renderUI() {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  document.getElementById('total-balance').textContent = formatRp(totalBalance);
  document.getElementById('total-income').textContent = formatRp(totalIncome);
  document.getElementById('total-expense').textContent = formatRp(totalExpense);

  const statusIcon = document.getElementById('balance-status-icon');
  const statusText = document.getElementById('balance-status-text');
  if (totalBalance >= 0) {
    statusIcon.innerHTML = `<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-300"></i>`;
    statusText.textContent = "Keuangan Anda Sehat";
  } else {
    statusIcon.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-300"></i>`;
    statusText.textContent = "Pengeluaran Melebihi Pemasukan";
  }

  const search = searchInput.value.toLowerCase();
  const typeFilter = filterTypeSelect.value;
  const categoryFilter = filterCategorySelect.value;

  const filtered = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search) || (t.note && t.note.toLowerCase().includes(search));
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const listContainer = document.getElementById('transaction-list');
  const emptyState = document.getElementById('empty-state');
  document.getElementById('transaction-count').textContent = `${filtered.length} Transaksi`;

  listContainer.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');

    filtered.forEach(t => {
      const isIncome = t.type === 'income';
      const bgBadge = isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600';
      const amountColor = isIncome ? 'text-emerald-600' : 'text-slate-800';
      const sign = isIncome ? '+' : '-';

      const card = document.createElement('div');
      card.className = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition space-y-3";
      card.innerHTML = `
        <div class="w-full flex items-center justify-between gap-3">
          <div class="flex items-center space-x-3 min-w-0 flex-1">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgBadge}">
              <i data-lucide="${isIncome ? 'arrow-down-left' : 'arrow-up-right'}" class="w-5 h-5"></i>
            </div>
            <h4 class="text-sm sm:text-base font-bold text-slate-800 truncate flex-1">${escapeHtml(t.title)}</h4>
          </div>
          <div class="text-sm sm:text-base font-extrabold shrink-0 text-right ${amountColor}">
            ${sign} ${formatRp(t.amount)}
          </div>
        </div>

        <div class="w-full flex items-center justify-between pt-2.5 border-t border-slate-200/60">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600">${t.category}</span>
            <span class="text-xs text-slate-400">• ${formatDate(t.date)}</span>
            ${t.note ? `<span class="text-xs text-slate-400 italic">("${escapeHtml(t.note)}")</span>` : ''}
          </div>
          <div class="flex items-center space-x-1 shrink-0">
            <button onclick="editTransaction('${t.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Edit">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="promptDelete('${t.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Hapus">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
      listContainer.appendChild(card);
    });
  }

  updateChart();
  lucide.createIcons();
}

// Chart Renderer
function updateChart() {
  const expenses = transactions.filter(t => t.type === 'expense');
  const chartEmpty = document.getElementById('chart-empty');
  const canvas = document.getElementById('categoryChart');

  if (expenses.length === 0) {
    chartEmpty.classList.remove('hidden');
    canvas.classList.add('hidden');
    if (categoryChart) categoryChart.destroy();
    return;
  }

  chartEmpty.classList.add('hidden');
  canvas.classList.remove('hidden');

  const categoryMap = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);
  const backgroundColors = labels.map(l => categoryColors[l] || '#94a3b8');

  if (categoryChart) {
    categoryChart.destroy();
  }

  const ctx = canvas.getContext('2d');
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { family: 'Inter', size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return ` ${label}: ${formatRp(value)}`;
            }
          }
        }
      },
      cutout: '70%'
    }
  });
}

// Helper: Escape HTML string to avoid XSS
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// Export Data as JSON
document.getElementById('export-btn').addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `HematKu_Data_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

// Import Data from JSON File
document.getElementById('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported)) {
        transactions = imported;
        saveData();
        renderUI();
      } else {
        alert('Format file JSON tidak valid.');
      }
    } catch (err) {
      alert('Gagal membaca file JSON.');
    }
  };
  reader.readAsText(file);
});
