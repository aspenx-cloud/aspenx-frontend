# AspenX Tier 1 — Order 624b06c6 — Deployment Runbook

**Order ID:** `624b06c6-729b-41ce-9485-a27409cf5bee`  
**Customer Account:** `823714877103`  
**Region:** `us-east-1`  
**Stack:** Static Website + PostgreSQL + HTTPS — Prototype (0–100 users)  
**Tier:** Tier 1 (deployed into customer AWS account)

---

## Architecture

```
Internet
   │
   ▼
CloudFront (HTTPS)  ──────────────────────────────────────────────┐
   │  PriceClass_100 (US/EU/CA)                                    │
   │  OAC (sigv4)                                                  │
   ▼                                                               │
S3 Bucket (private)     VPC 10.0.0.0/16                           │
   static website files                                            │
                         PUBLIC SUBNETS (route → IGW)             │
                         ├── public-1  10.0.0.0/24  us-east-1a  ◄─┘
                         └── public-2  10.0.1.0/24  us-east-1b

                         PRIVATE DB SUBNETS (local route only, no IGW)
                         ├── private-db-1  10.0.10.0/24  us-east-1a
                         └── private-db-2  10.0.11.0/24  us-east-1b
                                  │
                                  ▼
                             RDS PostgreSQL 16.3
                             db.t3.micro · single-AZ
                             publicly_accessible = false
                             Security group: VPC CIDR only
                             No internet path at subnet or instance level
```

**Domain (optional):** If `domain_name` is set, ACM certificate + Route53 alias records are created automatically.

---

## AWS Resources Created

| Resource | Name Pattern | Estimated Cost |
|---|---|---|
| VPC | `aspenx-tier1-624b06c6-vpc` | Free |
| Public Subnets × 2 | `aspenx-tier1-624b06c6-public-1/2` | Free |
| Private DB Subnets × 2 | `aspenx-tier1-624b06c6-private-db-1/2` | Free |
| Internet Gateway | `aspenx-tier1-624b06c6-igw` | Free |
| Route Tables × 2 | public-rt + private-rt | Free |
| S3 Bucket | `aspenx-tier1-624b06c6-website-<rand>` | ~$0.01/mo |
| CloudFront Distribution | `aspenx-tier1-624b06c6-cloudfront` | ~$0/mo (prototype traffic) |
| ACM Certificate | `aspenx-tier1-624b06c6-cert` | Free (if domain set) |
| Route53 Records × 3 | apex + www + validation | ~$0.50/mo (if domain set) |
| RDS Security Group | `aspenx-tier1-624b06c6-rds-sg` | Free |
| RDS Subnet Group | `aspenx-tier1-624b06c6-db-subnet-group` | Free |
| RDS PostgreSQL | `aspenx-tier1-624b06c6-postgres` | ~$14/mo |
| CloudWatch Alarms × 5 | `aspenx-tier1-624b06c6-*` | ~$0.50/mo |

**Total estimated: ~$14–17/month** (no cost change from subnet redesign — private subnets and route tables are free)

---

## Prerequisites

1. **Terraform >= 1.5.0** — `terraform -version`
2. **AWS credentials** configured with the permissions listed below.
3. **AWS CLI** installed for tag-based cleanup commands.
4. (If using a custom domain) **Route53 hosted zone** for `var.domain_name` must already exist in the target account.

### Minimum Required IAM Permissions

The IAM principal running Terraform (the `AspenXDeployRole` created by the bootstrap CloudFormation stack) needs the following AWS managed policies **plus the inline supplemental policy** described below.

**AWS managed policies:**

- `AmazonVPCFullAccess`
- `AmazonS3FullAccess`
- `CloudFrontFullAccess`
- `AmazonRDSFullAccess`
- `CloudWatchFullAccess`
- `AWSCertificateManagerFullAccess` *(only if using a custom domain)*
- `AmazonRoute53FullAccess` *(only if using a custom domain)*

**Required inline supplement — RDS service-linked role:**

`AmazonRDSFullAccess` does **not** include `iam:CreateServiceLinkedRole`. On first RDS deployment in an account where the `AWSServiceRoleForRDS` service-linked role does not yet exist, RDS creation will fail with:

```
InvalidParameterValue: Unable to create the resource. Verify that you have
permission to create service linked role.
```

The bootstrap CloudFormation stack (`cloudformation/tier1-bootstrap.yaml`) adds this statement via its inline `AspenXSupplementalPolicy`:

