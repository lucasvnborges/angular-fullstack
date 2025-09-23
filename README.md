# Sistema de Notificações - Desafio Técnico

## 🚀 Execução Rápida

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js (para testes locais)

### 1. Executar a aplicação
```bash
git clone https://github.com/lucasvnborges/angular-fullstack.git
cd angular-fullstack
docker-compose up --build
```

### 2. Acessar os serviços
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)

### 3. Testar o sistema
1. Acesse http://localhost
2. Digite uma mensagem no campo de texto
3. Clique em "Enviar Notificação"
4. Observe o status sendo atualizado automaticamente (polling a cada 3s)

## 📋 Funcionalidades

### Sistema de Notificações Assíncrono
- **Frontend**: Angular com interface para envio e monitoramento
- **Backend**: NestJS com endpoints REST e processamento assíncrono
- **RabbitMQ**: Message broker para comunicação entre serviços

### Fluxo de Funcionamento
1. Frontend gera UUID e envia POST para `/api/notificar`
2. Backend valida e publica na fila `fila.notificacao.entrada.terra`
3. Consumidor processa assincronamente (1-2s, 20% chance de falha)
4. Status publicado na fila `fila.notificacao.status.terra`
5. Frontend atualiza interface via polling

### Endpoints Principais
- `POST /api/notificar` - Enviar notificação
- `GET /api/notificacao/status/:mensagemId` - Consultar status

## 🧪 Executar Testes

```bash
# Backend
nx test backend --watch=false

# Frontend  
nx test frontend --watch=false
```

## 🛠️ Comandos Úteis

```bash
# Parar containers
docker-compose down

# Ver logs
docker-compose logs -f

# Rebuild completo
docker-compose up --build --force-recreate
```

## 📊 Monitoramento
- Interface do frontend mostra status em tempo real
- RabbitMQ Management UI para monitorar filas
- Status possíveis: `AGUARDANDO_PROCESSAMENTO`, `PROCESSADO_SUCESSO`, `FALHA_PROCESSAMENTO`
