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
    return `family-expenses-${monthName}-${startYear}.csv`;
  }

  const startStr = `${startYear}-${String(startMonth).padStart(2, '0')}`;
  const endStr = `${endYear}-${String(endMonth).padStart(2, '0')}`;
  return `family-expenses-${startStr}-to-${endStr}.csv`;
};

export const exportToCSV = (expenses, familyMembers, options) => {
  // Handle legacy signature (year, month as separate params)
  if (typeof options === 'number') {
    const year = options;
    const month = arguments[3];
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

  const dateLabel = getDateRangeLabel(options);

  // Create CSV header
  const headers = [
    'Expense Name',
    'Category',
    'Type',
    'Month',
    'Planned Amount',
    'Paid Amount',
    'Paid By',
    'Notes'
  ];

  // Create CSV rows
  const rows = filteredExpenses.map(exp => {
    const monthLabel = new Date(exp.year, exp.month - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
    return [
      exp.name,
      exp.category,
      exp.isRecurring ? 'Recurring' : 'One-time',
      monthLabel,
      (exp.plannedAmount || 0).toFixed(2),
      (exp.paidAmount || 0).toFixed(2),
      getMemberName(exp.paidBy),
      exp.notes || ''
    ];
  });

  // Calculate totals
  const totalPlanned = filteredExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
  const totalPaid = filteredExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);

  // Add summary rows
  rows.push([]);
  rows.push(['TOTAL', '', '', '', totalPlanned.toFixed(2), totalPaid.toFixed(2), '', '']);

  // Add per-member summary
  rows.push([]);
  rows.push(['PER MEMBER SUMMARY']);
  filteredMembers.forEach(member => {
    const memberExpenses = filteredExpenses.filter(exp => exp.paidBy === member.id);
    const memberPlanned = memberExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
    const memberPaid = memberExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
    rows.push([
      member.name,
      '',
      '',
      '',
      memberPlanned.toFixed(2),
      memberPaid.toFixed(2),
      '',
      ''
    ]);
  });

  // Combine into CSV string
  const csvContent = [
    [`Family Expense Report - ${dateLabel}`],
    [],
    headers.join(','),
    ...rows.map(row =>
      row.map(cell =>
        // Escape quotes and wrap in quotes if contains comma or quote
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', getFilename(options));
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
