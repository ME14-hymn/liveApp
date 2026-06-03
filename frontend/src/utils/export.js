export function exportToCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row =>
    keys.map(k => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(',')
  )].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(tasks) {
  const content = tasks.map(t =>
    `${t.title} | ${t.status} | ${t.priority} | ${t.due_date || 'No due date'} | ${t.project_name || 'No project'}`
  ).join('\n');
  const blob = new Blob([`TaskFlow Export\n${'='.repeat(50)}\n\n${content}`], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'taskflow-export.txt'; a.click();
  URL.revokeObjectURL(url);
}
