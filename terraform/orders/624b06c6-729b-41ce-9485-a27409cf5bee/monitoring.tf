resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${local.name_prefix}-rds-cpu-high"
  alarm_description   = "RDS CPU utilization exceeded 80% for 10 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.identifier
  }

  tags = {
    Name = "${local.name_prefix}-rds-cpu-high"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${local.name_prefix}-rds-storage-low"
  alarm_description   = "RDS free storage dropped below 2 GB"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2147483648 # 2 GB in bytes
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.identifier
  }

  tags = {
    Name = "${local.name_prefix}-rds-storage-low"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${local.name_prefix}-rds-connections-high"
  alarm_description   = "RDS connection count exceeded 80 (db.t3.micro max ~85)"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.identifier
  }

  tags = {
    Name = "${local.name_prefix}-rds-connections-high"
  }
}

# CloudFront metrics are always published to us-east-1 regardless of origin location.
resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx_high" {
  alarm_name          = "${local.name_prefix}-cloudfront-5xx-high"
  alarm_description   = "CloudFront 5xx error rate exceeded 5% for 10 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.website.id
    Region         = "Global"
  }

  tags = {
    Name = "${local.name_prefix}-cloudfront-5xx-high"
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_4xx_high" {
  alarm_name          = "${local.name_prefix}-cloudfront-4xx-high"
  alarm_description   = "CloudFront 4xx error rate exceeded 20% for 15 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 20
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.website.id
    Region         = "Global"
  }

  tags = {
    Name = "${local.name_prefix}-cloudfront-4xx-high"
  }
}
