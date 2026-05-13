locals {
  # Short prefix used across resource names. Includes first 8 chars of order ID for traceability.
  name_prefix = "${var.project_name}-${substr(var.order_id, 0, 8)}"

  # Whether a custom domain was provided. Controls ACM + Route53 resource creation.
  has_domain = var.domain_name != ""

  # Two AZs are required for the RDS subnet group even in a single-AZ deployment.
  azs = ["${var.region}a", "${var.region}b"]
}
