resource "aws_cloudfront_origin_access_control" "website" {
  name                              = "${local.name_prefix}-oac"
  description                       = "OAC for ${local.name_prefix} S3 website origin"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "website" {
  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.website.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US, Canada, Europe only — cheapest option

  aliases = local.has_domain ? [var.domain_name, "www.${var.domain_name}"] : []

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.website.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # SPA-style routing: return index.html for 403/404 so the frontend router handles the path.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = !local.has_domain
    # try() is required: Terraform evaluates both ternary branches for type-checking
    # and [0] on a count=0 resource would error without it.
    acm_certificate_arn = try(aws_acm_certificate_validation.website[0].certificate_arn, null)
    ssl_support_method  = local.has_domain ? "sni-only" : null

    # TLSv1.2_2021 is enforced only when a custom ACM certificate is used (domain_name set).
    # AWS locks the CloudFront default certificate to TLSv1 regardless of this field;
    # "TLSv1" is the only valid explicit value for that path per the AWS provider schema.
    # Set domain_name in terraform.tfvars to get TLSv1.2_2021 enforcement end-to-end.
    minimum_protocol_version = local.has_domain ? "TLSv1.2_2021" : "TLSv1"
  }

  tags = {
    Name = "${local.name_prefix}-cloudfront"
  }
}

# Bucket policy granting CloudFront OAC read access to the S3 bucket.
# Must be applied after the distribution exists (uses distribution ARN as condition).
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.website.arn
          }
        }
      }
    ]
  })
}
