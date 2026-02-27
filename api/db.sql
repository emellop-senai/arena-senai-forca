-- Cria o banco de dados (se o seu banco já existir, pode pular esta linha)
CREATE DATABASE jogo_da_forca;

-- Seleciona o banco para rodar os comandos abaixo
USE jogo_da_forca;

-- ==========================================
-- 1. TABELA DE USUÁRIOS
-- ==========================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    score INT DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. TABELA DE PALAVRAS
-- ==========================================
CREATE TABLE palavras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    palavra VARCHAR(50) NOT NULL,
    dica VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) DEFAULT 'Tecnologia'
);

-- ==========================================
-- 3. TABELA DE PARTIDAS (HISTÓRICO)
-- ==========================================
CREATE TABLE partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    palavra_id INT NOT NULL,
    pontos_ganhos INT DEFAULT 0,
    resultado ENUM('vitoria', 'derrota') NOT NULL,
    jogada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras para ligar as partidas aos usuários e às palavras
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (palavra_id) REFERENCES palavras(id) ON DELETE CASCADE
);

-- ==========================================
-- INSERINDO DADOS DE EXEMPLO (MOCK NO BANCO)
-- ==========================================
INSERT INTO palavras (palavra, dica) VALUES 
('ALGORITMO', 'Sequência lógica de instruções para resolver um problema.'),
('APLICATIVO', 'Programa de software, geralmente baixado no celular.'),
('ARQUIVO', 'Conjunto de dados digitais salvos com um nome específico.'),
('BACKUP', 'Cópia de segurança dos seus dados.'),
('BATERIA', 'Componente que fornece energia para aparelhos portáteis.'),
('CELULAR', 'Dispositivo móvel de comunicação indispensável hoje em dia.'),
('COMPUTADOR', 'Máquina eletrônica capaz de processar dados.'),
('CONEXAO', 'Ligação que permite a comunicação entre dispositivos ou redes.'),
('CRIPTOGRAFIA', 'Técnica de segurança para embaralhar e proteger informações.'),
('FIREWALL', 'Barreira de segurança que bloqueia acessos indesejados à rede.'),
('HACKER', 'Especialista com conhecimento avançado que explora sistemas.'),
('HARDWARE', 'A parte física de um computador (as peças que você pode tocar).'),
('INTERNET', 'A rede mundial de computadores.'),
('LINUX', 'Sistema operacional famoso por ser de código aberto (open source).'),
('MEMORIA', 'Componente onde o computador armazena os dados temporários (RAM).'),
('MONITOR', 'A tela onde você visualiza a interface do computador.'),
('MOUSE', 'Periférico usado para mover o cursor pela tela.'),
('NAVEGADOR', 'Programa usado para acessar sites (ex: Chrome, Firefox).'),
('NUVEM', 'Metáfora para servidores online onde salvamos nossos dados hoje em dia.'),
('PASTA', 'Diretório virtual usado para organizar e guardar arquivos.'),
('PIXEL', 'O menor ponto luminoso que compõe uma imagem digital.'),
('PROCESSADOR', 'O "cérebro" do computador, responsável por executar os cálculos.'),
('PROGRAMACAO', 'A arte de escrever códigos para criar softwares.'),
('PROTOCOLO', 'Conjunto de regras que permite a comunicação entre computadores.'),
('ROTEADOR', 'Aparelho que distribui o sinal de Wi-Fi pela sua casa.'),
('SERVIDOR', 'Computador potente que fornece serviços e hospeda sites.'),
('SOFTWARE', 'A parte lógica do computador (os programas e aplicativos).'),
('TECLADO', 'Periférico com botões usado para digitar informações.'),
('VIRUS', 'Programa malicioso feito para infectar e prejudicar o sistema.'),
('WINDOWS', 'O sistema operacional mais popular do mundo, criado pela Microsoft.');