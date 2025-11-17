import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (expenses, familyMembers, budgets, categoryBudgets, year, month) => {
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

  // Calculate totals
  const totalPlanned = filteredExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
  const totalPaid = filteredExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
  const totalVariance = totalPaid - totalPlanned;

  // Get budget info
  const monthBudget = budgets.find(b => b.year === year && b.month === month);
  const budgetLimit = monthBudget ? monthBudget.limit : null;

  // Initialize PDF
  const doc = new jsPDF();
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let yPos = 20;

  // ============= HEADER ===============
  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234); // Primary color
  doc.text('Family Expense Report', 14, yPos);

  yPos += 8;
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(monthName, 14, yPos);

  yPos += 3;
  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, 196, yPos);

  yPos += 10;

  // ============= SUMMARY CARDS ===============
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const cardData = [
    { label: 'Total Planned', value: `$${totalPlanned.toFixed(2)}`, color: [102, 126, 234] },
    { label: 'Total Paid', value: `$${totalPaid.toFixed(2)}`, color: [118, 75, 162] },
    { label: 'Variance', value: `$${totalVariance.toFixed(2)}`, color: totalVariance >= 0 ? [239, 68, 68] : [16, 185, 129] },
    { label: 'Budget', value: budgetLimit ? `$${budgetLimit.toFixed(2)}` : 'Not Set', color: [102, 126, 234] }
  ];

  const cardWidth = 45;
  const cardHeight = 20;
  const cardGap = 2;

  cardData.forEach((card, index) => {
    const x = 14 + (index * (cardWidth + cardGap));

    // Card border
    doc.setDrawColor(...card.color);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2);

    // Label
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(card.label, x + 3, yPos + 6);

    // Value
    doc.setFontSize(12);
    doc.setTextColor(...card.color);
    doc.setFont(undefined, 'bold');
    doc.text(card.value, x + 3, yPos + 14);
    doc.setFont(undefined, 'normal');
  });

  yPos += cardHeight + 10;

  // Budget status
  if (budgetLimit) {
    const budgetUtilization = (totalPaid / budgetLimit) * 100;
    let status = 'ON TRACK';
    let statusColor = [16, 185, 129];

    if (totalPaid > budgetLimit) {
      status = 'OVER BUDGET';
      statusColor = [239, 68, 68];
    } else if (budgetUtilization >= 90) {
      status = 'WARNING';
      statusColor = [245, 158, 11];
    }

    doc.setFontSize(9);
    doc.setTextColor(...statusColor);
    doc.setFont(undefined, 'bold');
    doc.text(`Budget Status: ${status} (${budgetUtilization.toFixed(1)}% utilized)`, 14, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
  }

  yPos += 5;

  // ============= EXPENSES TABLE ===============
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'bold');
  doc.text('Expense Details', 14, yPos);
  doc.setFont(undefined, 'normal');
  yPos += 5;

  const expenseRows = filteredExpenses.map(exp => [
    exp.name,
    exp.category,
    exp.isRecurring ? 'R' : 'O',
    `$${(exp.plannedAmount || 0).toFixed(2)}`,
    `$${(exp.paidAmount || 0).toFixed(2)}`,
    getMemberName(exp.paidBy)
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Expense', 'Category', 'Type', 'Planned', 'Paid', 'Paid By']],
    body: expenseRows,
    foot: [['TOTAL', '', '', `$${totalPlanned.toFixed(2)}`, `$${totalPaid.toFixed(2)}`, '']],
    theme: 'grid',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [60, 60, 60],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [60, 60, 60]
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 30 }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageSize.width / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  });

  // ============= NEW PAGE: CATEGORY BREAKDOWN ===============
  doc.addPage();
  yPos = 20;

  doc.setFontSize(16);
  doc.setTextColor(102, 126, 234);
  doc.text('Category Breakdown', 14, yPos);
  yPos += 10;

  // Calculate category breakdown
  const categoryBreakdown = {};
  filteredExpenses.forEach(exp => {
    if (!categoryBreakdown[exp.category]) {
      categoryBreakdown[exp.category] = { planned: 0, paid: 0, count: 0 };
    }
    categoryBreakdown[exp.category].planned += exp.plannedAmount || 0;
    categoryBreakdown[exp.category].paid += exp.paidAmount || 0;
    categoryBreakdown[exp.category].count += 1;
  });

  const getCategoryBudget = (category) => {
    const budget = categoryBudgets.find(b =>
      b.year === year &&
      b.month === month &&
      b.category === category
    );
    return budget ? budget.limit : null;
  };

  const categoryRows = Object.keys(categoryBreakdown).sort().map(category => {
    const data = categoryBreakdown[category];
    const budget = getCategoryBudget(category);
    const status = budget ?
      (data.paid > budget ? 'Over' :
       data.paid >= budget * 0.9 ? 'Warning' :
       'OK') :
      'N/A';

    return [
      category,
      data.count.toString(),
      `$${data.planned.toFixed(2)}`,
      `$${data.paid.toFixed(2)}`,
      budget ? `$${budget.toFixed(2)}` : 'N/A',
      status
    ];
  });

  doc.autoTable({
    startY: yPos,
    head: [['Category', 'Count', 'Planned', 'Paid', 'Budget', 'Status']],
    body: categoryRows,
    foot: [['TOTAL', filteredExpenses.length.toString(), `$${totalPlanned.toFixed(2)}`, `$${totalPaid.toFixed(2)}`, '', '']],
    theme: 'grid',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [60, 60, 60],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [60, 60, 60]
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 25, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ============= PER MEMBER SUMMARY ===============
  doc.setFontSize(16);
  doc.setTextColor(102, 126, 234);
  doc.text('Per Member Summary', 14, yPos);
  yPos += 10;

  const memberRows = familyMembers.map(member => {
    const memberExpenses = filteredExpenses.filter(exp => exp.paidBy === member.id);
    const memberPlanned = memberExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
    const memberPaid = memberExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
    const percentage = totalPaid > 0 ? ((memberPaid / totalPaid) * 100).toFixed(1) : '0.0';

    return [
      member.name,
      memberExpenses.length.toString(),
      `$${memberPlanned.toFixed(2)}`,
      `$${memberPaid.toFixed(2)}`,
      `${percentage}%`
    ];
  });

  doc.autoTable({
    startY: yPos,
    head: [['Member', 'Expenses', 'Planned', 'Paid', '% of Total']],
    body: memberRows,
    foot: [['TOTAL', filteredExpenses.length.toString(), `$${totalPlanned.toFixed(2)}`, `$${totalPaid.toFixed(2)}`, '100%']],
    theme: 'grid',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [60, 60, 60],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [60, 60, 60]
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 30, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  // ============= FOOTER ===============
  yPos = doc.lastAutoTable.finalY + 15;

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 14, yPos);

  // Save PDF
  doc.save(`family-expenses-${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' })}-${year}.pdf`);
};