```json
{
  "Sid": "AllowRDSServiceLinkedRoleCreation",
  "Effect": "Allow",
  "Action": "iam:CreateServiceLinkedRole",
  "Resource": "arn:aws:iam::*:role/aws-service-role/rds.amazonaws.com/AWSServiceRoleForRDS",
  "Condition": {
    "StringEquals": {
      "iam:AWSServiceName": "rds.amazonaws.com"
    }
  }
}
```

This SLR is created once per account. Subsequent Terraform runs skip this API call if the SLR already exists — the permission is safe to leave in place.

> **Note:** Do NOT use `AdministratorAccess`. Do NOT grant broad `iam:*`. The inline statement above is the minimum IAM grant needed beyond the managed policies.

---

## Quick Start

### 1. Configure variables

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — at minimum, set db_password
```

Alternatively, export the password as an environment variable to avoid storing it on disk:

```bash
export TF_VAR_db_password="your-strong-password-here"
```

### 2. Initialize Terraform

```bash
terraform init
```

This downloads the AWS and random providers. The lock file (`.terraform.lock.hcl`) should be committed to source control after the first init.

### 3. Plan

Review all resources that will be created before applying:

```bash
terraform plan -out=tfplan
```

Inspect the plan carefully. Verify:
- Resource count matches the table above (~17–22 resources depending on domain)
- No unexpected expensive resources (no NAT Gateway, no Multi-AZ RDS, no EKS/ECS)
- All resources show `+ create` (no unexpected replacements on re-applies)

### 4. Apply

```bash
terraform apply tfplan
```

Or, to plan and apply in one step:

```bash
terraform apply
```

Apply takes approximately **5–15 minutes**. The longest steps are:
- RDS instance creation: ~5–10 minutes
- ACM certificate validation (if domain set): ~5 minutes
- CloudFront distribution propagation: ~5–10 minutes

After apply completes, Terraform prints all outputs. Save these — the RDS endpoint and CloudFront URL are needed for application configuration.

### 5. Upload your static site

```bash
aws s3 sync ./dist/ s3://$(terraform output -raw website_bucket_name)/ --delete
```

Invalidate the CloudFront cache after each deploy:

```bash
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

---

## Variables Reference

| Variable | Default | Required | Description |
|---|---|---|---|
| `order_id` | `624b06c6-...` | No | AspenX order ID |
| `customer_account_id` | `823714877103` | No | Customer AWS account ID |
| `region` | `us-east-1` | No | AWS region (locked to us-east-1) |
| `project_name` | `aspenx-tier1` | No | Short name prefix for resources |
| `domain_name` | `""` | No | Custom domain — leave empty to skip ACM/Route53 |
| `db_username` | `aspenxadmin` | No | RDS master username |
| `db_password` | *(none)* | **Yes** | RDS master password (min 16 chars, sensitive) |
| `db_instance_class` | `db.t3.micro` | No | RDS instance class (locked to t3 micro/small/medium) |
| `db_allocated_storage` | `20` | No | RDS storage in GB (20–100) |

---

## Outputs Reference

After `terraform apply`, outputs are accessible via `terraform output`:

| Output | Description |
|---|---|
| `website_bucket_name` | S3 bucket name — upload site files here |
| `website_bucket_arn` | S3 bucket ARN |
| `cloudfront_distribution_id` | CloudFront ID — use for cache invalidations |
| `cloudfront_url` | HTTPS URL via CloudFront domain |
| `custom_domain_url` | HTTPS URL via custom domain (if configured) |
| `rds_endpoint` | `host:port` — connect from within the VPC |
| `rds_db_name` | Initial database name (`aspenxdb`) |
| `rds_username` | RDS master username |
| `vpc_id` | VPC ID |
| `subnet_ids` | List of subnet IDs |
| `rds_security_group_id` | RDS security group — add ingress rules for app access |
| `tag_filter_command` | AWS CLI command to list all tagged resources |
| `order_id` | This deployment's order ID |

---

## Resource Tags

Every taggable resource includes these tags (applied via `provider default_tags` plus explicit resource tags):

