# Migração do Ranking+ para GCP

**Data:** 23/08/2026 (atualizado 26/08/2026 — domínio via GoDaddy confirmado)
**Objetivo:** sair do `localhost` (Laragon) e rodar o Ranking+ numa VM real na Google Cloud, simulando uma arquitetura de contratação real — barata o suficiente pra durar o semestre inteiro com os 300 créditos, mas com decisões de mercado de verdade (não gambiarra de projeto de faculdade).

**Pré-requisito:** ativar o billing/créditos na conta GCP (ainda pendente no momento em que este documento foi escrito).

---

## 1. Arquitetura escolhida

```
                         Internet
                             │
                    (domínio → IP estático)
                             │
                    ┌────────▼────────┐
                    │   VM e2-micro    │  Ubuntu 22.04 LTS
                    │   (Always Free)  │
                    │                  │
                    │  Nginx :80/:443  │  ← reverse proxy + TLS (Let's Encrypt)
                    │        │         │
                    │  Node api.js     │  ← systemd, reinicia sozinho
                    │  :4000           │
                    │        │         │
                    │  Cloud SQL Proxy │  ← autentica via IAM da própria VM
                    │  :3306 (local)   │
                    └────────┼─────────┘
                             │  (túnel autenticado, sem senha na rede)
                    ┌────────▼─────────┐
                    │   Cloud SQL       │  MySQL 8.0 gerenciado
                    │   db-f1-micro     │  10GB SSD, backup diário
                    └───────────────────┘
```

**Por que não tem um "Load Balancer" separado:** o Cloud Load Balancing de verdade da GCP cobra uma taxa fixa por hora rodando (~US$18/mês) independente de tráfego, e só faz sentido balanceando entre **múltiplas** VMs. Com uma VM só, ele não balanceia nada — só soma custo. O Nginx na própria VM já cumpre o papel que "load balancer básico" normalmente significa num projeto pequeno: ponto único de entrada, terminação TLS, proxy reverso pro Node. Se um dia você quiser o LB de verdade só pra aprender/pro currículo, é um laboratório de uma tarde (sobe, testa, tira print, derruba) — não algo pra deixar ligado o semestre todo.

---

## 2. Estimativa de custo (semestre = ago-dez, ~5 meses)

| Item | Custo mensal estimado | Observação |
|---|---|---|
| VM e2-micro | **US$ 0** | Always Free Tier da GCP (1 instância/mês, só em `us-central1`/`us-west1`/`us-east1`) |
| Cloud SQL `db-f1-micro` | ~US$ 10-12 | Sem free tier — verificar se o nome do tier mudou no console no dia da criação |
| Disco Cloud SQL (10GB SSD) | ~US$ 1,70 | Mínimo permitido |
| IP estático (enquanto anexado à VM rodando) | US$ 0 | Só cobra se reservado e **não** anexado a uma instância ativa |
| Nginx / Load Balancer | US$ 0 | Rodando na própria VM, sem serviço gerenciado |
| Backup automático Cloud SQL | ~US$ 0,10-0,50 | Proporcional ao tamanho do banco, é pequeno |
| **Total estimado** | **~US$ 12-15/mês** | **~US$ 60-75 no semestre inteiro** — sobra bastante dos 300 créditos |

Se você parar a instância do Cloud SQL (`gcloud sql instances patch --activation-policy=NEVER`) nos períodos sem uso ativo, o custo de computação do banco para, sobrando só o armazenamento (frações de dólar) — vale fazer isso entre uma sessão de estudo/demo e outra.

---

## 3. Antes de tudo: orçamento e alertas (não pule isso)

No console GCP: **Faturamento → Orçamentos e alertas → Criar orçamento**
- Valor: o total de créditos que você tem
- Alertas em 50%, 90% e 100% do valor
- E-mail de notificação: o seu

Isso é o que evita o cenário "esqueci um recurso ligado e zerei os créditos sem perceber".

---

## 4. Preparando o projeto localmente

Antes de mexer na GCP, deixe pronto:

