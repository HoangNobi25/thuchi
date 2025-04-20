import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Low, JSONFile } from 'lowdb';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Setup lowdb
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database with default structure if empty
async function initDB() {
  await db.read();
  db.data = db.data || { incomes: [], expenses: [] };
  await db.write();
}

// Helper function to calculate totals by period
function calculateTotals(entries, period) {
  const totals = {};
  entries.forEach(entry => {
    const date = new Date(entry.date);
    let key;
    switch (period) {
      case 'day':
        key = date.toISOString().slice(0, 10);
        break;
      case 'week': {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${weekNumber}`;
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().slice(0, 10);
    }
    totals[key] = (totals[key] || 0) + entry.amount;
  });
  return totals;
}

// Routes

// Get all incomes
app.get('/api/incomes', async (req, res) => {
  await db.read();
  res.json(db.data.incomes);
});

// Add income
app.post('/api/incomes', async (req, res) => {
  const { amount, type, date, note } = req.body;
  if (!amount || !type || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  await db.read();
  const newIncome = { id: Date.now(), amount, type, date, note: note || '' };
  db.data.incomes.push(newIncome);
  await db.write();
  res.json(newIncome);
});

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  await db.read();
  res.json(db.data.expenses);
});

// Add expense
app.post('/api/expenses', async (req, res) => {
  const { amount, category, date, note } = req.body;
  if (!amount || !category || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  await db.read();
  const newExpense = { id: Date.now(), amount, category, date, note: note || '' };
  db.data.expenses.push(newExpense);
  await db.write();
  res.json(newExpense);
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { amount, category, date, note } = req.body;
  await db.read();
  const expense = db.data.expenses.find(e => e.id === id);
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  if (amount !== undefined) expense.amount = amount;
  if (category !== undefined) expense.category = category;
  if (date !== undefined) expense.date = date;
  if (note !== undefined) expense.note = note;
  await db.write();
  res.json(expense);
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await db.read();
  const index = db.data.expenses.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  db.data.expenses.splice(index, 1);
  await db.write();
  res.json({ success: true });
});

// Get totals for incomes or expenses by period
app.get('/api/totals', async (req, res) => {
  const { type, period } = req.query; // type: income or expense, period: day, week, month
  if (!type || !period) {
    return res.status(400).json({ error: 'Missing type or period query parameter' });
  }
  await db.read();
  let entries;
  if (type === 'income') {
    entries = db.data.incomes;
  } else if (type === 'expense') {
    entries = db.data.expenses;
  } else {
    return res.status(400).json({ error: 'Invalid type parameter' });
  }
  const totals = calculateTotals(entries, period);
  res.json(totals);
});

// Export data to Excel
app.get('/api/export', async (req, res) => {
  await db.read();
  const workbook = new ExcelJS.Workbook();
  const incomeSheet = workbook.addWorksheet('Incomes');
  incomeSheet.columns = [
    { header: 'ID', key: 'id', width: 15 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Note', key: 'note', width: 30 },
  ];
  db.data.incomes.forEach(income => {
    incomeSheet.addRow(income);
  });

  const expenseSheet = workbook.addWorksheet('Expenses');
  expenseSheet.columns = [
    { header: 'ID', key: 'id', width: 15 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Note', key: 'note', width: 30 },
  ];
  db.data.expenses.forEach(expense => {
    expenseSheet.addRow(expense);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=income_expense_data.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
