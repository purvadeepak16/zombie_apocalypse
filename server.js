const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory storage
let survivors = {};
let survivorIdCounter = 1;
let leaderboard = [];

// ==========================================
// ENDPOINT 1: Create New Survivor
// ==========================================
// POST /api/survivors
// Body: { "name": "John" }
app.post('/api/survivors', (req, res) => {
  const id = survivorIdCounter++;
  const survivor = {
    id,
    name: req.body.name || 'Unknown',
    health: 100,
    hunger: 100,
    morale: 100,
    shelter: 0,
    allies: 0,
    day: 1,
    score: 0,
    status: 'alive',
    createdAt: new Date(),
    decisions: []
  };

  survivors[id] = survivor;

  console.log(`✅ Created survivor: ${survivor.name} (ID: ${id})`);

  res.status(201).json({
    message: 'Survivor created successfully',
    survivor: survivor
  });
});

// ==========================================
// ENDPOINT 2: Get Survivor Status
// ==========================================
// GET /api/survivors/:id
app.get('/api/survivors/:id', (req, res) => {
  const survivor = survivors[req.params.id];

  if (!survivor) {
    return res.status(404).json({
      message: 'Survivor not found',
      error: true
    });
  }

  console.log(`✅ Retrieved survivor: ${survivor.name}`);

  res.json(survivor);
});

// ==========================================
// ENDPOINT 3: Make a Decision
// ==========================================
// POST /api/survivors/:id/decisions
// Body: { "decision": "shelter" | "food" | "allies" | "rest" }
app.post('/api/survivors/:id/decisions', (req, res) => {
  const survivor = survivors[req.params.id];

  if (!survivor) {
    return res.status(404).json({
      message: 'Survivor not found',
      error: true
    });
  }

  if (survivor.status !== 'alive') {
    return res.status(400).json({
      message: 'Survivor is already dead or escaped',
      error: true
    });
  }

  const decision = req.body.decision;
  let message = '';
  let scoreGain = 0;
  const decisionLog = { day: survivor.day, decision, result: '' };

  // DECISION LOGIC
  switch (decision) {
    // -------- SHELTER --------
    case 'shelter':
      if (survivor.hunger < 30) {
        message = '❌ Too hungry to work! You collapse while building.';
        survivor.health -= 20;
        survivor.hunger -= 10;
        scoreGain = -10;
      } else {
        message = '✅ Built a sturdy shelter! Feels safer now. (+30 Shelter)';
        survivor.shelter = Math.min(100, survivor.shelter + 30);
        survivor.hunger -= 15;
        scoreGain = 20;
      }
      break;

    // -------- FOOD --------
    case 'food':
      const foodChance = Math.random();
      if (foodChance > 0.6) {
        message = '✅ Found a stash of canned goods! Feast time!';
        survivor.hunger = 100;
        scoreGain = 30;
      } else if (foodChance > 0.2) {
        message = '⚠️ Found some moldy berries. Better than nothing.';
        survivor.hunger = Math.min(100, survivor.hunger + 40);
        scoreGain = 10;
      } else {
        message = '❌ Zombies surrounded the food cache! Barely escaped.';
        survivor.health -= 25;
        survivor.hunger -= 10;
        scoreGain = -15;
      }
      break;

    // -------- ALLIES --------
    case 'allies':
      const allyChance = Math.random();
      if (allyChance > 0.5) {
        message = '✅ Found friendly survivors! Morale boosted!';
        survivor.allies += 1;
        survivor.morale = 100;
        scoreGain = 25;
      } else {
        message = '❌ The group you found was hostile. Got into a scuffle.';
        survivor.health -= 15;
        survivor.morale -= 20;
        scoreGain = -10;
      }
      break;

    // -------- REST --------
    case 'rest':
      message = '😴 Took a day to rest and recover.';
      survivor.health = Math.min(100, survivor.health + 25);
      survivor.morale = Math.min(100, survivor.morale + 20);
      survivor.hunger -= 20;
      scoreGain = 5;
      break;

    default:
      return res.status(400).json({
        message: 'Invalid decision. Use: shelter, food, allies, or rest',
        error: true
      });
  }

  // RANDOM ZOMBIE EVENT (30% chance)
  let zombieEvent = false;
  if (Math.random() > 0.7) {
    message += ' 🧟 A zombie horde attacked! You defended yourself.';
    survivor.health -= 10;
    scoreGain -= 10;
    zombieEvent = true;
  }

  // NATURAL DECAY (every day)
  survivor.hunger = Math.max(0, survivor.hunger - 15);
  survivor.morale = Math.max(0, survivor.morale - 10);
  survivor.health = Math.max(0, survivor.health - 5);

  // ADVANCE DAY
  survivor.day += 1;
  survivor.score += scoreGain;

  // CHECK STATUS
  if (survivor.health <= 0) {
    survivor.status = 'dead';
  } else if (survivor.day >= 14 && survivor.health > 30) {
    survivor.status = 'escaped';
  }

  decisionLog.result = message;
  survivor.decisions.push(decisionLog);

  console.log(`📍 Day ${survivor.day} - ${survivor.name} decided: ${decision}`);
  console.log(`   ${message}`);
  console.log(`   Stats - Health: ${survivor.health}, Hunger: ${survivor.hunger}, Morale: ${survivor.morale}, Score: ${survivor.score}`);

  res.json({
    message: message,
    scoreGain: scoreGain,
    zombieEvent: zombieEvent,
    survivor: survivor
  });
});

