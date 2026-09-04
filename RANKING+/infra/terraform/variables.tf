variable "project_id" {
  description = "ID do projeto GCP onde a infra sera criada."
  type        = string
}

variable "region" {
  description = "Regiao GCP. us-central1 (Iowa) fica no tier de preco mais barato da GCP; troque so se precisar de menor latencia pra um publico especifico."
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "Zona dentro da regiao."
  type        = string
  default     = "us-central1-a"
}

variable "name_prefix" {
  description = "Prefixo usado no nome de todos os recursos (permite reaproveitar este modulo em outro ambiente/projeto sem colisao de nomes)."
  type        = string
  default     = "rankingplus"
}

variable "vm_machine_type" {
  description = "Tipo de maquina da VM. e2-small e suficiente pra nginx + Node.js num projeto de baixo trafego."
  type        = string
  default     = "e2-small"
}

variable "vm_disk_size_gb" {
  type    = number
  default = 20
}

variable "db_tier" {
  description = "Tier do Cloud SQL. db-custom-1-3840 = 1 vCPU dedicada / 3.75GB RAM (evita os tiers shared-core, mais lentos sob carga de conexoes)."
  type        = string
  default     = "db-custom-1-3840"
}

variable "db_disk_size_gb" {
  type    = number
  default = 10
}

variable "db_name" {
  description = "Nome do banco de dados a ser criado dentro da instancia Cloud SQL."
  type        = string
  default     = "universidade_ranking"
}

variable "db_app_user" {
  description = "Usuario de aplicacao (nao-root) que a API usa pra conectar no banco."
  type        = string
  default     = "rankingplus_app"
}

variable "db_app_password" {
  description = "Senha do usuario de aplicacao. Deixe em branco (padrao) pra o Terraform gerar uma senha aleatoria forte automaticamente - so defina um valor aqui se realmente precisar reaproveitar uma senha existente."
  type        = string
  default     = ""
  sensitive   = true
}

variable "ssh_source_ranges" {
  description = "Ranges de origem liberados pra SSH na porta 22. O padrao e so o range oficial do Identity-Aware Proxy do Google (35.235.240.0/20) - nunca abra 22 pra 0.0.0.0/0."
  type        = list(string)
  default     = ["35.235.240.0/20"]
}
