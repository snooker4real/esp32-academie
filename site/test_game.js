// Vérifie la logique pure du jeu (verdict de quiz, mélange des réponses, jour des quêtes) : node test_game.js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const ctx = { console, state: { extra: {} } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(`${__dirname}/game.js`, "utf8") + ";this.api={quizVerdict,quizItems,today,questState};", ctx);
const { quizVerdict, quizItems, today, questState } = ctx.api;

const base = { goal: 0, endless: false, recordBefore: 0, bossName: "Boss" };
let v = quizVerdict({ ...base, score: 4, total: 4 });
assert.deepEqual([v.title, v.stars, v.good, v.lose], ["Sans faute !", 3, true, false]);
v = quizVerdict({ ...base, score: 1, total: 4 });
assert.deepEqual([v.title, v.stars, v.good], ["Encore un effort", 0, false]);

v = quizVerdict({ ...base, goal: 7, score: 7, total: 9 });
assert.deepEqual([v.won, v.title, v.line, v.stars], [true, "Boss vaincu !", "Boss est à terre.", null]);
v = quizVerdict({ ...base, goal: 7, score: 2, total: 5 });
assert.deepEqual([v.won, v.lose, v.good], [false, true, false]);

v = quizVerdict({ ...base, endless: true, score: 12, total: 13, recordBefore: 10 });
assert.deepEqual([v.title, v.good, v.lose], ["Nouveau record !", true, false]);
v = quizVerdict({ ...base, endless: true, score: 2, total: 3, recordBefore: 10 });
assert.deepEqual([v.title, v.good, v.lose], ["Partie terminée", false, true]);

// le mélange garde la bonne réponse sur le bon texte
for (let i = 0; i < 50; i++) {
  const [q] = quizItems([{ q: "?", choices: ["a", "b", "c", "d"], answer: 2 }]);
  assert.equal(q.choices[q.answer], "c");
}

// le jour vient du serveur
ctx.state.extra.today = "2030-01-02";
assert.equal(today(), "2030-01-02");
const qs = questState({ need: 4 }, 9);
assert.deepEqual([qs.have, qs.done], [4, true]);
console.log("ok test_game.js");
