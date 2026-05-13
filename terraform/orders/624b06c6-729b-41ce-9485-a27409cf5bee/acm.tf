# All resources in this file are conditional on var.domain_name being set.
# CloudFront requires ACM certificates to be in us-east-1; this provider is already us-east-1.

resource "aws_acm_certificate" "website" {
  count = local.has_domain ? 1 : 0

  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${local.name_prefix}-cert"
  }
}

# Prerequisite: a Route53 hosted zone for var.domain_name must already exist in this account.
# If you manage DNS elsewhere, create the CNAME validation records manually and remove these resources.
data "aws_route53_zone" "website" {
  count = local.has_domain ? 1 : 0

  name         = var.domain_name
  private_zone = false
}

resource "aws_route53_record" "cert_validation" {
  for_each = local.has_domain ? {
    for dvo in aws_acm_certificate.website[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.website[0].zone_id
}

resource "aws_acm_certificate_validation" "website" {
  count = local.has_domain ? 1 : 0

  certificate_arn         = aws_acm_certificate.website[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_route53_record" "website_apex" {
  count = local.has_domain ? 1 : 0

  zone_id = data.aws_route53_zone.website[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "website_www" {
  count = local.has_domain ? 1 : 0

  zone_id = data.aws_route53_zone.website[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}