// ==========================================
// ENDPOINT 4: Get Leaderboard
// ==========================================
// GET /api/leaderboard
app.get('/api/leaderboard', (req, res) => {
  const sortedLeaderboard = leaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  console.log(`✅ Retrieved leaderboard with ${sortedLeaderboard.length} entries`);

  res.json({
    leaderboard: sortedLeaderboard,
    total: leaderboard.length
  });
});

// ==========================================
// ENDPOINT 5: Add to Leaderboard
// ==========================================
// POST /api/leaderboard
// Body: { "name": "John", "score": 250, "days": 14, "survived": true }
app.post('/api/leaderboard', (req, res) => {
  const entry = {
    id: Date.now(),
    name: req.body.name,
    score: req.body.score,
    days: req.body.days,
    survived: req.body.survived,
    timestamp: new Date()
  };

  leaderboard.push(entry);

  console.log(`🏆 Added to leaderboard: ${entry.name} - Score: ${entry.score}`);

  res.status(201).json({
    message: 'Added to leaderboard',
    entry: entry
  });
});

// ==========================================
// ENDPOINT 6: Get All Survivors (Bonus)
// ==========================================
// GET /api/survivors
app.get('/api/survivors', (req, res) => {
  const allSurvivors = Object.values(survivors);
  console.log(`✅ Retrieved ${allSurvivors.length} survivors`);
  res.json({
    total: allSurvivors.length,
    survivors: allSurvivors
  });
});

// ==========================================
// ENDPOINT 7: Delete Survivor (Bonus)
// ==========================================
// DELETE /api/survivors/:id
app.delete('/api/survivors/:id', (req, res) => {
  const survivor = survivors[req.params.id];

  if (!survivor) {
    return res.status(404).json({
      message: 'Survivor not found',
      error: true
    });
  }

  delete survivors[req.params.id];
  console.log(`🗑️ Deleted survivor: ${survivor.name}`);

  res.json({
    message: `Survivor ${survivor.name} deleted`,
    survivor: survivor
  });
})
// Start Server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`

📡 API Base URL: http://localhost:${PORT}/api

Endpoints:
  POST   /api/survivors              - Create survivor
  GET    /api/survivors              - Get all survivors
  GET    /api/survivors/:id          - Get survivor by ID
  POST   /api/survivors/:id/decisions - Make decision
  DELETE /api/survivors/:id          - Delete survivor
  GET    /api/leaderboard            - Get top survivors
  POST   /api/leaderboard            - Add to leaderboard
  `);
});