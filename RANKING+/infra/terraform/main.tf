# =============================================================================
# Ranking+ — Infra GCP (VM + Cloud SQL + rede privada)
#
# Reproduz a arquitetura provisionada manualmente em 03-04/09/2026:
#   VPC dedicada -> peering privado -> Cloud SQL (sem IP publico)
#   VM (nginx + Node.js via systemd) -> IP externo estatico
#   Firewall: 80/443 publicos, SSH so via Identity-Aware Proxy
#
# O que este modulo NAO faz (fica em configuracao pos-provisionamento,
# porque depende de segredos/dominio especificos do ambiente):
#   - Deploy do codigo da aplicacao (git clone / scp)
#   - Criacao do Backend/.env com credenciais reais
#   - Unit do systemd do processo Node (o startup-script so instala os
#     pacotes; o service file e criado manualmente ou por um playbook a parte)
#   - Configuracao do nginx pro dominio + certbot (precisa do DNS ja
#     apontado pro IP antes de rodar, entao nao da pra automatizar no
#     mesmo apply que cria o IP)
#   - Importacao do schema/dados do banco
# =============================================================================

# --- APIs necessarias -------------------------------------------------------

resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "sqladmin.googleapis.com",
    "servicenetworking.googleapis.com",
    "iap.googleapis.com",
  ])
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# --- Rede ---------------------------------------------------------------

resource "google_compute_network" "vpc" {
  name                    = "${var.name_prefix}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  depends_on              = [google_project_service.apis]
}

resource "google_compute_subnetwork" "subnet" {
  name          = "${var.name_prefix}-subnet"
  network       = google_compute_network.vpc.id
  region        = var.region
  ip_cidr_range = "10.10.0.0/24"
}

# Peering privado pro Cloud SQL (sem IP publico no banco)
resource "google_compute_global_address" "private_services_range" {
  name          = "google-managed-services-${var.name_prefix}-vpc"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services_range.name]
}

# --- Firewall -----------------------------------------------------------

resource "google_compute_firewall" "allow_http" {
  name          = "${var.name_prefix}-allow-http"
  network       = google_compute_network.vpc.name
  direction     = "INGRESS"
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server"]
  allow {
    protocol = "tcp"
    ports    = ["80"]
  }
}

resource "google_compute_firewall" "allow_https" {
  name          = "${var.name_prefix}-allow-https"
  network       = google_compute_network.vpc.name
  direction     = "INGRESS"
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["https-server"]
  allow {
    protocol = "tcp"
    ports    = ["443"]
  }
}

# SSH so pelo range oficial do Identity-Aware Proxy - nunca 0.0.0.0/0.
# Evita o problema classico de IP dinamico do provedor local mudar e trancar
# o acesso (o que aconteceu nas tentativas manuais anteriores).
resource "google_compute_firewall" "allow_ssh_iap" {
  name          = "${var.name_prefix}-allow-ssh-iap"
  network       = google_compute_network.vpc.name
  direction     = "INGRESS"
  source_ranges = var.ssh_source_ranges
  target_tags   = ["ssh-iap"]
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

# --- IP estatico ----------------------------------------------------------

resource "google_compute_address" "vm_ip" {
  name   = "${var.name_prefix}-ip"
  region = var.region
}

# --- Service account minima da VM -----------------------------------------

resource "google_service_account" "vm_sa" {
  account_id   = "${var.name_prefix}-vm"
  display_name = "${var.name_prefix}-vm-minimal"
}

# Sem roles de projeto atribuidas de proposito (least privilege) - a VM so
# precisa de acesso de rede ao Cloud SQL via IP privado, nao de permissao IAM.

# --- Compute Engine ---------------------------------------------------------

resource "google_compute_instance" "vm" {
  name         = "${var.name_prefix}-vm"
  machine_type = var.vm_machine_type
  zone         = var.zone
  tags         = ["http-server", "https-server", "ssh-iap"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      size  = var.vm_disk_size_gb
      type  = "pd-balanced"
    }
  }

  network_interface {
    network    = google_compute_network.vpc.id
    subnetwork = google_compute_subnetwork.subnet.id
    access_config {
      nat_ip = google_compute_address.vm_ip.address
    }
  }

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["logging-write", "monitoring-write"]
  }

  metadata_startup_script = file("${path.module}/startup-script.sh")

  depends_on = [google_project_service.apis]
}

# --- Cloud SQL (MySQL) ------------------------------------------------------

resource "random_password" "db_app_password" {
  count   = var.db_app_password == "" ? 1 : 0
  length  = 24
  special = true
  # evita caracteres que costumam dar problema em connection strings/CLI
  override_special = "!#%^*()-_=+"
}

locals {
  db_app_password_final = var.db_app_password != "" ? var.db_app_password : random_password.db_app_password[0].result
}

resource "google_sql_database_instance" "db" {
  name             = "${var.name_prefix}-db"
  database_version = "MYSQL_8_0"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }

    backup_configuration {
      enabled = true
    }

    disk_size       = var.db_disk_size_gb
    disk_type       = "PD_SSD"
    disk_autoresize = true
  }

  deletion_protection = true

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

resource "google_sql_database" "app_db" {
  name     = var.db_name
  instance = google_sql_database_instance.db.name
}

resource "google_sql_user" "app_user" {
  name     = var.db_app_user
  instance = google_sql_database_instance.db.name
  password = local.db_app_password_final
}
