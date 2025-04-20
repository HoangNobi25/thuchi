const APIAPI_BASE_URL = 'https://chitieu1/herokuapp.com';

const incomeForm = document.getElementById('income-form');
const expenseForm = document.getElementById('expense-form');
const incomeHistoryTableBody = document.querySelector('#income-history-table tbody');
const expenseHistoryTableBody = document.querySelector('#expense-history-table tbody');
const totalsTypeSelect = document.getElementById('totals-type');
const totalsPeriodSelect = document.getElementById('totals-period');
const refreshTotalsBtn = document.getElementById('refresh-totals');
const totalsDisplay = document.getElementById('totals-display');
const exportBtn = document.getElementById('export-btn');

// Format currency as CZK
const czkFormatter = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  minimumFractionDigits: 2,
});

// Set default dates to today
const today = new Date().toISOString().slice(0, 10);
document.getElementById('income-date').value = today;
document.getElementById('expense-date').value = today;

// Fetch and display income history
async function fetchIncomeHistory() {
  const res = await fetch('/api/incomes');
  const incomes = await res.json();
  incomeHistoryTableBody.innerHTML = '';
  incomes.forEach(income => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${czkFormatter.format(income.amount)}</td>
      <td>${translateIncomeType(income.type)}</td>
      <td>${income.date}</td>
      <td>${income.note || ''}</td>
      <td>
        <button class="edit-income-btn" data-id="${income.id}">Sửa</button>
        <button class="delete-income-btn" data-id="${income.id}">Xóa</button>
      </td>
    `;
    incomeHistoryTableBody.appendChild(tr);
  });
}

// Fetch and display expense history
async function fetchExpenseHistory() {
  const res = await fetch('/api/expenses');
  const expenses = await res.json();
  expenseHistoryTableBody.innerHTML = '';
  expenses.forEach(expense => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${czkFormatter.format(expense.amount)}</td>
      <td>${translateCategory(expense.category)}</td>
      <td>${expense.date}</td>
      <td>${expense.note || ''}</td>
      <td>
        <button class="edit-btn" data-id="${expense.id}">Sửa</button>
        <button class="delete-btn" data-id="${expense.id}">Xóa</button>
      </td>
    `;
    expenseHistoryTableBody.appendChild(tr);
  });
}

// Translate category to Vietnamese
function translateCategory(category) {
  switch (category) {
    case 'goods': return 'Tiền hàng';
    case 'food': return 'Tiền ăn';
    case 'fuel': return 'Tiền xăng xe';
    case 'entertainment': return 'Tiền đi chơi';
    default: return category;
  }
}

// Translate income type to Vietnamese
function translateIncomeType(type) {
  switch (type) {
    case 'cash': return 'Tiền mặt';
    case 'card': return 'Tiền thẻ';
    case 'side': return 'Tiền ngoài lề';
    default: return type;
  }
}

// Add income
incomeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(incomeForm);
  const data = {
    amount: parseFloat(formData.get('amount')),
    type: formData.get('type'),
    date: formData.get('date'),
    note: formData.get('note'),
  };
  const res = await fetch('/api/incomes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.ok) {
    incomeForm.reset();
    document.getElementById('income-date').value = today;
    alert('Thêm thu nhập thành công');
    fetchIncomeHistory();
  } else {
    alert('Thêm thu nhập thất bại');
  }
});

// Add expense
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(expenseForm);
  const data = {
    amount: parseFloat(formData.get('amount')),
    category: formData.get('category'),
    date: formData.get('date'),
    note: formData.get('note'),
  };
  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.ok) {
    expenseForm.reset();
    document.getElementById('expense-date').value = today;
    alert('Thêm chi tiêu thành công');
    fetchExpenseHistory();
  } else {
    alert('Thêm chi tiêu thất bại');
  }
});

