#!/bin/bash
# Startup script da VM - roda uma unica vez na primeira inicializacao.
# So instala os pacotes base; NAO faz deploy do codigo nem configura
# nginx/systemd pro app especifico (isso depende do dominio e dos
# segredos do ambiente, ver README.md desta pasta).
set -euo pipefail

apt-get update -y
apt-get install -y nginx git mysql-client

# Node.js LTS mais recente via NodeSource (nao fixa uma major especifica de
# proposito, pra sempre puxar a LTS vigente no momento em que a VM sobe)
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# certbot via snap (inclui timer de renovacao automatica)
snap install core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot
