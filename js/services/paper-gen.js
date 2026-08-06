// === Paper Generation Service ===
// Generate Word (.docx) question paper + answer key, zip them together

const LANDSCAPE = (typeof docx !== 'undefined' && docx.PageOrientation && docx.PageOrientation.LANDSCAPE) || 'landscape';

async function generatePaper(bankId, configs, paperName, paperFormat, duration) {
  try {
    const bank = await getBankById(bankId);
    if (!bank) throw new Error('题库不存在');

    // Select questions
    let allQuestions = [];
    for (const cfg of configs) {
      if (!cfg.count || cfg.count <= 0) continue;
      const questions = await getQuestionsByBank(bankId, cfg.type);
      const selected = shuffle(questions).slice(0, Math.min(cfg.count, questions.length));

      for (const q of selected) {
        let displayOptions = q.options;
        let displayAnswer = q.answer;

        if (cfg.shuffleOptions && (cfg.type === 'single' || cfg.type === 'multi')) {
          const result = shuffleQuestionOptions(q.options, q.answer);
          displayOptions = result.shuffledOptions;
          displayAnswer = result.newCorrectLabel;
        }

        allQuestions.push({ ...q, options: displayOptions, displayAnswer, points: cfg.points });
      }
    }

    // Calculate total score
    const totalScore = configs.reduce((sum, c) => sum + (c.count || 0) * (c.points || 0), 0);

    // Build pages — landscape orientation
    // docx.js needs PORTRAIT dimensions + orientation flag; it swaps internally
    // A4 portrait: 210×297mm, A3 portrait: 297×420mm
    const pageSize = paperFormat === 'A3'
      ? { width: 841.9 * 20, height: 1190.55 * 20 }   // A3 portrait dims
      : { width: 595.3 * 20, height: 841.9 * 20 };     // A4 portrait dims

    // Question paper
    const qDoc = buildQuestionPaper(paperName, duration, totalScore, configs, allQuestions, pageSize);

    // Answer key
    const aDoc = buildAnswerKey(paperName, allQuestions, pageSize);

    // Generate blobs
    const qBlob = await docx.Packer.toBlob(qDoc);
    const aBlob = await docx.Packer.toBlob(aDoc);

    // Zip them
    const zip = new JSZip();
    zip.file(`${paperName}_试卷.docx`, qBlob);
    zip.file(`${paperName}_答案.docx`, aBlob);
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    saveAs(zipBlob, `${paperName}.zip`);
    showToast('试卷已生成并开始下载', 'success');
  } catch (e) {
    console.error('Paper generation error:', e);
    showToast('试卷生成失败：' + e.message, 'error');
  }
}

