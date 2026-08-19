// === Exam Machine Database Layer (Dexie.js) ===

const db = new Dexie("ExamMachineDB");

db.version(2).stores({
  users:          "++id, &username",
  banks:          "++id, name",
  questions:      "++id, bankId, [bankId+type], type",
  examModes:      "++id, bankId",
  examSessions:   "++id, userId",
  history:        "++id, userId, bankId, createdAt",
  wrongQuestions: "++id, [userId+bankId], userId, bankId, questionId",
  userSkins:      "++id, userId, colorIndex"
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
  const used = await getUsedColorIndices(userId);        // 该用户已用作错题本封面的颜色
  const owned = await getUserOwnedSkins(userId);          // 该用户拥有的全部皮肤
  const available = owned.filter(c => !used.includes(c)); // 取交集：拥有且未被占用
  if (available.length === 0) {
    // 全部拥有皮肤都已被占用，从已占用中随机选一个（退化情况）
    return used[Math.floor(Math.random() * used.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

// === Default Admin ===
async function seedDefaultAdmin() {
  const count = await db.users.count();
  if (count === 0) {
    const passwordHash = await hashPassword("admin123");
    await createUser({ username: "admin", passwordHash, role: "admin", createdAt: new Date().toISOString(), coins: 0 });
    console.log("Default admin created: admin/admin123");
  }
}

// === User Coins ===
async function getUserCoins(userId) {
  const user = await db.users.get(userId);
  return user?.coins ?? 0;
}
async function updateUserCoins(userId, delta) {
  return await db.transaction('rw', db.users, async () => {
    const user = await db.users.get(userId);
    if (!user) return null;
    const newCoins = Math.max(0, (user.coins ?? 0) + delta);
    await db.users.update(userId, { coins: newCoins });
    return newCoins;
  });
}

// === User Skins ===
async function addUserSkin(userId, colorIndex) {
  const existing = await db.userSkins.where({ userId, colorIndex }).first();
  if (existing) return existing.id;
  return await db.userSkins.add({ userId, colorIndex });
}
async function getUserOwnedSkins(userId) {
  const skins = await db.userSkins.where('userId').equals(userId).toArray();
  return skins.map(s => s.colorIndex);
}
async function hasUserSkin(userId, colorIndex) {
  const existing = await db.userSkins.where({ userId, colorIndex }).first();
  return !!existing;
}

// === Persistent Storage Request ===
async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      const granted = await navigator.storage.persist();
      console.log('持久化存储:', granted ? '已授权' : '未授权');
    }
  }
}

// === Export / Import All Data ===
async function exportAllData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    users: await db.users.toArray(),
    banks: await db.banks.toArray(),
    questions: await db.questions.toArray(),
    examModes: await db.examModes.toArray(),
    examSessions: await db.examSessions.toArray(),
    history: await db.history.toArray(),
    wrongQuestions: await db.wrongQuestions.toArray(),
    userSkins: await db.userSkins.toArray(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `考试机备份_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('数据已导出', 'success');
}

async function importAllData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version || !data.users) {
          showToast('文件格式无效', 'error');
          reject(new Error('Invalid format'));
          return;
        }
        await db.transaction('rw',
          [db.users, db.banks, db.questions, db.examModes, db.examSessions, db.history, db.wrongQuestions, db.userSkins],
          async () => {
            await db.users.clear();
            await db.banks.clear();
            await db.questions.clear();
            await db.examModes.clear();
            await db.examSessions.clear();
            await db.history.clear();
            await db.wrongQuestions.clear();
            await db.userSkins.clear();
            if (data.users.length) await db.users.bulkAdd(data.users);
            if (data.banks.length) await db.banks.bulkAdd(data.banks);
            if (data.questions.length) await db.questions.bulkAdd(data.questions);
            if (data.examModes.length) await db.examModes.bulkAdd(data.examModes);
            if (data.examSessions.length) await db.examSessions.bulkAdd(data.examSessions);
            if (data.history.length) await db.history.bulkAdd(data.history);
            if (data.wrongQuestions.length) await db.wrongQuestions.bulkAdd(data.wrongQuestions);
            if (data.userSkins.length) await db.userSkins.bulkAdd(data.userSkins);
          }
        );
        showToast('数据已导入，请刷新页面', 'success');
        resolve();
      } catch (err) {
        showToast('导入失败：' + err.message, 'error');
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}

// === Initialize default owned skins for a new user (Group 0: 高端经典，共5个) ===
async function initUserDefaultSkins(userId) {
  const defaultSkins = [0, 1, 2, 3, 4]; // 高端经典5款皮肤 indices 0-4
  await db.transaction('rw', db.userSkins, async () => {
    for (const idx of defaultSkins) {
      await addUserSkin(userId, idx);
    }
  });
}

// === Bank skin assignment ===
async function getBankSkin(userId, bankId) {
  const wQs = await getWrongQuestionsByUserAndBank(userId, bankId);
  if (!wQs || wQs.length === 0) return null;
  return wQs[0].colorIndex ?? null;
}
async function setBankSkin(userId, bankId, colorIndex) {
  // Update all wrong questions for this bank to use the new skin color
  const wQs = await getWrongQuestionsByUserAndBank(userId, bankId);
  await db.transaction('rw', db.wrongQuestions, async () => {
    for (const wq of wQs) {
      await db.wrongQuestions.update(wq.id, { colorIndex });
    }
  });
}

// === Skin constants (shared across pages) ===
// 从 t4-wrongbook.js 暴露的 name 数组读取（保持单一数据源）
window.SKIN_GROUP_NAMES = ['高端经典', '质感节日风', '温柔活泼', '甜美清新'];
window.SKIN_PRICES = [0, 15, 20, 25];

window.SKIN_DISPLAY_NAMES = [
  ...(window._SKIN_CLASSIC_NAMES || []),
  ...(window._SKIN_FESTIVE_NAMES || []),
  ...(window._SKIN_GENTLE_NAMES  || []),
  ...(window._SKIN_SWEET_NAMES  || []),
];

window.getSkinGroup = function(colorIndex) {
  const counts = [
    (window._SKIN_CLASSIC_NAMES || []).length,
    (window._SKIN_FESTIVE_NAMES || []).length,
    (window._SKIN_GENTLE_NAMES  || []).length,
    (window._SKIN_SWEET_NAMES  || []).length,
  ];
  let offset = 0;
  for (let g = 0; g < counts.length; g++) {
    if (colorIndex < offset + counts[g]) return g;
    offset += counts[g];
  }
  return 3;
};
window.getSkinPrice = function(colorIndex) {
  return window.SKIN_PRICES[window.getSkinGroup(colorIndex)];
};