1. **Copie `Backend/api2.js` para `Backend/api.js`** — o `api.js` é a versão que vai pra nuvem; o `api2.js` continua sendo o seu ambiente de desenvolvimento local (Laragon), intocado.
2. Confirme que `Backend/.env.example` está atualizado (ele já está, com `ALLOW_ORIGIN`, `SMTP_*`, `DB_*`) — o `.env` de produção na VM será um arquivo novo, nunca o mesmo do seu PC.
3. Se o projeto ainda não está num repositório Git (GitHub), esse é o jeito mais simples de levar o código pra VM depois (`git clone` na VM). Se preferir não usar Git pra isso, dá pra usar `scp` direto do seu PC pra VM — mostro as duas opções abaixo.

---

## 5. Console GCP — configuração inicial

1. Ativar o billing/créditos (se ainda não fez).
2. Criar um projeto novo, ex: `ranking-plus-prod` (Console → seletor de projeto → Novo Projeto).
3. Ativar as APIs necessárias:
   ```bash
   gcloud services enable compute.googleapis.com sqladmin.googleapis.com
   ```
4. Confirmar a região padrão (recomendado `us-central1`, é uma das regiões elegíveis pro Always Free do e2-micro):
   ```bash
   gcloud config set project SEU_PROJETO_ID
   gcloud config set compute/region us-central1
   gcloud config set compute/zone us-central1-a
   ```

---

## 6. Criar a VM (Ubuntu 22.04, e2-micro)

**Reserve o IP estático primeiro** (assim ele já nasce anexado à VM):

```bash
gcloud compute addresses create ranking-plus-ip --region=us-central1
IP=$(gcloud compute addresses describe ranking-plus-ip --region=us-central1 --format='get(address)')
echo "IP reservado: $IP"
```

**Crie a VM:**

```bash
gcloud compute instances create ranking-plus-vm \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --address=$IP \
  --tags=http-server,https-server \
  --scopes=cloud-platform
```

> `--scopes=cloud-platform` dá à VM permissão pra usar as APIs da GCP (necessário pro Cloud SQL Auth Proxy funcionar sem chave de service account manual, só com a identidade da própria VM).

---

## 7. Firewall (nível GCP — VPC)

```bash
# HTTP e HTTPS abertos pro mundo (é o site público)
gcloud compute firewall-rules create allow-http --allow=tcp:80 --target-tags=http-server --source-ranges=0.0.0.0/0
gcloud compute firewall-rules create allow-https --allow=tcp:443 --target-tags=https-server --source-ranges=0.0.0.0/0

# SSH só do seu IP — descubra o seu em https://whatismyip.com antes de rodar
gcloud compute firewall-rules create allow-ssh-meu-ip \
  --allow=tcp:22 \
  --source-ranges=SEU_IP_AQUI/32
```

Se seu IP de casa mudar (IP dinâmico), você atualiza depois com:
```bash
gcloud compute firewall-rules update allow-ssh-meu-ip --source-ranges=NOVO_IP/32
```

---

## 8. Acesso SSH

**Como você me dá acesso, do jeito mais seguro:** eu gero um par de chaves SSH aqui na minha máquina; você adiciona só a **chave pública** nos metadados da VM (Console → VM → Editar → Chaves SSH → Adicionar item, ou via `gcloud compute instances add-metadata`). Isso é diferente de me dar uma API key da GCP — SSH na VM e acesso à API do projeto GCP são coisas separadas. Pro que você pediu (mexer no Nginx, testar, organizar o host), só a chave SSH resolve; eu não preciso de permissão pra criar/destruir recursos GCP.

**Seu próprio acesso**, se ainda não tem chave configurada:
```bash
gcloud compute ssh ranking-plus-vm --zone=us-central1-a
```
(o `gcloud` cuida de gerar/anexar sua chave automaticamente na primeira vez)

Isso é uma etapa pra quando a VM já existir de verdade — hoje ainda estamos no planejamento.

---

## 9. Configurando o Ubuntu na VM — todos os comandos

Depois de conectado via SSH:

```bash
# Atualização do sistema
sudo apt update && sudo apt upgrade -y

# Ferramentas base
sudo apt install -y curl git nginx mysql-client ufw software-properties-common

# Node.js 18 LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

# Firewall local (defesa em profundidade, além do firewall da GCP)
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status

# Usuário dedicado pra rodar a aplicação (nunca rodar Node como root)
sudo adduser --disabled-password --gecos "" ranking
sudo mkdir -p /home/ranking/app
sudo chown -R ranking:ranking /home/ranking/app
```

