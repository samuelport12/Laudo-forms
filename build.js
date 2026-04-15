// Script de build: gera config.js a partir das variáveis de ambiente da Vercel
const fs = require('fs');

const URL_PLANILHA = process.env.URL_PLANILHA || '';

if (!URL_PLANILHA) {
    console.warn('⚠️  AVISO: Variável URL_PLANILHA não definida!');
}

const content = `// Gerado automaticamente pelo build — NÃO edite manualmente
const URL_PLANILHA = '${URL_PLANILHA}';
`;

fs.writeFileSync('config.js', content);
console.log('✅ config.js gerado com sucesso.');
