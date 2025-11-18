import * as XLSX from 'xlsx';

// Helper to filter expenses by date range and members
const filterExpenses = (expenses, options) => {
  const { startYear, startMonth, endYear, endMonth, selectedMembers } = options;

  return expenses.filter(exp => {
    // Check date range
    const expDate = new Date(exp.year, exp.month - 1);
    const startDate = new Date(startYear, startMonth - 1);
    const endDate = new Date(endYear, endMonth - 1);

    if (expDate < startDate || expDate > endDate) {
      return false;
    }

    // Check member filter
    if (selectedMembers && !selectedMembers.includes(exp.paidBy)) {
      return false;
    }

    return true;
  });
};

// Helper to generate date range label
const getDateRangeLabel = (options) => {
  const { startYear, startMonth, endYear, endMonth } = options;

  if (startYear === endYear && startMonth === endMonth) {
    return new Date(startYear, startMonth - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  const start = new Date(startYear, startMonth - 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
  const end = new Date(endYear, endMonth - 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });

  return `${start} - ${end}`;
};

// Helper to generate filename
const getFilename = (options) => {
  const { startYear, startMonth, endYear, endMonth } = options;

  if (startYear === endYear && startMonth === endMonth) {
    const monthName = new Date(startYear, startMonth - 1).toLocaleDateString('en-US', { month: 'long' });
    return `family-expenses-${monthName}-${startYear}.xlsx`;
  }

  const startStr = `${startYear}-${String(startMonth).padStart(2, '0')}`;
  const endStr = `${endYear}-${String(endMonth).padStart(2, '0')}`;
  return `family-expenses-${startStr}-to-${endStr}.xlsx`;
};

export const exportToExcel = (expenses, familyMembers, budgets, categoryBudgets, options) => {
  // Handle legacy signature (year, month as separate params)
  if (typeof options === 'number') {
    const year = options;
    const month = arguments[5];
    options = {
      startYear: year,
      startMonth: month,
      endYear: year,
      endMonth: month,
      selectedMembers: familyMembers.map(m => m.id)
    };
  }

  // Helper to get member name
  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  // Filter expenses by date range and selected members
  const filteredExpenses = filterExpenses(expenses, options);

  // Get filtered family members
  const filteredMembers = familyMembers.filter(m =>
    options.selectedMembers.includes(m.id)
  );

  // Sort by date, then category, then name
  filteredExpenses.sort((a, b) => {
    // First by date
    const dateA = new Date(a.year, a.month - 1);
    const dateB = new Date(b.year, b.month - 1);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    // Then by category
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    // Then by name
    return a.name.localeCompare(b.name);
  });

  // Create workbook
  const workbook = XLSX.utils.book_new();
  const dateLabel = getDateRangeLabel(options);

  // ============= SHEET 1: EXPENSES ===============
  const expenseData = [
    ['Family Expense Report'],
    [dateLabel],
    [],
    ['Expense Name', 'Category', 'Type', 'Month', 'Planned Amount', 'Paid Amount', 'Variance', 'Paid By', 'Notes']
  ];

  filteredExpenses.forEach(exp => {
    const variance = (exp.paidAmount || 0) - (exp.plannedAmount || 0);
    const monthLabel = new Date(exp.year, exp.month - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
    expenseData.push([
      exp.name,
      exp.category,
      exp.isRecurring ? 'Recurring' : 'One-time',
      monthLabel,
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
  expenseData.push(['TOTAL', '', '', '', totalPlanned, totalPaid, totalVariance, '', '']);

  const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);

  // Set column widths
  expenseSheet['!cols'] = [
    { wch: 25 }, // Expense Name
    { wch: 15 }, // Category
    { wch: 12 }, // Type
    { wch: 12 }, // Month
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
    [dateLabel],
    [],
    ['Member', 'Expense Count', 'Planned Amount', 'Paid Amount', 'Variance']
  ];

  filteredMembers.forEach(member => {
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
    [dateLabel],
    [],
    ['Category', 'Expense Count', 'Planned Amount', 'Paid Amount', 'Variance', 'Avg Budget', 'Budget Status']
  ];

  // Get category budget for the date range (average if multiple months)
  const getCategoryBudgetAvg = (category) => {
    if (!categoryBudgets || categoryBudgets.length === 0) return null;

    const relevantBudgets = categoryBudgets.filter(b => {
      const budgetDate = new Date(b.year, b.month - 1);
      const startDate = new Date(options.startYear, options.startMonth - 1);
      const endDate = new Date(options.endYear, options.endMonth - 1);
      return budgetDate >= startDate && budgetDate <= endDate && b.category === category;
    });

    if (relevantBudgets.length === 0) return null;
    return relevantBudgets.reduce((sum, b) => sum + b.limit, 0) / relevantBudgets.length;
  };

  Object.keys(categoryBreakdown).sort().forEach(category => {
    const data = categoryBreakdown[category];
    const variance = data.paid - data.planned;
    const budget = getCategoryBudgetAvg(category);
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
      budget ? budget.toFixed(2) : 'N/A',
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

  // ============= SHEET 4: MONTHLY BREAKDOWN (for date ranges) ===============
  if (options.startYear !== options.endYear || options.startMonth !== options.endMonth) {
    const monthlyData = [
      ['Monthly Breakdown'],
      [dateLabel],
      [],
      ['Month', 'Expense Count', 'Planned Amount', 'Paid Amount', 'Variance']
    ];

    // Group by month
    const monthlyBreakdown = {};
    filteredExpenses.forEach(exp => {
      const key = `${exp.year}-${String(exp.month).padStart(2, '0')}`;
      if (!monthlyBreakdown[key]) {
        monthlyBreakdown[key] = { year: exp.year, month: exp.month, planned: 0, paid: 0, count: 0 };
      }
      monthlyBreakdown[key].planned += exp.plannedAmount || 0;
      monthlyBreakdown[key].paid += exp.paidAmount || 0;
      monthlyBreakdown[key].count += 1;
    });

    Object.keys(monthlyBreakdown).sort().forEach(key => {
      const data = monthlyBreakdown[key];
      const monthLabel = new Date(data.year, data.month - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
      monthlyData.push([
        monthLabel,
        data.count,
        data.planned,
        data.paid,
        data.paid - data.planned
      ]);
    });

    monthlyData.push([]);
    monthlyData.push(['TOTAL', filteredExpenses.length, totalPlanned, totalPaid, totalVariance]);

    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
    monthlySheet['!cols'] = [
      { wch: 20 }, // Month
      { wch: 15 }, // Count
      { wch: 18 }, // Planned
      { wch: 18 }, // Paid
      { wch: 15 }  // Variance
    ];

    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly');
  }

  // ============= SHEET 5: BUDGET COMPARISON ===============
  const getTotalBudget = () => {
    if (!budgets || budgets.length === 0) return null;

    const relevantBudgets = budgets.filter(b => {
      const budgetDate = new Date(b.year, b.month - 1);
      const startDate = new Date(options.startYear, options.startMonth - 1);
      const endDate = new Date(options.endYear, options.endMonth - 1);
      return budgetDate >= startDate && budgetDate <= endDate;
    });

    if (relevantBudgets.length === 0) return null;
    return relevantBudgets.reduce((sum, b) => sum + b.limit, 0);
  };

  const budgetLimit = getTotalBudget();

  const budgetData = [
    ['Budget Comparison'],
    [dateLabel],
    [],
    ['Metric', 'Amount'],
    ['Total Budget', budgetLimit ? budgetLimit.toFixed(2) : 'Not Set'],
    ['Total Planned', totalPlanned.toFixed(2)],
    ['Total Paid', totalPaid.toFixed(2)],
    ['Budget Variance', budgetLimit ? (totalPaid - budgetLimit).toFixed(2) : 'N/A'],
    ['Plan Variance', totalVariance.toFixed(2)],
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
  XLSX.writeFile(workbook, getFilename(options));
};