| Tag | Value |
|---|---|
| `ManagedBy` | `AspenX` |
| `Project` | `AspenX` |
| `OrderId` | `624b06c6-729b-41ce-9485-a27409cf5bee` |
| `CustomerAccountId` | `823714877103` |
| `AspenXTier` | `Tier1` |
| `AspenXRegion` | `us-east-1` |
| `AspenXStack` | `static-website-postgres-prototype` |
| `Environment` | `customer` |
| `Owner` | `customer` |
| `CreatedBy` | `AspenX` |

---

## Destroying / Cleanup

### Option A — terraform destroy (preferred)

```bash
terraform destroy
```

This removes all resources in the correct dependency order. It will:
- Delete the CloudFront distribution (may take 5–10 minutes)
- Delete the RDS instance (no final snapshot — prototype config)
- Empty and delete the S3 bucket (`force_destroy = true`)
- Delete the VPC and all networking

> **Warning:** `terraform destroy` is **irreversible**. All data in RDS and S3 will be permanently deleted.

### Option B — Manual cleanup by tags (if destroy fails or state is lost)

Use the tag filter command from Terraform outputs to find all resources:

```bash
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=OrderId,Values=624b06c6-729b-41ce-9485-a27409cf5bee \
  --region us-east-1 \
  --output table
```

Then delete resources manually in this order (reverse dependency order):

1. **CloudWatch Alarms** — `aws cloudwatch delete-alarms --alarm-names <names>`
2. **CloudFront Distribution** — disable first, then delete (takes ~15 min)
3. **ACM Certificate** — `aws acm delete-certificate --certificate-arn <arn>`
4. **Route53 Records** — delete validation + alias records
5. **S3 Bucket** — empty first: `aws s3 rm s3://<bucket> --recursive`, then `aws s3api delete-bucket --bucket <bucket>`
6. **RDS Instance** — `aws rds delete-db-instance --db-instance-identifier aspenx-tier1-624b06c6-postgres --skip-final-snapshot`
7. **RDS Subnet Group** — `aws rds delete-db-subnet-group --db-subnet-group-name aspenx-tier1-624b06c6-db-subnet-group`
8. **Security Group** — `aws ec2 delete-security-group --group-id <sg-id>`
9. **Route Table Associations** — disassociate first
10. **Route Table** — `aws ec2 delete-route-table --route-table-id <rtb-id>`
11. **Internet Gateway** — detach then delete
12. **Subnets** × 2 — `aws ec2 delete-subnet --subnet-id <id>`
13. **VPC** — `aws ec2 delete-vpc --vpc-id <id>`

---

## Risks and Assumptions

### Risks

| Risk | Severity | Mitigation |
|---|---|---|
| RDS password stored in Terraform state | Medium | Use remote state with encryption (S3 + KMS). Do not use local state for long-lived deployments. |
| No final RDS snapshot on destroy | Medium | This is intentional for prototype — enable `skip_final_snapshot = false` and `deletion_protection = true` before promoting to production. |
| S3 `force_destroy = true` | Medium | Allows `terraform destroy` to delete objects. Intentional for prototype — remove for production. |
| CloudFront propagation delay | Low | New distributions take 5–10 minutes to fully propagate globally. |
| RDS in public subnets | Low | RDS has `publicly_accessible = false` and is locked to VPC CIDR via security group — not reachable from the internet. |
| ACM cert requires Route53 zone | Low | If DNS is managed externally, comment out the Route53 and `aws_acm_certificate_validation` resources and validate manually. |

### Assumptions

- Terraform state is stored locally. For shared team use, configure an S3 backend before applying.
- The RDS instance is not reachable from the internet. Application servers must be deployed inside the VPC or connected via VPN/bastion to access PostgreSQL.
- The CloudWatch alarms have no notification targets (no SNS). They will go to ALARM state but not send emails. Add an SNS topic and `alarm_actions` to receive notifications.
- PostgreSQL engine version `16.3` is current as of this writing. AWS may require a newer minor version — `auto_minor_version_upgrade = true` is enabled to handle this automatically.
- ACM certificate validation via Route53 assumes the hosted zone is in the same AWS account. Cross-account Route53 requires additional configuration.

### Not included (by design)

- NAT Gateway — not needed; no private subnet workloads
- Multi-AZ RDS — prototype spec; add `multi_az = true` for production
- ElastiCache / Redis — not in the order spec
- ECS / EKS — not in the order spec
- WAF / Shield — not in the order spec
- SNS notification targets for alarms — add manually if alerting is required
- Bastion host / VPN — customer must provide their own access method to reach RDS
