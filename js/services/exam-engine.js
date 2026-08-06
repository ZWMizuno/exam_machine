// === Exam Engine Service ===
// Session generation, scoring, answer checking

function checkAnswer(userAnswer, correctAnswer, type) {
  if (userAnswer === null || userAnswer === undefined || userAnswer === '') return false;

  switch (type) {
    case 'single':
      return (userAnswer || '').trim().toUpperCase() === correctAnswer;

    case 'multi': {
      const ua = [...(userAnswer || '')].filter(c => /[A-H]/i.test(c)).map(c => c.toUpperCase()).sort().join('');
      return ua === (correctAnswer || '');
    }

    case 'tf':
      return String(userAnswer) === String(correctAnswer);

    case 'fill':
      if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) return false;
      return correctAnswer.every((ans, i) =>
        (userAnswer[i] || '').trim().replace(/\s+/g, '').toLowerCase() === ans.toLowerCase()
      );

    case 'essay':
      return (userAnswer || '').trim().replace(/\s+/g, '').toLowerCase() === (correctAnswer || '').toLowerCase();

    default:
      return false;
  }
}

// Generate exam session from bank + mode
async function generateExamSession(bankId, modeId) {
  const bank = await getBankById(bankId);
  const mode = await getExamModeById(modeId);
  if (!bank || !mode) throw new Error('题库或考试模式不存在');

  const configs = mode.configs || [];
  let allQuestions = [];
  let sessionNumber = 1;

  for (const cfg of configs) {
    const questions = await getQuestionsByBank(bankId, cfg.type);
    if (questions.length < cfg.count) {
      throw new Error(`${TYPE_LABELS[cfg.type]}仅有 ${questions.length} 道题，无法满足配置的 ${cfg.count} 道`);
    }

    // Shuffle and pick
    const shuffled = shuffle(questions).slice(0, cfg.count);

    for (const q of shuffled) {
      let displayOptions = q.options;
      let remappedAnswer = q.answer;

      if (cfg.shuffleOptions && (cfg.type === 'single' || cfg.type === 'multi')) {
        const result = shuffleQuestionOptions(q.options, q.answer);
        displayOptions = result.shuffledOptions;
        remappedAnswer = result.newCorrectLabel;
      }

      allQuestions.push({
        sessionNumber: sessionNumber++,
        questionId: q.id,
        bankId: bankId,
        type: q.type,
        number: q.number,
        content: q.content,
        options: displayOptions,
        answer: q.answer, // original answer for scoring
        displayAnswer: remappedAnswer, // remapped after shuffle
        points: cfg.points,
        shuffleOptions: cfg.shuffleOptions
      });
    }
  }

  const user = getCurrentUser();
  const session = {
    userId: user.id,
    type: 'exam',
    bankId,
    bankName: bank.name,
    modeId,
    modeName: mode.name,
    questions: allQuestions,
    userAnswers: {},
    startTime: new Date().toISOString(),
    durationSeconds: mode.durationMinutes * 60,
    elapsedSeconds: 0,
    instantFeedback: false,
    submitted: false,
    totalScore: mode.totalScore,
    passScore: mode.passScore
  };

  await saveSession(session);
  setState({ currentExam: session });
  return session;
}

// Generate practice session
async function generatePracticeSession(bankId, configs) {
  const bank = await getBankById(bankId);
  if (!bank) throw new Error('题库不存在');

  let allQuestions = [];

  for (const cfg of configs) {
    let questions = await getQuestionsByBank(bankId, cfg.type);
    questions = questions.sort((a, b) => a.number - b.number);

    // Filter by number range
    if (cfg.startNumber && cfg.endNumber) {
      questions = questions.filter(q => q.number >= cfg.startNumber && q.number <= cfg.endNumber);
    }

    if (questions.length === 0) continue;

    for (const q of questions) {
      let displayOptions = q.options;
      let remappedAnswer = q.answer;

      if (cfg.shuffleOptions && (cfg.type === 'single' || cfg.type === 'multi')) {
        const result = shuffleQuestionOptions(q.options, q.answer);
        displayOptions = result.shuffledOptions;
        remappedAnswer = result.newCorrectLabel;
      }

      allQuestions.push({
        sessionNumber: q.number, // keep original numbers in practice
        questionId: q.id,
        bankId: bankId,
        type: q.type,
        number: q.number,
        content: q.content,
        options: displayOptions,
        answer: q.answer,
        displayAnswer: remappedAnswer,
        points: 0, // no scoring in practice
        shuffleOptions: cfg.shuffleOptions
      });
    }
  }

  const user = getCurrentUser();
  const session = {
    userId: user.id,
    type: 'practice',
    bankId,
    bankName: bank.name,
    modeId: null,
    modeName: null,
    questions: allQuestions,
    userAnswers: {},
    startTime: new Date().toISOString(),
    durationSeconds: 0,
    elapsedSeconds: 0,
    instantFeedback: false,
    submitted: false,
    totalScore: 0,
    passScore: 0
  };

  await saveSession(session);
  setState({ currentExam: session });
  return session;
}

