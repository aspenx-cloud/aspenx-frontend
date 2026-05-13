terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Recommended: uncomment and configure a remote backend before applying in production.
  # backend "s3" {
  #   bucket = "<your-tf-state-bucket>"
  #   key    = "aspenx/orders/624b06c6-729b-41ce-9485-a27409cf5bee/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.region

  # Default tags applied to every taggable resource.
  # Resources also add an explicit Name tag where useful.
  default_tags {
    tags = {
      ManagedBy         = "AspenX"
      Project           = "AspenX"
      OrderId           = var.order_id
      CustomerAccountId = var.customer_account_id
      AspenXTier        = "Tier1"
      AspenXRegion      = var.region
      AspenXStack       = "static-website-postgres-prototype"
      Environment       = "customer"
      Owner             = "customer"
      CreatedBy         = "AspenX"
    }
  }
}
