# Usa uma imagem leve do Node.js
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (otimiza o cache)
COPY package*.json ./

# Instala as dependências (sem baixar pacotes de desenvolvimento)
RUN npm install --production

# Copia o restante dos arquivos do seu projeto
COPY . .

# Expõe a porta que sua aplicação utiliza (ajuste se for diferente de 3000)
EXPOSE 6262

# Comando para iniciar a aplicação
CMD ["npm", "start"]
