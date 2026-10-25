import { Router, Request, Response } from 'express';
import { ExpenseModel } from '../models/Expense';
import { TripModel } from '../models/Trip';

const router = Router();

// GET expenses by tripId
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.query;
    const query = tripId ? { tripId } : {};
    const expenses = await ExpenseModel.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST expense (single or bulk array)
router.post('/', async (req: Request, res: Response) => {
  try {
    if (Array.isArray(req.body)) {
      const expenses = await ExpenseModel.insertMany(req.body);
      return res.status(201).json(expenses);
    }
    const expense = new ExpenseModel(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE expense
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await ExpenseModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Dépense supprimée de MongoDB' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/expenses/analytics (Nour Feature: Budget breakdown & Peer-to-peer Split)
router.get('/analytics/:tripId', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const trip = await TripModel.findById(tripId);
    const expenses = await ExpenseModel.find({ tripId });

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const budgetTotal = trip?.budgetTotal || 2000;
    const remaining = budgetTotal - totalSpent;
    const isOverBudget = totalSpent > budgetTotal;

    // Categories
    const categoriesMap: Record<string, number> = {};
    expenses.forEach(e => {
      categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
    });

    // P2P Split settlement
    const balances: Record<string, number> = {};
    const participants = trip?.participants || [];
    participants.forEach(p => balances[p] = 0);

    expenses.forEach(e => {
      const payer = e.paidBy;
      const beneficiaries = e.splitWith && e.splitWith.length > 0 ? e.splitWith : participants;
      const share = e.amount / (beneficiaries.length || 1);

      balances[payer] = (balances[payer] || 0) + e.amount;
      beneficiaries.forEach(b => {
        balances[b] = (balances[b] || 0) - share;
      });
    });

    res.json({
      totalSpent,
      budgetTotal,
      remaining,
      isOverBudget,
      categoriesMap,
      balances
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