---

## 10. Cloud SQL — criar o banco gerenciado

```bash
gcloud sql instances create ranking-plus-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=10GB \
  --storage-type=SSD \
  --backup-start-time=03:00

# Senha do usuário root do MySQL gerenciado
gcloud sql users set-password root --host=% --instance=ranking-plus-db --password="SENHA_FORTE_AQUI"

# Cria o banco (mesmo nome do seu banco local)
gcloud sql databases create universidade_ranking --instance=ranking-plus-db
```

> Se `db-f1-micro` não aparecer disponível no console no dia (a GCP às vezes descontinua nomes de tier), procure o tier "compartilhado"/"shared-core" equivalente mais barato — é o mesmo princípio.

**Autorize a VM a usar o Cloud SQL** (via IAM, não senha exposta na rede):

```bash
PROJECT_NUMBER=$(gcloud projects describe SEU_PROJETO_ID --format='value(projectNumber)')
gcloud projects add-iam-policy-binding SEU_PROJETO_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

**Importe o schema + dados** (do seu backup local pro Cloud SQL):
```bash
# No seu PC, gera um dump limpo (sem senha real, se quiser levar só estrutura+dados fictícios)
mysqldump -u root universidade_ranking > universidade_ranking.sql

# Sobe pro Cloud Storage (Cloud SQL importa a partir de um bucket)
gsutil mb -l us-central1 gs://SEU_PROJETO_ID-sql-import
gsutil cp universidade_ranking.sql gs://SEU_PROJETO_ID-sql-import/

gcloud sql import sql ranking-plus-db gs://SEU_PROJETO_ID-sql-import/universidade_ranking.sql \
  --database=universidade_ranking
```

---

## 11. Cloud SQL Auth Proxy — conexão segura, sem senha trafegando

Na VM:
```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.11.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/

# Pegue o connection name da sua instância:
gcloud sql instances describe ranking-plus-db --format='value(connectionName)'
# formato: SEU_PROJETO_ID:us-central1:ranking-plus-db
```

Crie o serviço systemd do proxy — `/etc/systemd/system/cloud-sql-proxy.service`:
```ini
[Unit]
Description=Cloud SQL Auth Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloud-sql-proxy --port 3306 SEU_PROJETO_ID:us-central1:ranking-plus-db
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloud-sql-proxy
sudo systemctl start cloud-sql-proxy
sudo systemctl status cloud-sql-proxy
```

A partir daqui, o `api.js` conecta em `127.0.0.1:3306` como se fosse um MySQL local — o proxy cuida da autenticação de verdade por trás, sem senha do banco trafegando pela rede.

---

## 12. Levando o código pra VM

**Opção A — Git (recomendado, mais fácil de atualizar depois):**
```bash
sudo -u ranking git clone SEU_REPO_GITHUB /home/ranking/app
```

**Opção B — direto do seu PC via scp (se não quiser usar Git ainda):**
```bash
# Rodando no seu Windows, de dentro da pasta do projeto
scp -r Backend html css javascript images ranking-plus-vm:/home/ranking/app/
```

**Instalar dependências e configurar o `.env` de produção:**
```bash
cd /home/ranking/app/Backend
sudo -u ranking npm install --omit=dev

sudo -u ranking nano .env
```

Conteúdo do `.env` de produção (diferente do seu `.env` local):
```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=SENHA_FORTE_QUE_VOCE_DEFINIU_NO_CLOUD_SQL
DB_NAME=universidade_ranking

SMTP_USER=admin.rankingplus@gmail.com
SMTP_PASS=sua_app_password_atual

PORT=4000
ALLOW_ORIGIN=https://seu-dominio.com,null
```

---

## 13. systemd service do Node — reinicia sozinho com o host

`/etc/systemd/system/ranking-plus.service`:
```ini
[Unit]
Description=Ranking+ API (Node/Express)
After=network.target cloud-sql-proxy.service
Wants=cloud-sql-proxy.service

[Service]
Type=simple
User=ranking
WorkingDirectory=/home/ranking/app/Backend
ExecStart=/usr/bin/node api.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable ranking-plus
sudo systemctl start ranking-plus
sudo systemctl status ranking-plus

