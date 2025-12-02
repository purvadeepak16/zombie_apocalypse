import React, { useState, useEffect } from 'react';
import './App.css';

export default function ZombieGame() {
  const [gameState, setGameState] = useState('menu');
  const [survivor, setSurvivor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiLog, setApiLog] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const API_BASE = 'http://localhost:3001/api';

  const callAPI = async (method, endpoint, body = null) => {
    const fullURL = `${API_BASE}${endpoint}`;
    const logEntry = `${method} ${endpoint}`;
    
    setApiLog(prev => [...prev, { 
      type: 'request', 
      message: logEntry, 
      time: new Date().toLocaleTimeString() 
    }]);
    
    try {
      setLoading(true);
      
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(fullURL, options);
      const data = await response.json();

      const responseMsg = data.message || data.survivor?.name || 'Success';
      setApiLog(prev => [...prev, { 
        type: 'response', 
        message: `✓ ${responseMsg}`, 
        time: new Date().toLocaleTimeString() 
      }]);

      return data;
    } catch (error) {
      const errorMsg = `✗ Error: ${error.message}`;
      setApiLog(prev => [...prev, { 
        type: 'error', 
        message: errorMsg, 
        time: new Date().toLocaleTimeString() 
      }]);
      console.error('API Error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startGame = async (name) => {
    const result = await callAPI('POST', '/survivors', { name: name || 'Survivor' });
    if (result?.survivor) {
      setSurvivor(result.survivor);
      setGameState('playing');
    }
  };

  const makeDecision = async (decision) => {
    const result = await callAPI('POST', `/survivors/${survivor.id}/decisions`, { decision });
    if (result?.survivor) {
      setSurvivor(result.survivor);
      
      if (result.survivor.status === 'dead') {
        handleGameOver(false);
      } else if (result.survivor.status === 'escaped') {
        handleGameOver(true);
      }
    }
  };

  const fetchLeaderboard = async () => {
    const result = await callAPI('GET', '/leaderboard');
    if (result?.leaderboard) {
      setLeaderboard(result.leaderboard);
    }
  };

  const handleGameOver = async (survived) => {
    const entry = {
      name: survivor.name,
      score: survivor.score,
      days: survivor.day,
      survived
    };
    await callAPI('POST', '/leaderboard', entry);
    setGameState('gameover');
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (gameState === 'menu') {
    return (
      <div className="container menu">
        <div className="content">
          <h1>🧟 ZOMBIE APOCALYPSE </h1>
          <p className="subtitle">REST API Survival Game</p>
          
          <div className="game-box">
            <input
              type="text"
              placeholder="Enter your name..."
              id="name-input"
              className="input"
            />
            <button
              onClick={() => {
                const name = document.getElementById('name-input').value;
                startGame(name);
              }}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Starting...' : 'Start Game'}
            </button>
          </div>

          {leaderboard.length > 0 && (
            <div className="leaderboard">
              <h3>🏆 Leaderboard</h3>
              {leaderboard.map((entry, i) => (
                <div key={i} className="leaderboard-entry">
                  <span>{i + 1}. {entry.name}</span>
                  <span>{entry.score} pts ({entry.days}d)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="container gameover">
        <div className="content">
          <h1>{survivor.status === 'escaped' ? '✨ ESCAPED!' : '💀 DEAD'}</h1>
          
          <div className="game-box">
            <p>Score: <strong>{survivor.score}</strong></p>
            <p>Days Survived: <strong>{survivor.day}</strong></p>
          </div>

          <button
            onClick={() => {
              setGameState('menu');
              setApiLog([]);
              fetchLeaderboard();
            }}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Loading...' : 'Play Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container playing">
      <div className="game-content">
        <div className="game-area">
          <h1>Day {survivor.day}</h1>
          <p className="survivor-name">Survivor: {survivor.name}</p>

          <div className="stats-grid">
            <div className="stat">
              <div className="stat-icon">❤️</div>
              <div className="stat-label">Health</div>
              <div className="stat-value">{Math.max(0, survivor.health)}</div>
            </div>
            <div className="stat">
              <div className="stat-icon">🍖</div>
              <div className="stat-label">Hunger</div>
              <div className="stat-value">{Math.max(0, survivor.hunger)}</div>
            </div>
            <div className="stat">
              <div className="stat-icon">😊</div>
              <div className="stat-label">Morale</div>
              <div className="stat-value">{Math.max(0, survivor.morale)}</div>
            </div>
            <div className="stat">
              <div className="stat-icon">🏠</div>
              <div className="stat-label">Shelter</div>
              <div className="stat-value">{Math.max(0, survivor.shelter)}</div>
            </div>
            <div className="stat">
              <div className="stat-icon">👥</div>
              <div className="stat-label">Allies</div>
              <div className="stat-value">{survivor.allies * 20}</div>
            </div>
          </div>

          <div className="decisions-grid">
            <DecisionButton
              onClick={() => makeDecision('shelter')}
              icon="🏠"
              title="Build Shelter"
              desc="Costs hunger, +30 safety"
              disabled={loading}
            />
            <DecisionButton
              onClick={() => makeDecision('food')}
              icon="🍖"
              title="Hunt Food"
              desc="Risky, restores hunger"
              disabled={loading}
            />
            <DecisionButton
              onClick={() => makeDecision('allies')}
              icon="👥"
              title="Find Allies"
              desc="Meet survivors, +morale"
              disabled={loading}
            />
            <DecisionButton
              onClick={() => makeDecision('rest')}
              icon="😴"
              title="Rest"
              desc="Heal, safe choice"
              disabled={loading}
            />
          </div>
        </div>

        <div className="api-log">
          <h3>📡 API Calls</h3>
          <div className="api-log-content">
            {apiLog.map((log, i) => (
              <div key={i} className={`api-log-entry ${log.type}`}>
                <span className="time">[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionButton({ onClick, icon, title, desc, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="decision-btn"
    >
      <div className="btn-icon">{icon}</div>
      <div className="btn-title">{title}</div>
      <div className="btn-desc">{desc}</div>
    </button>
  );
}