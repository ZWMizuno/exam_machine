// === Exam Machine Database Layer (Dexie.js) ===

const db = new Dexie("ExamMachineDB");

db.version(1).stores({
  users:          "++id, &username",
  banks:          "++id, name",
  questions:      "++id, bankId, [bankId+type], type",
  examModes:      "++id, bankId",
  examSessions:   "++id, userId",
  history:        "++id, userId, bankId, createdAt",
  wrongQuestions: "++id, [userId+bankId], userId, bankId, questionId"
});

// === Users ===
async function createUser(user) { return await db.users.add(user); }
async function getUserByUsername(username) { return await db.users.where('username').equals(username).first(); }
async function getUserById(id) { return await db.users.get(id); }
async function getAllUsers() { return await db.users.toArray(); }

// === Banks ===
async function createBank(bank) { return await db.banks.add(bank); }
async function getAllBanks() {
  const banks = await db.banks.toArray();
  return banks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}
async function getBankById(id) { return await db.banks.get(id); }
async function updateBank(id, changes) { return await db.banks.update(id, changes); }
async function deleteBank(id) {
  await db.transaction('rw', db.banks, db.questions, db.examModes, db.wrongQuestions, db.history, async () => {
    await db.banks.delete(id);
    await db.questions.where('bankId').equals(id).delete();
    await db.examModes.where('bankId').equals(id).delete();
    await db.wrongQuestions.where('bankId').equals(id).delete();
  });
}
async function searchBanks(query) {
  const all = await getAllBanks();
  if (!query) return all;
  const q = query.toLowerCase();
  return all.filter(b => b.name.toLowerCase().includes(q));
}

// === Questions ===
async function addQuestions(questions) { return await db.questions.bulkAdd(questions); }
async function getQuestionsByBank(bankId, type) {
  let collection = db.questions.where('bankId').equals(bankId);
  if (type) collection = collection.and(q => q.type === type);
  return await collection.sortBy('number');
}
async function getQuestionById(id) { return await db.questions.get(id); }
async function updateQuestion(id, changes) { return await db.questions.update(id, changes); }
async function deleteQuestion(id) { return await db.questions.delete(id); }
async function deleteQuestionsByBank(bankId) { return await db.questions.where('bankId').equals(bankId).delete(); }
async function getQuestionCounts(bankId) {
  const questions = await db.questions.where('bankId').equals(bankId).toArray();
  const counts = { single: 0, multi: 0, tf: 0, fill: 0, essay: 0 };
  for (const q of questions) { if (counts[q.type] !== undefined) counts[q.type]++; }
  return counts;
}
async function getQuestionsByBankAndType(bankId, type, offset, limit) {
  let collection = db.questions.where('[bankId+type]').equals([bankId, type]);
  const total = await collection.count();
  const items = await collection.offset(offset).limit(limit).sortBy('number');
  return { items, total };
}
async function searchQuestions(bankId, query) {
  let collection = db.questions.where('bankId').equals(bankId);
  const all = await collection.sortBy('number');
  if (!query) return all;
  const q = query.toLowerCase();
  return all.filter(qq => qq.content.toLowerCase().includes(q));
}

// === Exam Modes ===
async function createExamMode(mode) { return await db.examModes.add(mode); }
async function getExamModesByBank(bankId) { return await db.examModes.where('bankId').equals(bankId).toArray(); }
async function getExamModeById(id) { return await db.examModes.get(id); }
async function deleteExamMode(id) { return await db.examModes.delete(id); }

// === Exam Sessions ===
async function saveSession(session) {
  const existing = await db.examSessions.where('userId').equals(session.userId).first();
  if (existing) { session.id = existing.id; return await db.examSessions.put(session); }
  return await db.examSessions.add(session);
}
async function getSessionByUser(userId) { return await db.examSessions.where('userId').equals(userId).first(); }
async function deleteSessionByUser(userId) { return await db.examSessions.where('userId').equals(userId).delete(); }

// === History ===
async function addHistory(record) { return await db.history.add(record); }
async function getHistoryByUser(userId, bankId, type) {
  let collection = db.history.where('userId').equals(userId);
  const all = await collection.reverse().sortBy('createdAt');
  let results = all;
  if (bankId) results = results.filter(h => h.bankId === parseInt(bankId));
  if (type && type !== 'all') results = results.filter(h => h.type === type);
  return results;
}

// === Wrong Questions ===
async function addWrongQuestion(wq) { return await db.wrongQuestions.add(wq); }
async function getWrongQuestionByUserAndQuestion(userId, questionId) {
  return await db.wrongQuestions.where({userId, questionId}).first();
}
async function updateWrongQuestion(id, changes) { return await db.wrongQuestions.update(id, changes); }
async function putWrongQuestion(wq) { return await db.wrongQuestions.put(wq); }
async function deleteWrongQuestion(id) { return await db.wrongQuestions.delete(id); }
async function getWrongQuestionsByUserAndBank(userId, bankId) {
  return await db.wrongQuestions.where('[userId+bankId]').equals([userId, bankId]).toArray();
}
async function getDistinctWrongBanks(userId) {
  const all = await db.wrongQuestions.where('userId').equals(userId).toArray();
  const bankIds = [...new Set(all.map(w => w.bankId))];
  const result = [];
  for (const bankId of bankIds) {
    const bank = await getBankById(bankId);
    if (bank) {
      const bankWQs = all.filter(w => w.bankId === bankId);
      result.push({
        bankId,
        bankName: bank.name,
        count: bankWQs.length,
        colorIndex: bankWQs[0].colorIndex ?? null
      });
    }
  }
  return result;
}

async function getUsedColorIndices(userId) {
  const all = await db.wrongQuestions.where('userId').equals(userId).toArray();
  return [...new Set(all.map(w => w.colorIndex).filter(c => c != null))];
}

async function allocColorIndex(userId) {
  const used = await getUsedColorIndices(userId);
  const available = [];
  for (let i = 0; i < 28; i++) {
    if (!used.includes(i)) available.push(i);
  }
  if (available.length === 0) available.push(used[0]);
  return available[Math.floor(Math.random() * available.length)];
}

// === Default Admin ===
async function seedDefaultAdmin() {
  const count = await db.users.count();
  if (count === 0) {
    const passwordHash = await hashPassword("admin123");
    await createUser({ username: "admin", passwordHash, role: "admin", createdAt: new Date().toISOString() });
    console.log("Default admin created: admin/admin123");
  }
}