// Handle edit and delete buttons in income history
incomeHistoryTableBody.addEventListener('click', async (e) => {
  if (e.target.classList.contains('edit-income-btn')) {
    const id = e.target.dataset.id;
    const newAmount = prompt('Nhập số tiền mới:');
    const newType = prompt('Nhập loại thu nhập (cash, card, side):');
    const newDate = prompt('Nhập ngày mới (YYYY-MM-DD):');
    const newNote = prompt('Nhập ghi chú mới:');
    if (newAmount && newType && newDate) {
      const res = await fetch(`/api/incomes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(newAmount),
          type: newType,
          date: newDate,
          note: newNote,
        }),
      });
      if (res.ok) {
        alert('Cập nhật thu nhập thành công');
        fetchIncomeHistory();
      } else {
        alert('Cập nhật thu nhập thất bại');
      }
    }
  } else if (e.target.classList.contains('delete-income-btn')) {
    const id = e.target.dataset.id;
    if (confirm('Bạn có chắc muốn xóa thu nhập này không?')) {
      const res = await fetch(`/api/incomes/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Xóa thu nhập thành công');
        fetchIncomeHistory();
      } else {
        alert('Xóa thu nhập thất bại');
      }
    }
  }
});

// Handle edit and delete buttons in expense history
expenseHistoryTableBody.addEventListener('click', async (e) => {
  if (e.target.classList.contains('edit-btn')) {
    const id = e.target.dataset.id;
    const newAmount = prompt('Nhập số tiền mới:');
    const newCategory = prompt('Nhập loại chi tiêu (goods, food, fuel, entertainment):');
    const newDate = prompt('Nhập ngày mới (YYYY-MM-DD):');
    const newNote = prompt('Nhập ghi chú mới:');
    if (newAmount && newCategory && newDate) {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(newAmount),
          category: newCategory,
          date: newDate,
          note: newNote,
        }),
      });
      if (res.ok) {
        alert('Cập nhật chi tiêu thành công');
        fetchExpenseHistory();
      } else {
        alert('Cập nhật chi tiêu thất bại');
      }
    }
  } else if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    if (confirm('Bạn có chắc muốn xóa chi tiêu này không?')) {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Xóa chi tiêu thành công');
        fetchExpenseHistory();
      } else {
        alert('Xóa chi tiêu thất bại');
      }
    }
  }
});

// Fetch and display totals
async function fetchTotals() {
  const type = totalsTypeSelect.value;
  const period = totalsPeriodSelect.value;
  const res = await fetch(`/api/totals?type=${type}&period=${period}`);
  if (res.ok) {
    const totals = await res.json();
    totalsDisplay.innerHTML = '';
    for (const [key, value] of Object.entries(totals)) {
      const div = document.createElement('div');
      div.textContent = `${key}: ${czkFormatter.format(value)}`;
      totalsDisplay.appendChild(div);
    }
  } else {
    totalsDisplay.textContent = 'Không thể tải tổng tiền';
  }
}

refreshTotalsBtn.addEventListener('click', fetchTotals);

// Export to Excel
exportBtn.addEventListener('click', () => {
  window.location.href = '/api/export';
});

// Fetch and display balances
async function fetchBalances() {
  const startDateInput = document.getElementById('balance-start-date');
  const endDateInput = document.getElementById('balance-end-date');
  const balancesDisplay = document.getElementById('balances-display');

  const start = startDateInput.value;
  const end = endDateInput.value;

  if (!start || !end) {
    balancesDisplay.textContent = 'Vui lòng chọn ngày bắt đầu và ngày kết thúc.';
    return;
  }

  try {
    const res = await fetch(`/api/balances?start=${start}&end=${end}`);
    if (res.ok) {
      const data = await res.json();
      balancesDisplay.innerHTML = `
        <p><strong>Số dư đầu kỳ:</strong> ${czkFormatter.format(data.beginningBalance)}</p>
        <p><strong>Số dư cuối kỳ:</strong> ${czkFormatter.format(data.endingBalance)}</p>
      `;
    } else {
      balancesDisplay.textContent = 'Không thể tải số dư.';
      console.error('Failed to fetch balances:', res.status, res.statusText);
    }
  } catch (error) {
    balancesDisplay.textContent = 'Lỗi khi tải số dư.';
    console.error('Error fetching balances:', error);
  }
}

document.getElementById('refresh-balances').addEventListener('click', fetchBalances);

// Set default dates for balance inputs to today
document.getElementById('balance-start-date').value = today;
document.getElementById('balance-end-date').value = today;

// Initial load
fetchIncomeHistory();
fetchExpenseHistory();
fetchTotals();
