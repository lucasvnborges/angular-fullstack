# Fullstack App com Docker e RabbitMQ

Este projeto demonstra uma aplicação fullstack com integração de mensageria usando RabbitMQ, containerizada com Docker.

## Estrutura do Projeto

- **Backend**: NestJS com integração RabbitMQ
- **Frontend**: Angular com interface para testar mensageria
- **RabbitMQ**: Message broker para comunicação assíncrona

## Como Executar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Executar com Docker Compose

```bash
docker-compose up --build
```

Este comando irá:
- Construir as imagens do backend e frontend
- Iniciar o RabbitMQ com interface de gerenciamento
- Conectar todos os serviços

### 3. Acessar as Aplicações

- **Frontend**: http://localhost (porta 80)
- **Backend API**: http://localhost:3000
- **RabbitMQ Management UI**: http://localhost:15672
  - Usuário: `admin`
  - Senha: `admin123`

## Funcionalidades

### Frontend
- Interface para enviar mensagens
- Visualização de informações da fila
- Design responsivo e moderno

### Backend
- API REST para envio de mensagens
- Integração com RabbitMQ
- Endpoints:
  - `POST /messages` - Enviar mensagem
  - `GET /messages/queue-info` - Informações da fila

### RabbitMQ
- Fila persistente `message_queue`
- Interface de gerenciamento web
- Configuração de usuário/senha

## Comandos Úteis

### Parar os containers
```bash
docker-compose down
```

### Ver logs
```bash
docker-compose logs -f
```

### Rebuild sem cache
```bash
docker-compose up --build --force-recreate
```

## Estrutura dos Arquivos Docker

- `apps/backend/Dockerfile` - Imagem do backend NestJS
- `apps/frontend/Dockerfile` - Imagem do frontend Angular com Nginx
- `apps/frontend/nginx.conf` - Configuração do Nginx
- `docker-compose.yml` - Orquestração dos serviços

## Testando a Integração

1. Acesse o frontend em http://localhost
2. Digite uma mensagem e clique em "Enviar"
3. Verifique as informações da fila na interface
4. Acesse o RabbitMQ Management UI para ver detalhes das mensagens
5. Verifique os logs dos containers para acompanhar o fluxo

## Desenvolvimento Local

Para desenvolvimento sem Docker:

```bash
# Terminal 1 - Backend
nx serve backend

# Terminal 2 - Frontend  
nx serve frontend

# Terminal 3 - RabbitMQ
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

## Troubleshooting

### Erro de conexão com RabbitMQ
- Verifique se o RabbitMQ está rodando
- Confirme as credenciais (admin/admin123)
- Verifique a URL de conexão no backend

### Frontend não carrega
- Verifique se o proxy está configurado corretamente
- Confirme se o backend está rodando na porta 3000

### Build errors
- Execute `docker-compose down` e `docker-compose up --build`
- Verifique se todas as dependências estão instaladas
