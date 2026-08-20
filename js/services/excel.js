// === Excel Service: Import, Export, Template Generation ===

// Generate standard 5-sheet empty template
function generateTemplate() {
  const wb = XLSX.utils.book_new();

  const singleHeaders = ['序号', '题目内容', '选项A', '选项B', '选项C', '选项D', '正确选项'];
  const multiHeaders = ['序号', '题目内容', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '选项G', '选项H', '正确选项'];
  const tfHeaders = ['序号', '题目内容', '正确答案'];
  const fillHeaders = ['序号', '题目内容', '空1答案', '空2答案', '空3答案', '空4答案', '空5答案', '空6答案', '空7答案', '空8答案'];
  const essayHeaders = ['序号', '题目内容', '正确答案'];

  addSheet(wb, '单项选择题', [singleHeaders]);
  addSheet(wb, '多项选择题', [multiHeaders]);
  addSheet(wb, '判断题', [tfHeaders]);
  addSheet(wb, '填空题', [fillHeaders]);
  addSheet(wb, '问答题', [essayHeaders]);

  const data = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, '考试题库标准模板.xlsx');
}

function addSheet(wb, name, rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Set column widths
  ws['!cols'] = rows[0].map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, name);
}

// Parse uploaded Excel workbook
async function parseWorkbook(file, bankName) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const allQuestions = [];

        const sheetNames = wb.SheetNames;
        for (const sheetName of sheetNames) {
          const type = detectSheetType(sheetName);
          if (!type) continue;

          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

          if (rows.length < 2) continue; // Only header, no data

          const headerRow = rows[0];
          const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));
          if (dataRows.length === 0) continue; // Empty data

          const questions = parseRowsByType(dataRows, headerRow, type, allQuestions.length);
          allQuestions.push(...questions);
        }

        // Auto-number all questions per type
        const typeCounters = { single: 0, multi: 0, tf: 0, fill: 0, essay: 0 };
        for (const q of allQuestions) {
          typeCounters[q.type]++;
          if (!q.number) q.number = typeCounters[q.type];
        }

        resolve({ name: bankName, questions: allQuestions });
      } catch (err) {
        reject(new Error('Excel 解析失败：' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

function parseRowsByType(rows, headerRow, type, startIndex) {
  const questions = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

    const number = extractNumber(row[0], startIndex + questions.length + 1);
    const content = String(row[1] || '').trim();
    if (!content) continue;

    let question = { type, number, content, options: null, answer: null };

    switch (type) {
      case 'single':
        question.options = extractOptions(row, 2, 6); // cols 2-5 (A-D)
        question.answer = normalizeSingleAnswer(row[6]);
        break;

      case 'multi': {
        question.options = extractOptions(row, 2, 10); // cols 2-9 (A-H)
        question.answer = normalizeMultiAnswer(row[10]);
        break;
      }

      case 'tf':
        question.answer = normalizeTFAnswer(row[2]);
        if (!question.answer) continue; // Skip if TF answer not recognized
        break;

      case 'fill': {
        const blanks = [];
        for (let j = 2; j < 10; j++) {
          const val = String(row[j] || '').trim();
          if (val) blanks.push(val.replace(/\s+/g, ''));
        }
        if (blanks.length === 0) continue;
        question.answer = blanks;
        question.fillBlankCount = blanks.length;
        break;
      }

      case 'essay': {
        const ans = String(row[2] || '').trim().replace(/\s+/g, '');
        if (!ans) continue;
        question.answer = ans;
        break;
      }
    }

    if (question.answer !== null && question.answer !== undefined) {
      questions.push(question);
    }
  }

  return questions;
}

function extractNumber(val, defaultNum) {
  if (val === '' || val === null || val === undefined) return defaultNum;
  const num = parseInt(val);
  return isNaN(num) ? defaultNum : num;
}

function extractOptions(row, startCol, endCol) {
  const opts = {};
  const labels = 'ABCDEFGH';
  for (let j = startCol; j < endCol; j++) {
    const val = String(row[j] || '').trim();
    if (val) {
      opts[labels[j - startCol]] = val;
    }
  }
  return Object.keys(opts).length > 0 ? opts : null;
}

function normalizeSingleAnswer(val) {
  if (val === '' || val === null || val === undefined) return null;
  return String(val).trim().toUpperCase().replace(/[^A-D]/g, '') || null;
}

function normalizeMultiAnswer(val) {
  if (val === '' || val === null || val === undefined) return null;
  const cleaned = String(val).trim().toUpperCase();
  const letters = [...cleaned].filter(c => /[A-H]/.test(c)).sort().join('');
  return letters || null;
}

// Export bank to standard Excel template format
async function exportBank(bankId) {
  try {
  const bank = await getBankById(bankId);
  if (!bank) { showToast('题库不存在', 'error'); return; }

  const questions = await getQuestionsByBank(bankId);
  const byType = {};
  for (const t of QUESTION_TYPES) {
    byType[t] = questions.filter(q => q.type === t).sort((a, b) => a.number - b.number);
  }

  const wb = XLSX.utils.book_new();
  const labels = 'ABCDEFGH';

  // Single choice sheet
  const singleRows = [['序号', '题目内容', '选项A', '选项B', '选项C', '选项D', '正确选项']];
  for (const q of byType.single) {
    singleRows.push([q.number, q.content, q.options?.A || '', q.options?.B || '', q.options?.C || '', q.options?.D || '', q.answer]);
  }
  addSheet(wb, '单项选择题', singleRows);

  // Multi choice sheet
  const multiRows = [['序号', '题目内容', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '选项G', '选项H', '正确选项']];
  for (const q of byType.multi) {
    multiRows.push([q.number, q.content, q.options?.A || '', q.options?.B || '', q.options?.C || '', q.options?.D || '', q.options?.E || '', q.options?.F || '', q.options?.G || '', q.options?.H || '', q.answer]);
  }
  addSheet(wb, '多项选择题', multiRows);

  // TF sheet
  const tfRows = [['序号', '题目内容', '正确答案']];
  for (const q of byType.tf) {
    tfRows.push([q.number, q.content, q.answer === 'true' ? '对' : '错']);
  }
  addSheet(wb, '判断题', tfRows);

  // Fill blank sheet
  const fillRows = [['序号', '题目内容', '空1答案', '空2答案', '空3答案', '空4答案', '空5答案', '空6答案', '空7答案', '空8答案']];
  for (const q of byType.fill) {
    const blanks = q.answer || [];
    fillRows.push([q.number, q.content, ...blanks, ...Array(Math.max(0, 8 - blanks.length)).fill('')]);
  }
  addSheet(wb, '填空题', fillRows);

  // Essay sheet
  const essayRows = [['序号', '题目内容', '正确答案']];
  for (const q of byType.essay) {
    essayRows.push([q.number, q.content, q.answer]);
  }
  addSheet(wb, '问答题', essayRows);

  const data = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${bank.name}.xlsx`);
  showToast('题库已导出', 'success');
  } catch (err) {
    showToast('导出失败：' + err.message, 'error');
  }
}

// Batch export - multiple banks as separate files or zipped
async function batchExportBanks(bankIds) {
  if (bankIds.length === 0) { showToast('请选择题库', 'warning'); return; }
  if (bankIds.length === 1) { await exportBank(bankIds[0]); return; }

  try {
    const zip = new JSZip();
    for (const bankId of bankIds) {
      const bank = await getBankById(bankId);
      if (!bank) continue;
      const questions = await getQuestionsByBank(bankId);
      const wb = buildExportWorkbook(bank, questions);
      const data = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      zip.file(`${bank.name}.xlsx`, data);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, '题库批量导出.zip');
    showToast('批量导出完成', 'success');
  } catch (e) {
    showToast('导出失败：' + e.message, 'error');
  }
}

function buildExportWorkbook(bank, questions) {
  // Same logic as exportBank but returns workbook instead of downloading
  const wb = XLSX.utils.book_new();
  const byType = {};
  for (const t of QUESTION_TYPES) {
    byType[t] = questions.filter(q => q.type === t).sort((a, b) => a.number - b.number);
  }

  const singleRows = [['序号', '题目内容', '选项A', '选项B', '选项C', '选项D', '正确选项']];
  for (const q of byType.single) singleRows.push([q.number, q.content, q.options?.A || '', q.options?.B || '', q.options?.C || '', q.options?.D || '', q.answer]);
  addSheet(wb, '单项选择题', singleRows);

  const multiRows = [['序号', '题目内容', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '选项G', '选项H', '正确选项']];
  for (const q of byType.multi) multiRows.push([q.number, q.content, q.options?.A || '', q.options?.B || '', q.options?.C || '', q.options?.D || '', q.options?.E || '', q.options?.F || '', q.options?.G || '', q.options?.H || '', q.answer]);
  addSheet(wb, '多项选择题', multiRows);

  const tfRows = [['序号', '题目内容', '正确答案']];
  for (const q of byType.tf) tfRows.push([q.number, q.content, q.answer === 'true' ? '对' : '错']);
  addSheet(wb, '判断题', tfRows);

  const fillRows = [['序号', '题目内容', '空1答案', '空2答案', '空3答案', '空4答案', '空5答案', '空6答案', '空7答案', '空8答案']];
  for (const q of byType.fill) {
    const blanks = q.answer || [];
    fillRows.push([q.number, q.content, ...blanks, ...Array(Math.max(0, 8 - blanks.length)).fill('')]);
  }
  addSheet(wb, '填空题', fillRows);

  const essayRows = [['序号', '题目内容', '正确答案']];
  for (const q of byType.essay) essayRows.push([q.number, q.content, q.answer]);
  addSheet(wb, '问答题', essayRows);

  return wb;
}
