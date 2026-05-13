variable "order_id" {
  type        = string
  description = "AspenX order ID."
  default     = "624b06c6-729b-41ce-9485-a27409cf5bee"
}

variable "customer_account_id" {
  type        = string
  description = "Customer AWS account ID."
  default     = "823714877103"
}

variable "region" {
  type        = string
  description = "AWS region to deploy into."
  default     = "us-east-1"

  validation {
    condition     = var.region == "us-east-1"
    error_message = "This order is scoped to us-east-1. Change the order configuration to target a different region."
  }
}

variable "project_name" {
  type        = string
  description = "Short project name prefix used in resource names."
  default     = "aspenx-tier1"

  validation {
    condition     = length(var.project_name) <= 20 && can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric with hyphens, max 20 characters."
  }
}

variable "domain_name" {
  type        = string
  description = "Optional custom domain name (e.g. example.com). Leave empty to skip ACM and Route53. A Route53 hosted zone for this domain must already exist in the account."
  default     = ""
}

variable "db_username" {
  type        = string
  description = "RDS PostgreSQL master username."
  default     = "aspenxadmin"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{2,30}$", var.db_username))
    error_message = "db_username must start with a letter, be 3–31 characters, and contain only letters, digits, or underscores."
  }
}

variable "db_password" {
  type        = string
  description = "RDS PostgreSQL master password. Must be at least 16 characters. Never commit this value to source control — pass via terraform.tfvars or an environment variable (TF_VAR_db_password)."
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 16
    error_message = "db_password must be at least 16 characters."
  }
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class. Locked to small prototype sizes only."
  default     = "db.t3.micro"

  validation {
    condition     = contains(["db.t3.micro", "db.t3.small", "db.t3.medium"], var.db_instance_class)
    error_message = "Only prototype-sized instance classes are allowed: db.t3.micro, db.t3.small, db.t3.medium."
  }
}

variable "db_allocated_storage" {
  type        = number
  description = "RDS allocated storage in GB."
  default     = 20

  validation {
    condition     = var.db_allocated_storage >= 20 && var.db_allocated_storage <= 100
    error_message = "Storage must be between 20 and 100 GB for prototype deployments."
  }
}
