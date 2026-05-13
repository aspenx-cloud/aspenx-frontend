resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "website" {
  bucket = "${local.name_prefix}-website-${random_id.bucket_suffix.hex}"

  # force_destroy allows terraform destroy to succeed even if the bucket contains objects.
  force_destroy = true

  tags = {
    Name = "${local.name_prefix}-website"
  }
}

# Block all direct public access — CloudFront uses OAC (Origin Access Control) instead.
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