# Ver logs em tempo real
sudo journalctl -u ranking-plus -f
```

`enable` garante que ele sobe sozinho no boot do host; `Restart=always` garante que ele volta sozinho se o processo cair.

---

## 14. Nginx — reverse proxy + preparação pro HTTPS

> [!important] Por que isso é "seguro" e não só "funciona"
> A API (`Node api.js`) nunca fica exposta direto pra internet — ela só escuta em `127.0.0.1:4000` (loopback da própria VM) e o firewall da GCP (Passo 7) só abre as portas **80 e 443**, nunca a 4000. Isso significa: mesmo que alguém descubra o IP da VM, não tem como bater na porta 4000 de fora — só o Nginx, rodando na mesma máquina, consegue falar com o Node. O Nginx é o único ponto exposto pro mundo, e é ele quem termina o TLS (HTTPS) antes de repassar a requisição já "traduzida" pro Node em HTTP puro por dentro. Somado ao systemd (Passo 13, `Restart=always`), a API vira um serviço de verdade do sistema operacional — sobe sozinha no boot, volta sozinha se cair — sem nunca precisar ficar acessível diretamente por fora.

`/etc/nginx/sites-available/ranking-plus`:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ranking-plus /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 15. HTTPS de verdade (Let's Encrypt via certbot)

**Decidido:** domínio comprado na **GoDaddy**, apontando pro IP externo estático da VM (Passo 6) via registro DNS tipo **A** — na GoDaddy: DNS Management → Records → adicionar/editar um registro `A`, `Name: @` (domínio raiz) apontando pro IP estático, e outro `A` com `Name: www` pro mesmo IP se quiser `www.seu-dominio.com` também. Propagação de DNS pode levar de alguns minutos até ~1h; sem isso propagado, o Certbot falha no desafio HTTP (ele valida batendo em `http://seu-dominio.com/.well-known/...`, então o domínio precisa já estar resolvendo pro IP da VM antes de rodar o comando abaixo).

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

O certbot já configura o Nginx pra HTTPS automaticamente (redirect 80→443 incluso) e cria a renovação automática via timer do systemd (`certbot.timer`, roda 2x/dia, só renova de fato quando falta <30 dias pro certificado vencer) — não precisa fazer nada depois. Certificado Let's Encrypt é gratuito e válido por 90 dias, renovado automaticamente antes de expirar.

Depois disso, atualize o `.env` (`ALLOW_ORIGIN=https://seu-dominio.com,null`) e reinicie o serviço:
```bash
sudo systemctl restart ranking-plus
```

---

## 16. Checklist final

- [ ] Billing/créditos ativados na conta GCP
- [ ] Orçamento + alertas configurados (Passo 3)
- [ ] Projeto GCP criado, APIs ativadas
- [ ] IP estático reservado
- [ ] VM `e2-micro` criada em região elegível pro Always Free
- [ ] Firewall: 80/443 abertos, 22 restrito ao seu IP
- [ ] Chave SSH do responsavel tecnico adicionada nos metadados da VM
- [ ] Ubuntu atualizado, Node 18, Nginx, ufw configurados
- [ ] Cloud SQL criado, backup automático ativo
- [ ] IAM: `roles/cloudsql.client` concedido à service account da VM
- [ ] Cloud SQL Auth Proxy rodando como serviço systemd
- [ ] `api.js` copiado e no ar na VM, `.env` de produção configurado
- [ ] Serviço systemd do Node ativo (`enable` + `start`)
- [ ] Nginx como reverse proxy funcionando
- [ ] Domínio apontando pro IP + HTTPS via certbot
- [ ] Teste end-to-end: login, ranking, chat, tudo funcionando via HTTPS

## Próximos passos / decisões que faltam

- [x] **Domínio:** decidido — comprar na GoDaddy (registro A → IP estático da VM, ver Passo 15). Ainda falta a compra em si; nada registrado de fato até a VM/IP estático existirem.
- **Repositório Git:** o projeto já está num GitHub privado, ou prefere que eu leve o código via `scp` na hora?
- **Senha do Cloud SQL:** defina uma forte antes de criar (não reaproveitar nenhuma senha usada em outro lugar).
