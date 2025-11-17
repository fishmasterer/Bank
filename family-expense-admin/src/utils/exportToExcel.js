import * as XLSX from 'xlsx';

export const exportToExcel = (expenses, familyMembers, budgets, categoryBudgets, year, month) => {
  // Helper to get member name
  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  // Filter expenses for the selected month
  const filteredExpenses = expenses.filter(exp =>
    exp.year === year && exp.month === month
  );

  // Sort by category then name
  filteredExpenses.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // ============= SHEET 1: EXPENSES ===============
  const expenseData = [
    ['Family Expense Report'],
    [`${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`],
    [],
    ['Expense Name', 'Category', 'Type', 'Planned Amount', 'Paid Amount', 'Variance', 'Paid By', 'Notes']
  ];

  filteredExpenses.forEach(exp => {
    const variance = (exp.paidAmount || 0) - (exp.plannedAmount || 0);
    expenseData.push([
      exp.name,
      exp.category,
      exp.isRecurring ? 'Recurring' : 'One-time',
      exp.plannedAmount || 0,
      exp.paidAmount || 0,
      variance,
      getMemberName(exp.paidBy),
      exp.notes || ''
    ]);
  });

  // Add totals
  const totalPlanned = filteredExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
  const totalPaid = filteredExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
  const totalVariance = totalPaid - totalPlanned;

  expenseData.push([]);
  expenseData.push(['TOTAL', '', '', totalPlanned, totalPaid, totalVariance, '', '']);

  const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);

  // Set column widths
  expenseSheet['!cols'] = [
    { wch: 25 }, // Expense Name
    { wch: 15 }, // Category
    { wch: 12 }, // Type
    { wch: 15 }, // Planned
    { wch: 15 }, // Paid
    { wch: 12 }, // Variance
    { wch: 15 }, // Paid By
    { wch: 30 }  // Notes
  ];

  XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Expenses');

  // ============= SHEET 2: PER MEMBER SUMMARY ===============
  const memberData = [
    ['Per Member Summary'],
    [`${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`],
    [],
    ['Member', 'Expense Count', 'Planned Amount', 'Paid Amount', 'Variance']
  ];

  familyMembers.forEach(member => {
    const memberExpenses = filteredExpenses.filter(exp => exp.paidBy === member.id);
    const memberPlanned = memberExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
    const memberPaid = memberExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
    const memberVariance = memberPaid - memberPlanned;

    memberData.push([
      member.name,
      memberExpenses.length,
      memberPlanned,
      memberPaid,
      memberVariance
    ]);
  });

  // Add totals
  memberData.push([]);
  memberData.push(['TOTAL', filteredExpenses.length, totalPlanned, totalPaid, totalVariance]);

  const memberSheet = XLSX.utils.aoa_to_sheet(memberData);
  memberSheet['!cols'] = [
    { wch: 20 }, // Member
    { wch: 15 }, // Count
    { wch: 18 }, // Planned
    { wch: 18 }, // Paid
    { wch: 15 }  // Variance
  ];

  XLSX.utils.book_append_sheet(workbook, memberSheet, 'Per Member');

  // ============= SHEET 3: CATEGORY BREAKDOWN ===============
  const categoryBreakdown = {};
  filteredExpenses.forEach(exp => {
    if (!categoryBreakdown[exp.category]) {
      categoryBreakdown[exp.category] = { planned: 0, paid: 0, count: 0 };
    }
    categoryBreakdown[exp.category].planned += exp.plannedAmount || 0;
    categoryBreakdown[exp.category].paid += exp.paidAmount || 0;
    categoryBreakdown[exp.category].count += 1;
  });

  const categoryData = [
    ['Category Breakdown'],
    [`${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`],
    [],
    ['Category', 'Expense Count', 'Planned Amount', 'Paid Amount', 'Variance', 'Budget', 'Budget Status']
  ];

  // Get category budget for this month
  const getCategoryBudget = (category) => {
    const budget = categoryBudgets.find(b =>
      b.year === year &&
      b.month === month &&
      b.category === category
    );
    return budget ? budget.limit : null;
  };

  Object.keys(categoryBreakdown).sort().forEach(category => {
    const data = categoryBreakdown[category];
    const variance = data.paid - data.planned;
    const budget = getCategoryBudget(category);
    const budgetStatus = budget ?
      (data.paid > budget ? `Over by $${(data.paid - budget).toFixed(2)}` :
       data.paid >= budget * 0.9 ? `${((data.paid / budget) * 100).toFixed(0)}% used` :
       `${((data.paid / budget) * 100).toFixed(0)}% used`) :
      'No budget';

    categoryData.push([
      category,
      data.count,
      data.planned,
      data.paid,
      variance,
      budget || 'N/A',
      budgetStatus
    ]);
  });

  // Add totals
  categoryData.push([]);
  categoryData.push(['TOTAL', filteredExpenses.length, totalPlanned, totalPaid, totalVariance, '', '']);

  const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
  categorySheet['!cols'] = [
    { wch: 20 }, // Category
    { wch: 15 }, // Count
    { wch: 18 }, // Planned
    { wch: 18 }, // Paid
    { wch: 15 }, // Variance
    { wch: 15 }, // Budget
    { wch: 20 }  // Status
  ];

  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categories');

  // ============= SHEET 4: BUDGET COMPARISON ===============
  const monthBudget = budgets.find(b => b.year === year && b.month === month);
  const budgetLimit = monthBudget ? monthBudget.limit : null;

  const budgetData = [
    ['Budget Comparison'],
    [`${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`],
    [],
    ['Metric', 'Amount'],
    ['Total Budget', budgetLimit || 'Not Set'],
    ['Total Planned', totalPlanned],
    ['Total Paid', totalPaid],
    ['Budget Variance', budgetLimit ? totalPaid - budgetLimit : 'N/A'],
    ['Plan Variance', totalVariance],
    [],
    ['Budget Utilization', budgetLimit ? `${((totalPaid / budgetLimit) * 100).toFixed(1)}%` : 'N/A'],
    ['Planned vs Budget', budgetLimit ? `${((totalPlanned / budgetLimit) * 100).toFixed(1)}%` : 'N/A'],
    [],
    ['Status', budgetLimit ?
      (totalPaid > budgetLimit ? 'OVER BUDGET' :
       totalPaid >= budgetLimit * 0.9 ? 'WARNING' :
       'ON TRACK') : 'NO BUDGET SET']
  ];

  const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
  budgetSheet['!cols'] = [
    { wch: 25 }, // Metric
    { wch: 20 }  // Amount
  ];

  XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget');

  // Write file
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' });
  XLSX.writeFile(workbook, `family-expenses-${monthName}-${year}.xlsx`);
};
