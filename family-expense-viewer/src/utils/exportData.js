export const exportToCSV = (expenses, familyMembers, year, month) => {
  // Helper to get member name
  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  // Filter expenses for the selected month
  const filteredExpenses = expenses.filter(exp =>
    exp.year === year && exp.month === month
  );

  // Create CSV header
  const headers = [
    'Expense Name',
    'Category',
    'Type',
    'Planned Amount',
    'Paid Amount',
    'Paid By',
    'Year',
    'Month',
    'Notes'
  ];

  // Create CSV rows
  const rows = filteredExpenses.map(exp => [
    exp.name,
    exp.category,
    exp.isRecurring ? 'Recurring' : 'One-time',
    (exp.plannedAmount || 0).toFixed(2),
    (exp.paidAmount || 0).toFixed(2),
    getMemberName(exp.paidBy),
    exp.year,
    exp.month,
    exp.notes || ''
  ]);

  // Calculate totals
  const totalPlanned = filteredExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
  const totalPaid = filteredExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);

  // Add summary rows
  rows.push([]);
  rows.push(['TOTAL', '', '', totalPlanned.toFixed(2), totalPaid.toFixed(2), '', '', '', '']);

  // Add per-member summary
  rows.push([]);
  rows.push(['PER MEMBER SUMMARY']);
  familyMembers.forEach(member => {
    const memberExpenses = filteredExpenses.filter(exp => exp.paidBy === member.id);
    const memberPlanned = memberExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
    const memberPaid = memberExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
    rows.push([
      member.name,
      '',
      '',
      memberPlanned.toFixed(2),
      memberPaid.toFixed(2),
      '',
      '',
      '',
      ''
    ]);
  });

  // Combine into CSV string
  const csvContent = [
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

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' });
  link.setAttribute('href', url);
  link.setAttribute('download', `family-expenses-${monthName}-${year}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
