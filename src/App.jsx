import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Inicializar estado desde localStorage (Base de datos local)
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('ambicioso_players');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [previewShown, setPreviewShown] = useState(() => {
    return localStorage.getItem('ambicioso_preview') === 'true';
  });

  const [finalShown, setFinalShown] = useState(() => {
    return localStorage.getItem('ambicioso_final') === 'true';
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('ambicioso_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [newPlayerName, setNewPlayerName] = useState('');
  
  // Scoring modal state
  const [activeCell, setActiveCell] = useState(null);
  const [tempScore, setTempScore] = useState(0);
  
  // Modals state
  const [showSummary, setShowSummary] = useState(false);
  const [summaryType, setSummaryType] = useState('preview'); // 'preview' o 'final'
  const [showHistory, setShowHistory] = useState(false);

  // Sincronizar con localStorage en cada cambio
  useEffect(() => {
    localStorage.setItem('ambicioso_players', JSON.stringify(players));
    localStorage.setItem('ambicioso_preview', previewShown);
    localStorage.setItem('ambicioso_final', finalShown);
    localStorage.setItem('ambicioso_history', JSON.stringify(history));
  }, [players, previewShown, finalShown, history]);

  // Verificar estado del juego para mostrar previas o finales
  useEffect(() => {
    if (players.length === 0) return;

    // ¿Ya terminaron los 5 turnos?
    const allCompleted5 = players.every(p => p.scores.every(s => s !== null));
    if (allCompleted5) {
      if (!finalShown) {
        setSummaryType('final');
        setShowSummary(true);
        setFinalShown(true);
      }
      return;
    }

    // ¿Terminaron 4 turnos y aún no hemos mostrado la previa?
    const allCompleted4 = players.every(p => p.scores.slice(0, 4).every(s => s !== null));
    if (allCompleted4 && !previewShown) {
      setSummaryType('preview');
      setShowSummary(true);
      setPreviewShown(true);
    }
  }, [players, previewShown, finalShown]);

  const addPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    setPlayers([...players, {
      id: crypto.randomUUID(),
      name: newPlayerName.trim(),
      scores: [null, null, null, null, null] // 5 turnos
    }]);
    setNewPlayerName('');
  };

  const openScoreModal = (player, turnIndex, existingScore) => {
    setActiveCell({ playerId: player.id, turnIndex, name: player.name });
    setTempScore(existingScore !== null ? existingScore : 0);
  };

  const saveScore = () => {
    if (!activeCell) return;
    
    setPlayers(players.map(p => {
      if (p.id === activeCell.playerId) {
        const newScores = [...p.scores];
        newScores[activeCell.turnIndex] = tempScore;
        return { ...p, scores: newScores };
      }
      return p;
    }));
    
    // Si están corrigiendo un dato después de haber visto el final, quitamos la bandera para que puedan ver el resumen actualizado
    const allCompleted5 = players.every(p => p.scores.every(s => s !== null));
    if (allCompleted5) {
      setFinalShown(false); 
    }

    setActiveCell(null);
  };

  const getPlayerTotal = (player) => {
    return player.scores.reduce((sum, s) => sum + (s || 0), 0);
  };

  const resetGame = () => {
    if (confirm('¿Reiniciar partida? Se perderá el progreso actual no guardado.')) {
      setPlayers([]);
      setPreviewShown(false);
      setFinalShown(false);
      setShowSummary(false);
    }
  };

  const saveToHistory = () => {
    const record = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString(),
      players: [...players] // Guardamos en el orden original
    };
    setHistory([record, ...history]);
  };

  const playAgain = () => {
    saveToHistory();
    // Reiniciar los puntajes de todos pero conservar los nombres en su orden
    setPlayers(players.map(p => ({ ...p, scores: [null, null, null, null, null] })));
    setPreviewShown(false);
    setFinalShown(false);
    setShowSummary(false);
  };

  const goHome = () => {
    saveToHistory();
    // Volver al inicio limpiando todo
    setPlayers([]);
    setPreviewShown(false);
    setFinalShown(false);
    setShowSummary(false);
    setShowHistory(true);
  };

  // Determinar primer y segundo lugar 👑
  const allTotals = players.map(getPlayerTotal);
  const uniqueSortedTotals = [...new Set(allTotals)].sort((a, b) => b - a);
  const maxScore = uniqueSortedTotals[0] || 0;
  const secondMaxScore = uniqueSortedTotals[1] || 0;
  const allCompleted5 = players.length > 0 && players.every(p => p.scores.every(s => s !== null));

  return (
    <div className="app-container">
      <header className="header animate-fade-in">
        <h1>AMBICIOSO</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => setShowHistory(true)}>
            Historial
          </button>
          {players.length > 0 && (
            <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={resetGame}>
              Reiniciar
            </button>
          )}
        </div>
      </header>

      <form onSubmit={addPlayer} className="add-player-row animate-slide-up">
        <input 
          type="text" 
          className="input-player" 
          placeholder="Nombre del jugador..." 
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Agregar
        </button>
      </form>

      <div className="players-list">
        {players.map((player) => {
          const total = getPlayerTotal(player);
          const is1st = total === maxScore && maxScore > 0;
          const is2nd = total === secondMaxScore && secondMaxScore > 0;
          return (
            <div key={player.id} className="player-card animate-slide-up">
              <div className="player-header">
                <span className="player-name">
                  {player.name} 
                  {is1st && <span title="1er Lugar" style={{marginLeft: '4px'}}>👑</span>}
                  {is2nd && <span title="2do Lugar" className="silver-crown" style={{marginLeft: '4px'}}>👑</span>}
                </span>
                <span className="player-total" style={{ color: is1st ? 'var(--primary-color)' : (is2nd ? '#a1a1aa' : 'inherit') }}>
                  {total} pts
                </span>
              </div>
              <div className="scores-grid">
                {player.scores.map((score, idx) => (
                  <button 
                    key={idx}
                    className={`score-cell ${score === null ? 'empty' : ''}`}
                    onClick={() => openScoreModal(player, idx, score)}
                  >
                    {score === null ? `T${idx + 1}` : score}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        {players.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
            Agrega jugadores para comenzar
          </div>
        )}
      </div>

      {allCompleted5 && !showSummary && (
        <button 
          className="btn-primary animate-fade-in" 
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.125rem', marginTop: '1rem' }}
          onClick={() => {
            setSummaryType('final');
            setShowSummary(true);
          }}
        >
          Ver Resultados Finales
        </button>
      )}

      {/* Bottom Sheet Modal para ingresar puntaje */}
      {activeCell && (
        <div className="modal-overlay modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) setActiveCell(null);
        }}>
          <div className="bottom-sheet modal-content">
            <div className="sheet-header">
              <span className="sheet-title">{activeCell.name.toUpperCase()} - TURNO {activeCell.turnIndex + 1}</span>
            </div>
            
            {activeCell.turnIndex === 4 && players.length > 1 && (
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', color: '#a1a1aa', textAlign: 'center', marginBottom: '1.5rem' }}>
                {(() => {
                  const currentPlayer = players.find(p => p.id === activeCell.playerId);
                  // Usar los puntajes de los turnos 1 al 4 para ver cuánto le falta
                  const baseTotal = currentPlayer.scores.slice(0, 4).reduce((sum, s) => sum + (s || 0), 0);
                  const otherTotals = players.filter(p => p.id !== activeCell.playerId).map(getPlayerTotal);
                  const uniqueOtherTotals = [...new Set(otherTotals)].sort((a,b) => b - a);
                  const top1 = uniqueOtherTotals[0] || 0;
                  const top2 = uniqueOtherTotals[1] || 0;
                  
                  const diff1 = top1 - baseTotal;
                  const diff2 = top2 - baseTotal;
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {diff1 > 0 ? (
                        <>
                          <div>Para 1er lugar necesitas: <strong style={{color: 'var(--primary-color)'}}>{diff1} pts</strong> 👑</div>
                          {players.length > 2 && diff2 > 0 && (
                            <div>Para 2do lugar necesitas: <strong style={{color: 'white'}}>{diff2} pts</strong> <span className="silver-crown">👑</span></div>
                          )}
                          {players.length > 2 && diff2 <= 0 && (
                            <div>¡Actualmente aseguras el <strong style={{color: 'white'}}>2do lugar</strong>! <span className="silver-crown">👑</span></div>
                          )}
                        </>
                      ) : (
                        <div>¡Actualmente aseguras el <strong style={{color: 'var(--primary-color)'}}>1er lugar</strong>! 👑</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="temp-score-display">
              {tempScore}
            </div>

            <div className="increment-buttons">
              <button 
                className="increment-btn" 
                onClick={() => setTempScore(prev => prev + 50)}
              >
                +50
              </button>
              <button 
                className="increment-btn" 
                onClick={() => setTempScore(prev => prev + 100)}
              >
                +100
              </button>
            </div>

            <div className="action-buttons">
              <button className="action-btn" onClick={() => setActiveCell(null)}>
                Atrás
              </button>
              <button className="action-btn danger" onClick={() => setTempScore(0)}>
                Reiniciar
              </button>
              <button className="action-btn save" onClick={saveScore}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary / Game Over Modal */}
      {showSummary && (
        <div className="modal-overlay modal-backdrop">
          <div className="center-modal modal-content">
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: 900, color: 'var(--primary-color)' }}>
              {summaryType === 'preview' ? 'PREVIA DE PUNTAJES' : 'RESULTADOS FINALES'}
            </h2>
            <div style={{ marginBottom: '2rem' }}>
              {players.map((p, idx) => {
                const total = getPlayerTotal(p);
                const is1st = total === maxScore && maxScore > 0;
                const is2nd = total === secondMaxScore && secondMaxScore > 0;
                return (
                  <div key={p.id} className="summary-item">
                    <span style={{ fontWeight: is1st ? 900 : 700, color: is1st ? 'var(--primary-color)' : (is2nd ? '#d4d4d8' : 'white') }}>
                      {idx + 1}. {p.name} 
                      {is1st && <span style={{marginLeft: '4px'}}>👑</span>}
                      {is2nd && <span className="silver-crown" style={{marginLeft: '4px'}}>👑</span>}
                    </span>
                    <span style={{ fontWeight: 900, color: is1st ? 'var(--primary-color)' : (is2nd ? '#d4d4d8' : 'white') }}>
                      {total}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {summaryType === 'preview' ? (
              <button className="btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={() => setShowSummary(false)}>
                Jugar Último Turno
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button className="btn-primary" style={{ padding: '1rem', fontSize: '1rem' }} onClick={playAgain}>
                  Guardar y volver a jugar
                </button>
                <button className="btn-secondary" style={{ padding: '1rem', fontSize: '1rem' }} onClick={goHome}>
                  Guardar y volver al inicio
                </button>
                <button className="action-btn" style={{ padding: '1rem', fontSize: '1rem' }} onClick={() => setShowSummary(false)}>
                  Atrás (Corregir puntajes)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) setShowHistory(false);
        }}>
          <div className="center-modal modal-content" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 900, margin: 0 }}>HISTORIAL</h2>
              <button onClick={() => setShowHistory(false)} style={{ color: 'white', fontSize: '1.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            {history.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No hay partidas guardadas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {history.map((game, index) => {
                  const gpTotals = game.players.map(gp => gp.scores.reduce((sum, s) => sum + (s || 0), 0));
                  const gpUnique = [...new Set(gpTotals)].sort((a,b) => b - a);
                  const maxHistoryScore = gpUnique[0] || 0;
                  const secondHistoryScore = gpUnique[1] || 0;
                  
                  return (
                    <div key={game.id} style={{ backgroundColor: 'var(--surface-color-light)', padding: '1rem', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        Partida #{history.length - index} • {game.date}
                      </div>
                      {game.players.map((p, idx) => {
                        const pTotal = p.scores.reduce((sum, s) => sum + (s || 0), 0);
                        const is1st = pTotal === maxHistoryScore && maxHistoryScore > 0;
                        const is2nd = pTotal === secondHistoryScore && secondHistoryScore > 0;
                        return (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: is1st ? 900 : (is2nd ? 700 : 400), color: is1st ? 'var(--primary-color)' : (is2nd ? '#d4d4d8' : 'white') }}>
                              {idx + 1}. {p.name} 
                              {is1st && <span style={{marginLeft: '4px'}}>👑</span>}
                              {is2nd && <span className="silver-crown" style={{marginLeft: '4px'}}>👑</span>}
                            </span>
                            <span style={{ fontWeight: 700, color: is1st ? 'var(--primary-color)' : (is2nd ? '#d4d4d8' : 'inherit') }}>{pTotal} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            
            {history.length > 0 && (
              <button 
                className="action-btn danger" 
                style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }} 
                onClick={() => {
                  if(confirm('¿Borrar todo el historial?')) setHistory([]);
                }}
              >
                Borrar Historial
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