function buildQuestionPaper(paperName, duration, totalScore, configs, questions, pageSize) {
  const children = [];

  // === Horizontal sealed area at top ===
  // Candidate info fields arranged horizontally, matching the reference template
  const sealedTable = new docx.Table({
    rows: [
      new docx.TableRow({
        children: [
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                children: [
                  new docx.TextRun({ text: '学院：_______________', size: 16, font: 'SimSun' }),
                  new docx.TextRun({ text: '    专业：_______________', size: 16, font: 'SimSun' }),
                  new docx.TextRun({ text: '    年级：_______', size: 16, font: 'SimSun' }),
                  new docx.TextRun({ text: '    学号：_______________', size: 16, font: 'SimSun' }),
                  new docx.TextRun({ text: '    姓名：_______________', size: 16, font: 'SimSun' }),
                ],
                spacing: { after: 120 }
              }),
              new docx.Paragraph({
                children: [new docx.TextRun({ text: '密封线内请勿答题', size: 16, font: 'SimSun', italics: true })],
                alignment: docx.AlignmentType.RIGHT,
              }),
            ],
            borders: {
              bottom: { style: docx.BorderStyle.DASHED, size: 8, color: '000000' }
            }
          })
        ]
      })
    ],
    width: { size: 100, type: docx.WidthType.PERCENTAGE }
  });

  children.push(sealedTable);

  // Title
  children.push(
    new docx.Paragraph({
      children: [new docx.TextRun({ text: paperName, bold: true, size: 28, font: 'SimHei' })],
      alignment: docx.AlignmentType.CENTER,
      spacing: { before: 200, after: 150 }
    })
  );

  // Meta info
  children.push(
    new docx.Paragraph({
      children: [new docx.TextRun({ text: `考试时间：${duration} 分钟    满分：${totalScore} 分`, size: 18, font: 'SimSun' })],
      alignment: docx.AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  // Type sections
  let globalNum = 1;
  for (const cfg of configs) {
    if (!cfg.count || cfg.count <= 0) continue;
    const typeQuestions = questions.filter(q => q.type === cfg.type);
    if (typeQuestions.length === 0) continue;

    const typeScore = cfg.count * cfg.points;

    children.push(
      new docx.Paragraph({
        children: [new docx.TextRun({ text: `${TYPE_LABELS[cfg.type]}（共 ${cfg.count} 题，每题 ${cfg.points} 分，合计 ${typeScore} 分）`, bold: true, size: 18, font: 'SimHei' })],
        spacing: { before: 150, after: 80 }
      })
    );

    for (const q of typeQuestions) {
      // TF appends blank inline, fill already has blanks in content
      const tfSuffix = q.type === 'tf' ? '（    ）' : '';
      children.push(
        new docx.Paragraph({
          children: [new docx.TextRun({ text: `${globalNum}. ${q.content}${tfSuffix}`, size: 18, font: 'SimSun' })],
          spacing: { before: 80, after: 40 }
        })
      );

      if (q.type === 'single' || q.type === 'multi') {
        const opts = q.options || {};
        const labels = Object.keys(opts).sort();
        // Two options per line for compact layout
        for (let i = 0; i < labels.length; i += 2) {
          const lbl1 = labels[i];
          const lbl2 = labels[i + 1];
          let text = `   ${lbl1}. ${opts[lbl1]}`;
          if (lbl2) text += `          ${lbl2}. ${opts[lbl2]}`;
          children.push(
            new docx.Paragraph({
              children: [new docx.TextRun({ text, size: 18, font: 'SimSun' })],
              indent: { left: 400 }
            })
          );
        }
      } else if (q.type === 'essay') {
        children.push(
          new docx.Paragraph({ children: [new docx.TextRun({ text: '', size: 18 })], spacing: { after: 400 } })
        );
      }

      globalNum++;
    }
  }

  return new docx.Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: pageSize.width,
            height: pageSize.height,
            orientation: LANDSCAPE
          }
        },
        column: { count: 2, space: 600 }
      },
      children
    }]
  });
}

function buildAnswerKey(paperName, questions, pageSize) {
  const children = [];

  children.push(
    new docx.Paragraph({
      children: [new docx.TextRun({ text: `${paperName} - 答案`, bold: true, size: 26, font: 'SimHei' })],
      alignment: docx.AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  );

  questions.forEach((q, i) => {
    let answerText = '';
    switch (q.type) {
      case 'single': answerText = q.displayAnswer || q.answer; break;
      case 'multi': answerText = (q.displayAnswer || q.answer || '').split('').join(', '); break;
      case 'tf': answerText = q.answer === 'true' ? '正确 (True)' : '错误 (False)'; break;
      case 'fill':
        answerText = Array.isArray(q.answer) ? q.answer.map((a, j) => `空${j + 1}: ${a}`).join('；') : (q.answer || '');
        break;
      case 'essay': answerText = q.answer || ''; break;
    }

    children.push(
      new docx.Paragraph({
        children: [new docx.TextRun({ text: `${i + 1}. ${answerText}`, size: 18, font: 'SimSun' })],
        spacing: { after: 50 }
      })
    );
  });

  return new docx.Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: pageSize.width,
            height: pageSize.height
          }
        },
        column: { count: 2, space: 600 }
      },
      children
    }]
  });
}
