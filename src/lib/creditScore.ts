import { Transaction } from '../types';
import { isBefore, subDays } from 'date-fns';

export function calculateCreditScore(transactions: Transaction[]): number {
  if (transactions.length === 0) return 300;

  const totalSales = transactions.filter(t => t.type === 'SALE').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const unpaidBaki = transactions.filter(t => t.isBaki).reduce((acc, t) => acc + t.amount, 0);
  
  const overdueCount = transactions.filter(t => 
    t.isBaki && t.dueDate && isBefore(new Date(t.dueDate), new Date())
  ).length;

  // Base calculation: Ratio of revenue to total volume
  const volume = totalSales + totalExpenses;
  let score = 300;

  if (volume > 0) {
    // Increase for volume and consistency
    const volumeFactor = Math.min(volume / 50000, 1) * 200;
    const profitFactor = totalSales > totalExpenses ? 150 : 0;
    score += volumeFactor + profitFactor;
  }

  // Penalty for debt
  const debtRatio = volume > 0 ? (unpaidBaki / volume) : 0;
  score -= (debtRatio * 200);

  // Heavy penalty for overdue
  score -= (overdueCount * 50);

  // Bonus for consistent activity in last 30 days
  const recentTx = transactions.filter(t => isBefore(subDays(new Date(), 30), new Date(t.timestamp))).length;
  score += Math.min(recentTx * 5, 150);

  return Math.round(Math.max(0, Math.min(1000, score)));
}

export function getCreditStatus(score: number): { label: string, color: string, description: string } {
  if (score >= 800) return { label: 'Elite', color: 'text-blue-600', description: 'Superior financial health. Eligible for high-limit financing.' };
  if (score >= 650) return { label: 'Good', color: 'text-green-600', description: 'Strong repayment history. Low risk for lenders.' };
  if (score >= 500) return { label: 'Average', color: 'text-orange-600', description: 'Fair standing. Minor improvements in repayment needed.' };
  return { label: 'Poor', color: 'text-red-600', description: 'High risk. Reduce outstanding debts to improve score.' };
}
