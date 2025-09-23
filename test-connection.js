#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testando conexão entre frontend e backend...\n');

// Teste 1: Backend direto
console.log('1. Testando backend direto (localhost:3000):');
const backendTest = http.get('http://localhost:3000/api', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Backend respondendo:', data);
    testFrontend();
  });
}).on('error', (err) => {
  console.log('❌ Backend não está rodando:', err.message);
  console.log('   Execute: docker-compose up backend');
  process.exit(1);
});

// Teste 2: Frontend via nginx
function testFrontend() {
  console.log('\n2. Testando frontend via nginx (localhost:80):');
  const frontendTest = http.get('http://localhost:80/api', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Frontend proxy funcionando:', data);
      console.log('\n🎉 Conexão entre frontend e backend está funcionando!');
    });
  }).on('error', (err) => {
    console.log('❌ Frontend proxy não está funcionando:', err.message);
    console.log('   Execute: docker-compose up frontend');
  });
}

// Teste 3: Verificar se containers estão rodando
console.log('3. Verificando containers Docker:');
const { exec } = require('child_process');
exec('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Erro ao verificar containers:', error.message);
    return;
  }
  
  console.log('📋 Containers ativos:');
  console.log(stdout);
  
  if (stdout.includes('backend') && stdout.includes('frontend')) {
    console.log('✅ Containers backend e frontend estão rodando');
  } else {
    console.log('❌ Containers não estão rodando. Execute: docker-compose up -d');
  }
});
