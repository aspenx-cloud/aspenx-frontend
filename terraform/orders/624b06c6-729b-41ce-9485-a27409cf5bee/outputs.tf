output "website_bucket_name" {
  description = "S3 bucket name — upload your static site files here."
  value       = aws_s3_bucket.website.id
}

output "website_bucket_arn" {
  description = "S3 bucket ARN."
  value       = aws_s3_bucket.website.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — needed to create cache invalidations."
  value       = aws_cloudfront_distribution.website.id
}

output "cloudfront_url" {
  description = "CloudFront HTTPS URL — use this to access the site when no custom domain is configured."
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "custom_domain_url" {
  description = "Custom domain URL (only set when domain_name variable was provided)."
  value       = local.has_domain ? "https://${var.domain_name}" : "No custom domain configured."
}

output "rds_endpoint" {
  description = "RDS PostgreSQL hostname:port — use from within the VPC."
  value       = aws_db_instance.postgres.endpoint
}

output "rds_db_name" {
  description = "Initial PostgreSQL database name."
  value       = aws_db_instance.postgres.db_name
}

output "rds_username" {
  description = "RDS master username."
  value       = aws_db_instance.postgres.username
}

output "vpc_id" {
  description = "VPC ID."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (CloudFront origin / future app tier)."
  value       = aws_subnet.public[*].id
}

output "private_db_subnet_ids" {
  description = "Private DB subnet IDs (RDS placement — no internet route)."
  value       = aws_subnet.private_db[*].id
}

output "rds_security_group_id" {
  description = "Security group ID attached to RDS — add ingress rules here to allow application access."
  value       = aws_security_group.rds.id
}

output "tag_filter_command" {
  description = "AWS CLI command to list all resources tagged with this OrderId — use this for manual cleanup."
  value       = "aws resourcegroupstaggingapi get-resources --tag-filters Key=OrderId,Values=${var.order_id} --region ${var.region} --output table"
}

output "order_id" {
  description = "AspenX order ID for this deployment."
  value       = var.order_id
}