// Shuffle options and remap correct answer
function shuffleQuestionOptions(options, correctAnswer) {
  if (!options) return { shuffledOptions: options, newCorrectLabel: correctAnswer };

  const labels = Object.keys(options).sort();
  const indexed = labels.map(label => ({ text: options[label], originalLabel: label }));

  // Fisher-Yates shuffle
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }

  // Re-label
  const shuffledOptions = {};
  const newLabels = 'ABCDEFGH';
  const mapping = {}; // oldLabel → newLabel

  for (let i = 0; i < indexed.length; i++) {
    shuffledOptions[newLabels[i]] = indexed[i].text;
    mapping[indexed[i].originalLabel] = newLabels[i];
  }

  // Remap answer
  let newCorrectLabel = correctAnswer;
  if (correctAnswer && typeof correctAnswer === 'string') {
    if (correctAnswer.length === 1) {
      // Single choice - map directly
      newCorrectLabel = mapping[correctAnswer] || correctAnswer;
    } else {
      // Multi choice - map each letter and sort
      newCorrectLabel = [...correctAnswer].map(c => mapping[c] || c).sort().join('');
    }
  }

  return { shuffledOptions, newCorrectLabel };
}

// Score a session
function scoreSession(session) {
  let correctCount = 0;
  let totalScore = 0;
  const wrongQuestionIds = [];

  for (const q of session.questions) {
    const userAnswer = session.userAnswers[q.questionId];
    const isCorrect = checkAnswer(userAnswer, q.answer, q.type);

    if (isCorrect) {
      correctCount++;
      totalScore += (q.points || 0);
    } else if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
      // Only count as wrong if user provided an answer
      wrongQuestionIds.push(q.questionId);
    }
  }

  return { correctCount, totalScore, wrongQuestionIds, totalQuestions: session.questions.length };
}

// Record results to history and wrong questions
async function recordResults(session, scoreResult) {
  const user = getCurrentUser();

  const historyRecord = {
    userId: user.id,
    bankId: session.bankId,
    bankName: session.bankName,
    type: session.type,
    modeName: session.modeName,
    score: scoreResult.totalScore,
    totalScore: session.totalScore || session.questions.length,
    correctCount: scoreResult.correctCount,
    totalCount: scoreResult.totalQuestions,
    wrongQuestionIds: scoreResult.wrongQuestionIds,
    timeSpent: session.elapsedSeconds || 0,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  await addHistory(historyRecord);

  // Allocate colorIndex for this bank if not already assigned
  const existingWQ = await db.wrongQuestions.where('[userId+bankId]').equals([user.id, session.bankId]).first();
  const colorIndex = existingWQ ? existingWQ.colorIndex : await allocColorIndex(user.id);

  // Record wrong questions (snapshots)
  for (const qid of scoreResult.wrongQuestionIds) {
    const q = session.questions.find(sq => sq.questionId === qid);
    if (!q) continue;

    const existing = await getWrongQuestionByUserAndQuestion(user.id, qid);
    if (existing) {
      existing.wrongCount++;
      existing.correctStreak = 0;
      existing.lastWrongDate = new Date().toISOString();
      await putWrongQuestion(existing);
    } else {
      await addWrongQuestion({
        userId: user.id,
        questionId: qid,
        bankId: session.bankId,
        type: q.type,
        number: q.number,
        content: q.content,
        options: q.options,
        answer: q.answer,
        wrongCount: 1,
        correctStreak: 0,
        lastWrongDate: new Date().toISOString(),
        colorIndex
      });
    }
  }
}

// Record wrong answer immediately (practice with instant feedback ON)
async function recordWrongImmediately(session, questionItem) {
  const user = getCurrentUser();
  const existing = await getWrongQuestionByUserAndQuestion(user.id, questionItem.questionId);

  if (existing) {
    existing.wrongCount++;
    existing.correctStreak = 0;
    existing.lastWrongDate = new Date().toISOString();
    await putWrongQuestion(existing);
  } else {
    const existingWQ = await db.wrongQuestions.where('[userId+bankId]').equals([user.id, session.bankId]).first();
    const colorIndex = existingWQ ? existingWQ.colorIndex : await allocColorIndex(user.id);
    await addWrongQuestion({
      userId: user.id,
      questionId: questionItem.questionId,
      bankId: session.bankId,
      type: questionItem.type,
      number: questionItem.number,
      content: questionItem.content,
      options: questionItem.options,
      answer: questionItem.answer,
      wrongCount: 1,
      correctStreak: 0,
      lastWrongDate: new Date().toISOString(),
      colorIndex
    });
  }
}
