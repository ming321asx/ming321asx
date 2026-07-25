// ============================
// 游戏主逻辑 - 迷雾侦探
// ============================
const Game = {
  state: 'menu', // menu | briefing | investigation | interrogation | accusation | verdict
  currentCase: null,
  currentPhase: 'menu',
  foundEvidence: [],
  interrogatedSuspects: [],
  visitedLocations: [],
  score: 0,
  steps: 0,
  maxSteps: 30,
  accusedSuspectId: null,
  accusationResult: null,

  startNewGame(difficulty) {
    this.currentCase = CaseGenerator.generate(difficulty);
    this.foundEvidence = [];
    this.interrogatedSuspects = [];
    this.visitedLocations = [];
    this.score = 100;
    this.steps = 0;
    this.accusedSuspectId = null;
    this.accusationResult = null;
    this.currentPhase = 'briefing';
    UI.renderBriefing(this.currentCase);
  },

  visitLocation(locationId) {
    const loc = this.currentCase.locations.find(l => l.id === locationId);
    if (!loc || loc.investigated) return;
    loc.investigated = true;
    this.visitedLocations.push(locationId);
    this.steps++;
    loc.evidence.forEach(e => {
      if (!this.foundEvidence.find(f => f.id === e.id)) {
        this.foundEvidence.push(e);
        e.found = true;
      }
    });
    this.score = Math.max(0, this.score - 2);
    UI.renderInvestigation(this.currentCase, this.foundEvidence, this.visitedLocations);
    if (this.steps >= this.maxSteps) this._timeUp();
  },

  interrogateSuspect(suspectId) {
    const suspect = this.currentCase.suspects.find(s => s.id === suspectId);
    if (!suspect || this.interrogatedSuspects.includes(suspectId)) return;
    this.interrogatedSuspects.push(suspectId);
    this.steps++;
    this.score = Math.max(0, this.score - 3);
    UI.renderInterrogation(suspect);
  },

  makeAccusation(suspectId) {
    this.accusedSuspectId = suspectId;
    this.steps++;
    const correct = suspectId === this.currentCase.solution.culpritId;
    const suspect = this.currentCase.suspects.find(s => s.id === suspectId);
    if (correct) {
      const keyFound = this.foundEvidence.filter(e => e.isKey).length;
      const totalKey = this.currentCase.keyEvidenceIds.length;
      const evidenceBonus = Math.round((keyFound / totalKey) * 30);
      const stepBonus = Math.max(0, 20 - Math.floor(this.steps / 2));
      this.score += evidenceBonus + stepBonus;
      this.accusationResult = {
        correct: true,
        message: `恭喜！你的推理完全正确！凶手就是${suspect.name}！`,
        evidenceFound: keyFound,
        totalEvidence: totalKey,
        score: this.score,
        story: this.currentCase.solution.story
      };
    } else {
      this.score = Math.max(0, this.score - 30);
      const realKiller = this.currentCase.suspects.find(s => s.id === this.currentCase.solution.culpritId);
      this.accusationResult = {
        correct: false,
        message: `错了！${suspect.name}并不是凶手。真正的凶手是${realKiller.name}。`,
        score: this.score,
        story: this.currentCase.solution.story
      };
    }
    UI.renderVerdict(this.accusationResult, this.currentCase);
  },

  _timeUp() {
    this.score = Math.max(0, this.score - 50);
    this.currentPhase = 'verdict';
    UI.renderVerdict({
      correct: false,
      message: '调查步数用尽！案件被迫终止调查。',
      score: this.score,
      story: '由于调查步数不足，此案未能告破。'
    }, this.currentCase);
  },

  nextCase() {
    this.startNewGame(Math.min(3, this.currentCase.difficulty + 1));
  },

  getFoundEvidenceForSuspect(suspectId) {
    return this.foundEvidence.filter(e => e.relatedSuspectId === suspectId);
  },

  getEvidenceCount() {
    return { found: this.foundEvidence.length, total: this.currentCase.totalEvidence };
  },

  getAllEvidence() {
    return this.currentCase ? this.currentCase.locations.flatMap(l => l.evidence) : [];
  }
};
