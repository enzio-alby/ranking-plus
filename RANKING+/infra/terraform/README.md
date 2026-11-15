# Infra do Ranking+ como código (Terraform)

Reproduz em IaC a infraestrutura GCP provisionada manualmente em 03-04/09/2026 (ver `analise-gcp1.md` no vault e o ADR `docs/decisoes/0002-hospedagem-local-e-gcp.md`): VPC dedicada, Cloud SQL com IP privado, VM com nginx/systemd, firewall restrito e acesso SSH só via Identity-Aware Proxy.

## O que este módulo provisiona

- VPC + subnet dedicadas, com peering privado pro Cloud SQL (sem IP público no banco).
- Firewall: 80/443 públicos; SSH só do range oficial do IAP (`35.235.240.0/20`) — nunca `0.0.0.0/0`.
- IP externo estático (evita precisar reconfigurar DNS a cada restart da VM).
- Service account dedicada da VM, sem roles de projeto atribuídas (least privilege).
- VM Compute Engine (Ubuntu 24.04 LTS) com um `startup-script.sh` que instala nginx, git, mysql-client, Node.js LTS e certbot.
- Instância Cloud SQL (MySQL 8.0), banco e usuário de aplicação dedicado (senha gerada automaticamente se você não fornecer uma).

## O que este módulo **não** provisiona (de propósito)

Fica fora porque depende de segredos e do domínio específicos de cada ambiente — automatizar aqui misturaria infra reutilizável com configuração de um deploy específico:

1. **Deploy do código** da aplicação (copiar `Backend/`, `html/`, `css/`, etc. pra VM).
2. **`Backend/.env`** com as credenciais reais de conexão.
3. **Unit do systemd** do processo Node (nome do serviço, caminho do log).
4. **Config do nginx** pro domínio real + **certbot** (só dá pra rodar depois do DNS já apontar pro IP que este módulo cria).
5. **Import do schema/dados** do banco.

Esses passos ficam documentados em `analise-gcp1.md` (vault) e podem virar um playbook Ansible depois, se fizer sentido.

## Como usar

```bash
cp terraform.tfvars.example terraform.tfvars
# edite terraform.tfvars com o project_id do ambiente alvo

terraform init
terraform plan
terraform apply
```

Depois do `apply`:

```bash
terraform output vm_external_ip   # aponte o DNS pra esse IP
terraform output ssh_command      # comando pronto pra conectar via IAP
terraform output -raw db_app_password   # só se você deixou o Terraform gerar a senha
```

## Reaproveitar em outro ambiente/projeto

Todos os nomes de recurso usam `var.name_prefix` (padrão `rankingplus`) — mude essa variável pra rodar um segundo ambiente (ex.: `rankingplus-hml`) no mesmo projeto GCP sem colisão de nomes.

## Importante

- `terraform.tfvars` e `terraform.tfstate` **nunca** devem ser commitados (já estão no `.gitignore` desta pasta) — o state pode conter a senha do banco em texto puro se você não usar um backend remoto criptografado.
- Este módulo **não gerencia** os recursos que já estão rodando em produção (foram criados via `gcloud` CLI direto, não por Terraform). Rodar `terraform apply` com o mesmo `project_id`/`name_prefix` da produção vai tentar criar recursos duplicados. Pra assumir o gerenciamento do ambiente atual, seria preciso `terraform import` de cada recurso primeiro — não foi feito aqui de propósito, por segurança.
