// ==========================================
// CONFIGURAÇÃO DA API
// ==========================================
const API_URL = 'http://localhost:3000/api';

// ==========================================
// VARIÁVEIS DE ESTADO DO JOGO
// ==========================================
let currentWord = '';
let normalizedWord = '';
let currentHint = '';
let guessedLetters = [];
let usedLetters = [];
let attemptsLeft = 6;
let score = 0;

// Variáveis para comunicação com o Banco de Dados
let currentUser = null;
let currentUserId = null;
let currentWordId = null;

// ==========================================
// GERENCIAMENTO DE USUÁRIOS E RANKING
// ==========================================

async function updateLeaderboardUI() {
    const list = document.getElementById('leaderboardList');

    try {
        const response = await fetch(`${API_URL}/ranking`);
        if (!response.ok) throw new Error('Erro ao buscar ranking');

        const leaderboard = await response.json();
        list.innerHTML = '';

        if (leaderboard.length === 0) {
            list.innerHTML = '<li>Nenhum jogador registrado ainda.</li>';
            return;
        }

        leaderboard.forEach((player, index) => {
            const li = document.createElement('li');
            const pos = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
            li.innerHTML = `<span>${pos} ${player.username}</span> <span>${player.score} pts</span>`;
            list.appendChild(li);
        });
    } catch (error) {
        console.error(error);
        list.innerHTML = '<li>Erro ao carregar o ranking. Verifique o servidor.</li>';
    }
}

async function loginUser() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    const msg = document.getElementById('loginMessage');

    // Validações básicas
    if (!username || username.length < 3) {
        msg.textContent = 'O usuário deve ter pelo menos 3 caracteres!';
        msg.className = 'message error show';
        setTimeout(() => msg.classList.remove('show'), 2000);
        return;
    }

    try {
        // Envia o username para a API (faz login ou cadastra se não existir)
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!response.ok) throw new Error('Erro na comunicação com a API');

        const user = await response.json();

        // Seta as variáveis globais com dados reais do banco
        currentUser = user.username;
        currentUserId = user.id;
        score = user.score;

        // Atualiza UI do Jogo
        document.getElementById('currentPlayerName').textContent = currentUser;
        document.getElementById('score').textContent = score;

        // Esconde o Login e mostra o Jogo
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('gameSection').style.display = 'flex';
        usernameInput.value = '';

        // Inicia a partida
        newGame();

        // 🟢 NOVO: Atualiza o ranking imediatamente após logar/cadastrar
        updateLeaderboardUI();

    } catch (error) {
        console.error(error);
        msg.textContent = 'Erro de conexão com o servidor!';
        msg.className = 'message error show';
        setTimeout(() => msg.classList.remove('show'), 3000);
    }
}

function logoutUser() {
    currentUser = null;
    currentUserId = null;
    score = 0;

    document.getElementById('gameSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'flex';

    updateLeaderboardUI();
}

async function saveMatch(resultado, pontosGanhos) {
    if (!currentUserId || !currentWordId) return;

    try {
        await fetch(`${API_URL}/partidas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: currentUserId,
                palavra_id: currentWordId,
                pontos_ganhos: pontosGanhos,
                resultado: resultado
            })
        });

        // Atualiza a pontuação local do usuário na tela
        score += pontosGanhos;
        document.getElementById('score').textContent = score;

        // Atualiza a tabela do ranking em background
        updateLeaderboardUI();
    } catch (error) {
        console.error('Erro ao salvar a partida:', error);
    }
}

// ==========================================
// LÓGICA DO JOGO
// ==========================================

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function newGame() {
    document.getElementById('hint').textContent = "Buscando palavra no servidor...";
    document.getElementById('letterInput').disabled = true;
    document.querySelector('.input-section .input-group button').disabled = true;
    hideMessage();

    try {
        // Busca palavra aleatória do banco de dados
        const response = await fetch(`${API_URL}/palavras/aleatoria`);
        if (!response.ok) throw new Error('Erro ao buscar palavra');

        const wordData = await response.json();

        // Configura as variáveis com os dados do banco
        currentWordId = wordData.id;
        currentWord = wordData.palavra.toUpperCase();
        normalizedWord = removeAccents(currentWord);
        currentHint = wordData.dica;

        guessedLetters = Array(currentWord.length).fill('_');
        usedLetters = [];
        attemptsLeft = 6;

        document.getElementById('hint').textContent = currentHint;
        document.getElementById('attempts').textContent = attemptsLeft;
        document.getElementById('letterInput').value = '';

        document.getElementById('letterInput').disabled = false;
        document.querySelector('.input-section .input-group button').disabled = false;
        document.getElementById('usedLettersContainer').style.display = 'none';
        document.getElementById('letterInput').focus();

        updateDisplay();
    } catch (error) {
        console.error(error);
        showMessage('Erro ao conectar ao servidor de palavras!', 'error');
    }
}

function updateDisplay() {
    const wordDisplay = document.getElementById('wordDisplay');
    wordDisplay.innerHTML = '';

    guessedLetters.forEach((letter) => {
        const box = document.createElement('div');
        box.className = 'letter-box';
        if (letter !== '_') {
            box.classList.add('revealed');
        }
        box.textContent = letter;
        wordDisplay.appendChild(box);
    });

    if (usedLetters.length > 0) {
        document.getElementById('usedLettersContainer').style.display = 'flex';
        const usedLettersDiv = document.getElementById('usedLetters');
        usedLettersDiv.innerHTML = '';
        usedLetters.forEach(letter => {
            const span = document.createElement('span');
            span.className = 'used-letter';
            span.textContent = letter;
            usedLettersDiv.appendChild(span);
        });
    }
}

async function guessLetter() {
    const input = document.getElementById('letterInput');
    let letter = input.value.toUpperCase();
    letter = removeAccents(letter);

    if (!letter || letter.length !== 1) {
        showMessage('Por favor, digite apenas uma letra!', 'error');
        return;
    }

    if (!letter.match(/[A-Z]/)) {
        showMessage('Digite apenas letras!', 'error');
        return;
    }

    if (usedLetters.includes(letter)) {
        showMessage('Você já tentou essa letra!', 'error');
        input.value = '';
        return;
    }

    usedLetters.push(letter);
    input.value = '';
    input.focus();

    if (normalizedWord.includes(letter)) {
        for (let i = 0; i < normalizedWord.length; i++) {
            if (normalizedWord[i] === letter) {
                guessedLetters[i] = currentWord[i];
            }
        }
        showMessage('Letra correta! 🎉', 'success');

        // Condição de Vencedor
        if (!guessedLetters.includes('_')) {
            const pontosDaPartida = attemptsLeft * 10;
            showMessage('Parabéns! Você venceu! 🏆', 'success');
            document.getElementById('letterInput').disabled = true;
            document.querySelector('.input-section .input-group button').disabled = true;

            // Salva a vitória no banco de dados
            await saveMatch('vitoria', pontosDaPartida);
        }
    } else {
        attemptsLeft--;
        document.getElementById('attempts').textContent = attemptsLeft;
        showMessage('Letra incorreta! ❌', 'error');

        // Condição de Derrota
        if (attemptsLeft === 0) {
            guessedLetters = currentWord.split('');
            showMessage(`Game Over! A palavra era: ${currentWord}`, 'error');
            document.getElementById('letterInput').disabled = true;
            document.querySelector('.input-section .input-group button').disabled = true;

            // Salva a derrota no banco de dados (0 pontos)
            await saveMatch('derrota', 0);
        }
    }

    updateDisplay();
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type} show`;

    if (type === 'success' && !guessedLetters.includes('_')) return;
    if (attemptsLeft === 0) return;

    setTimeout(hideMessage, 2000);
}

function hideMessage() {
    const message = document.getElementById('message');
    message.classList.remove('show');
}

// ==========================================
// EVENTOS
// ==========================================
document.getElementById('usernameInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') loginUser();
});

document.getElementById('letterInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') guessLetter();
});

// --- CONTROLE DE NAVEGAÇÃO MOBILE (ABAS) ---
function switchTab(tabName) {
    document.getElementById('pane-game').classList.remove('active');
    document.getElementById('pane-leaderboard').classList.remove('active');
    document.getElementById('nav-game').classList.remove('active');
    document.getElementById('nav-leaderboard').classList.remove('active');

    if (tabName === 'game') {
        document.getElementById('pane-game').classList.add('active');
        document.getElementById('nav-game').classList.add('active');
    } else if (tabName === 'leaderboard') {
        document.getElementById('pane-leaderboard').classList.add('active');
        document.getElementById('nav-leaderboard').classList.add('active');
        updateLeaderboardUI();
    }
}

// Inicialização: carrega o ranking do servidor
updateLeaderboardUI();