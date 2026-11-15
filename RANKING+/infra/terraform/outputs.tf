output "vm_external_ip" {
  description = "IP publico estatico da VM - e o que vai no registro A do DNS."
  value       = google_compute_address.vm_ip.address
}

output "vm_internal_ip" {
  value = google_compute_instance.vm.network_interface[0].network_ip
}

output "vm_name" {
  value = google_compute_instance.vm.name
}

output "ssh_command" {
  description = "Comando pra conectar via IAP (sem porta 22 exposta)."
  value       = "gcloud compute ssh ${google_compute_instance.vm.name} --zone=${var.zone} --tunnel-through-iap --project=${var.project_id}"
}

output "db_private_ip" {
  description = "IP privado do Cloud SQL - so alcancavel de dentro da VPC."
  value       = google_sql_database_instance.db.private_ip_address
}

output "db_instance_name" {
  value = google_sql_database_instance.db.name
}

output "db_app_user" {
  value = google_sql_user.app_user.name
}

output "db_app_password" {
  description = "So aparece se voce nao passou db_app_password manualmente (senha gerada automaticamente). Rode 'terraform output -raw db_app_password' pra ver o valor - nunca fica em texto puro no plano/apply."
  value       = local.db_app_password_final
  sensitive   = true
}
