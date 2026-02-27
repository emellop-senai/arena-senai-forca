import { useState, useEffect, useRef } from 'react';
import './index.css';

const API_URL = process.env.API_URL

function App() {
  // ==========================================
  // ESTADOS GERAIS E NAVEGAÇÃO
  // ==========================================
  const [activeTab, setActiveTab] = useState('game');
  const [leaderboard, setLeaderboard] = useState([]);
  
  // ==========================================
  // ESTADOS DO USUÁRIO
  // ==========================================
  const [user, setUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [loginMessage, setLoginMessage] = useState({ text: '', type: '', show: false });

  // ==========================================
  // ESTADOS DO JOGO
  // ==========================================
  const [wordId, setWordId] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [normalizedWord, setNormalizedWord] = useState('');
  const [hint, setHint] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [usedLetters, setUsedLetters] = useState([]);
  const [attemptsLeft, setAttemptsLeft] = useState(6);
  const [letterInput, setLetterInput] = useState('');
  const [gameMessage, setGameMessage] = useState({ text: '', type: '', show: false });
  const [isGameOver, setIsGameOver] = useState(false);

  // Referência para focar no input automaticamente
  const inputRef = useRef(null);
  const messageTimeoutRef = useRef(null);
  const loginTimeoutRef = useRef(null);

  // ==========================================
  // EFEITOS (Equivalente ao inicializar a página)
  // ==========================================
  useEffect(() => {
    updateLeaderboardUI();
  }, []);

  const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const showMsg = (text, type, isLogin = false) => {
    if (isLogin) {
      setLoginMessage({ text, type, show: true });
      clearTimeout(loginTimeoutRef.current);
      loginTimeoutRef.current = setTimeout(() => setLoginMessage(prev => ({ ...prev, show: false })), 3000);
    } else {
      setGameMessage({ text, type, show: true });
      clearTimeout(messageTimeoutRef.current);
      
      // Não esconde a mensagem se for fim de jogo ou vitória completa
      if (type === 'success' && !guessedLetters.includes('_')) return;
      if (attemptsLeft === 0) return;

      messageTimeoutRef.current = setTimeout(() => setGameMessage(prev => ({ ...prev, show: false })), 2000);
    }
  };

  // ==========================================
  // FUNÇÕES DE USUÁRIO E RANKING
  // ==========================================
  const updateLeaderboardUI = async () => {
    try {
      const response = await fetch(`${API_URL}/ranking`);
      if (!response.ok) throw new Error('Erro ao buscar ranking');
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error(error);
      setLeaderboard(null); // Usado para mostrar erro na tela
    }
  };

  const loginUser = async () => {
    const username = usernameInput.trim();
    if (!username || username.length < 3) {
      showMsg('O usuário deve ter pelo menos 3 caracteres!', 'error', true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!response.ok) throw new Error('Erro na comunicação');
      const userData = await response.json();

      setUser(userData);
      setUsernameInput('');
      updateLeaderboardUI();
      startNewGame();
    } catch (error) {
      console.error(error);
      showMsg('Erro de conexão com o servidor!', 'error', true);
    }
  };

  const logoutUser = () => {
    setUser(null);
    updateLeaderboardUI();
  };

  // ==========================================
  // LÓGICA DO JOGO
  // ==========================================
  const startNewGame = async () => {
    setHint("Buscando palavra no servidor...");
    setIsGameOver(true); // Bloqueia input enquanto carrega
    setGameMessage({ text: '', type: '', show: false });

    try {
      const response = await fetch(`${API_URL}/palavras/aleatoria`);
      if (!response.ok) throw new Error('Erro ao buscar palavra');
      const wordData = await response.json();

      const wordUpper = wordData.palavra.toUpperCase();
      setWordId(wordData.id);
      setCurrentWord(wordUpper);
      setNormalizedWord(removeAccents(wordUpper));
      setHint(wordData.dica);
      
      setGuessedLetters(Array(wordUpper.length).fill('_'));
      setUsedLetters([]);
      setAttemptsLeft(6);
      setLetterInput('');
      setIsGameOver(false);

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error(error);
      showMsg('Erro ao conectar ao servidor de palavras!', 'error');
    }
  };

  const saveMatch = async (resultado, pontosGanhos) => {
    if (!user || !wordId) return;

    try {
      await fetch(`${API_URL}/partidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          palavra_id: wordId,
          pontos_ganhos: pontosGanhos,
          resultado: resultado
        })
      });

      setUser(prev => ({ ...prev, score: prev.score + pontosGanhos }));
      updateLeaderboardUI();
    } catch (error) {
      console.error('Erro ao salvar a partida:', error);
    }
  };

  const handleGuess = async () => {
    if (isGameOver) return;

    let letter = removeAccents(letterInput.toUpperCase());

    if (!letter || letter.length !== 1) {
      showMsg('Por favor, digite apenas uma letra!', 'error');
      return;
    }
    if (!letter.match(/[A-Z]/)) {
      showMsg('Digite apenas letras!', 'error');
      return;
    }
    if (usedLetters.includes(letter)) {
      showMsg('Você já tentou essa letra!', 'error');
      setLetterInput('');
      return;
    }

    const newUsedLetters = [...usedLetters, letter];
    setUsedLetters(newUsedLetters);
    setLetterInput('');
    inputRef.current?.focus();

    if (normalizedWord.includes(letter)) {
      const newGuessed = [...guessedLetters];
      for (let i = 0; i < normalizedWord.length; i++) {
        if (normalizedWord[i] === letter) {
          newGuessed[i] = currentWord[i];
        }
      }
      setGuessedLetters(newGuessed);
      showMsg('Letra correta! 🎉', 'success');

      // Condição de Vitória
      if (!newGuessed.includes('_')) {
        const pontosDaPartida = attemptsLeft * 10;
        showMsg('Parabéns! Você venceu! 🏆', 'success');
        setIsGameOver(true);
        await saveMatch('vitoria', pontosDaPartida);
      }
    } else {
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);
      showMsg('Letra incorreta! ❌', 'error');

      // Condição de Derrota
      if (newAttempts === 0) {
        setGuessedLetters(currentWord.split(''));
        showMsg(`Game Over! A palavra era: ${currentWord}`, 'error');
        setIsGameOver(true);
        await saveMatch('derrota', 0);
      }
    }
  };

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  return (
    <>
      <div className="container wide-container">
        
        {/* COLUNA DO JOGO */}
        <div className={`tab-pane ${activeTab === 'game' ? 'active' : ''}`} id="pane-game">
          <h1>🎯 Adivinhe a Palavra</h1>
          
          {!user ? (
            // SEÇÃO DE LOGIN
            <div id="loginSection" className="section">
              <p className="subtitle">Faça login ou cadastre-se para entrar no ranking!</p>
              <div className="login-form">
                <input 
                  type="text" 
                  placeholder="Usuário" 
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loginUser()}
                />
                <button onClick={loginUser}>Entrar / Cadastrar</button>
              </div>
              <div className={`message ${loginMessage.type} ${loginMessage.show ? 'show' : ''}`}>
                {loginMessage.text}
              </div>
            </div>
          ) : (
            // SEÇÃO DO JOGO (Usuário Logado)
            <div id="gameSection" className="section">
              <div className="user-header">
                <span>👤 Jogador: <strong>{user.username}</strong></span>
                <button className="logout-btn" onClick={logoutUser}>Sair</button>
              </div>

              <div className="game-info">
                <div className="info-item">
                  <div className="info-label">Tentativas</div>
                  <div className="info-value">{attemptsLeft}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Pontos</div>
                  <div className="info-value">{user.score}</div>
                </div>
              </div>

              <div className="hint">
                <div className="hint-label">💡 Dica:</div>
                <div className="hint-text">{hint}</div>
              </div>

              <div className="word-display">
                {guessedLetters.map((letter, index) => (
                  <div key={index} className={`letter-box ${letter !== '_' ? 'revealed' : ''}`}>
                    {letter}
                  </div>
                ))}
              </div>

              <div className={`message ${gameMessage.type} ${gameMessage.show ? 'show' : ''}`}>
                {gameMessage.text}
              </div>

              {usedLetters.length > 0 && (
                <div className="used-letters">
                  <div className="used-letters-label">Letras já usadas:</div>
                  <div className="used-letters-list">
                    {usedLetters.map((letter, index) => (
                      <span key={index} className="used-letter">{letter}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="input-section">
                <div className="input-group">
                  <input 
                    type="text" 
                    maxLength="1" 
                    placeholder="Digite uma letra"
                    ref={inputRef}
                    value={letterInput}
                    onChange={(e) => setLetterInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                    disabled={isGameOver}
                  />
                  <button onClick={handleGuess} disabled={isGameOver}>Tentar</button>
                </div>
                <button className="new-game-btn" onClick={startNewGame}>
                  🎮 Pular / Nova Palavra
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="desktop-divider"></div>

        {/* COLUNA DO RANKING */}
        <div className={`tab-pane ${activeTab === 'leaderboard' ? 'active' : ''}`} id="pane-leaderboard">
          <h2 className="ranking-title">🏆 Top Jogadores</h2>
          <ul className="leaderboard-list">
            {leaderboard === null ? (
              <li>Erro ao carregar o ranking. Verifique o servidor.</li>
            ) : leaderboard.length === 0 ? (
              <li>Nenhum jogador registrado ainda.</li>
            ) : (
              leaderboard.map((player, index) => {
                const pos = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
                return (
                  <li key={player.id || index}>
                    <span>{pos} {player.username}</span> 
                    <span>{player.score} pts</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      {/* NAVEGAÇÃO MOBILE */}
      <nav className="mobile-nav">
        <button 
          className={`nav-btn ${activeTab === 'game' ? 'active' : ''}`} 
          onClick={() => setActiveTab('game')}
        >
          🎮 Jogo
        </button>
        <button 
          className={`nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} 
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Ranking
        </button>
      </nav>
    </>
  );
}

export default App;