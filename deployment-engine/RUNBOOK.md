# AspenX Deployment Preflight — Operator Runbook

Every Tier 1 customer deployment **must** pass static preflight before `terraform apply`.
Partial deployments leave real AWS resources in customer accounts and cause billing confusion.

---

## Validation Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STATIC VALIDATION  ←── PRIMARY GATE (required, no live AWS call needed)    │
│                                                                               │
│  • All taggable resources carry required AspenX tags         (TAG_VALIDATION)│
│  • No forbidden high-cost resources in plan                  (COST_SAFETY)   │
│  • SLR permissions present in bootstrap inline policy        (SLR check)     │
│  • No forbidden broad grants in bootstrap inline policy      (FORBIDDEN_PERMS)│
│  • All resource types are known to the catalog               (CATALOG)       │
│                                                                               │
│  RESULT: PASS_STATIC / FAIL_STATIC                                            │
│  Exit 0 = safe to apply   Exit 1 = do not apply                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LIVE SIMULATION  ←── OPTIONAL, only valid in-account                        │
│                                                                               │
│  Cross-account simulation is rejected by AWS IAM APIs.                        │
│  LIVE_SIMULATION: SKIPPED_CROSS_ACCOUNT is WARN, not a deployment block.     │
│                                                                               │
│  LIVE_SIMULATION: PASS / FAIL / SKIPPED_CROSS_ACCOUNT / SKIPPED_NO_ARN      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why cross-account IAM simulation does not work

`aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::<CUSTOMER>:role/...`
called from any account **other than the customer account** fails with:

```
An error occurred (InvalidInput) when calling the SimulatePrincipalPolicy operation:
Invalid Policy Source Arn: caller's account 908419136182 does not have access
to policies in account <CUSTOMER_ACCOUNT>
```

This is a hard AWS API constraint. The caller's account must be the same account
that owns the role. There is no IAM grant that can override this restriction.

**Preflight detects this error and downgrades to `WARN`** — it does not block
deployment, because static validation is the authoritative gate.

---

## Mandatory Pre-Apply Workflow

No AWS credentials are needed for the static check.

```bash
# ── Step 1: generate the Terraform plan ───────────────────────────────────────
# Run under the customer AspenXDeployRole (or any credentials that can plan)
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json

# ── Step 2: extract the bootstrap inline policy ───────────────────────────────
# ORDER_SUFFIX = first 8 chars of OrderId (no dashes), uppercased
# Example: OrderId 624b06c6-... → ORDER_SUFFIX = 624B06C6
aws iam get-role-policy \
    --role-name AspenXDeployRole-<ORDER_SUFFIX> \
    --policy-name AspenXSupplementalPolicy \
    --query 'PolicyDocument' \
    --output json > /tmp/inline-policy.json

# ── Step 3: run static preflight ─────────────────────────────────────────────
# No AWS credentials needed — reads tfplan.json and inline-policy.json locally
python deployment-engine/preflight.py \
    --tfplan-json tfplan.json \
    --bootstrap-policy-json /tmp/inline-policy.json

echo "Exit code: $?"   # must be 0 to proceed

# ── Step 4: apply only if exit code is 0 ─────────────────────────────────────
terraform apply tfplan
```

**Do not run `terraform apply` if preflight exits with code 1.**

---

## How to Extract the Bootstrap Inline Policy

### From the deployed bootstrap CloudFormation stack (recommended)

```bash
# From the customer account (requires iam:GetRolePolicy)
aws iam get-role-policy \
    --role-name AspenXDeployRole-<ORDER_SUFFIX> \
    --policy-name AspenXSupplementalPolicy \
    --query 'PolicyDocument' \
    --output json \
    --region us-east-1 \
    > /tmp/inline-policy.json
```

### From the canonical CloudFormation template source (for review before deploy)

```bash
# Requires PyYAML: pip install pyyaml
python3 - <<'EOF'
import yaml, json
with open("cloudformation/tier1-bootstrap.yaml") as f:
    tmpl = yaml.safe_load(f)
policy = (
    tmpl["Resources"]["AspenXDeployRole"]
        ["Properties"]["Policies"][0]
        ["PolicyDocument"]
)
print(json.dumps(policy, indent=2))
EOF > /tmp/inline-policy.json
```

---

## Preflight Modes

### Mode 1 — Tag and cost check only (no policy, no AWS credentials)
```bash
python deployment-engine/preflight.py \
    --tfplan-json tfplan.json
```
Checks: catalog coverage, tag validation, cost safety.
**Skips:** SLR check, forbidden permission scan (no policy provided).

### Mode 2 — Full static validation (recommended for Tier 1)
```bash
python deployment-engine/preflight.py \
    --tfplan-json tfplan.json \
    --bootstrap-policy-json /tmp/inline-policy.json
```
Checks everything in Mode 1 **plus**:
- SLR permissions present in inline policy with correct `iam:AWSServiceName` condition
- No forbidden broad grants (`iam:*`, `*`, `sts:*`, unconditioned `sts:AssumeRole`)

### Mode 3 — Full static + optional same-account simulation
```bash
# Only valid when --aws-profile credentials are in the SAME account as the role.
# Cross-account simulation is rejected by AWS — preflight will WARN and continue.
python deployment-engine/preflight.py \
    --tfplan-json tfplan.json \
    --bootstrap-policy-json /tmp/inline-policy.json \
    --role-arn arn:aws:iam::823714877103:role/AspenXDeployRole-624B06C6 \
    --aws-profile customer-account-admin
```
Adds live `aws iam simulate-principal-policy` on top of the static checks.

---

## Understanding the Report

```
────────────────────────────────────────────────────────────────────────────────
  AspenX Deployment Preflight Report
────────────────────────────────────────────────────────────────────────────────

  ── PLAN_ANALYSIS
    ℹ [INFO] 22 resource change(s) to validate (aws_cloudfront_distribution, ...)

  ── SERVICE_LINKED_ROLE
    ✓ [PASS] SLR permission confirmed in bootstrap policy:
             iam:CreateServiceLinkedRole (iam:AWSServiceName=rds.amazonaws.com)

  ── TAG_VALIDATION
    ✓ [PASS] All required AspenX tags present  (aws_vpc.main)
    ✗ [FAIL] Required AspenX tags missing or incorrect  (aws_db_instance.postgres)
         → missing keys: OrderId, CustomerAccountId

  ── COST_SAFETY
    ✗ [FAIL] Forbidden/high-cost resource type: aws_nat_gateway
         → NAT Gateway: ~$32/month. Prohibited in Tier 1 prototype stacks.

  ── FORBIDDEN_PERMISSIONS
    ✓ [PASS] No forbidden IAM patterns detected in bootstrap policy

  ── IAM_SIMULATION
    ⚠ [WARN] Cross-account simulation rejected by AWS — skipping (expected for Tier 1)

────────────────────────────────────────────────────────────────────────────────
  RESULT: FAIL_STATIC   static_failures=2  warnings=1
  LIVE_SIMULATION: SKIPPED_CROSS_ACCOUNT
────────────────────────────────────────────────────────────────────────────────
```

| Line | Meaning |
|------|---------|
| `RESULT: PASS_STATIC` | All static checks passed — safe to apply |
| `RESULT: FAIL_STATIC` | At least one static check failed — do not apply |
| `LIVE_SIMULATION: PASS` | In-account simulation ran and all actions allowed |
| `LIVE_SIMULATION: FAIL` | In-account simulation ran and found explicit denials |
| `LIVE_SIMULATION: SKIPPED_CROSS_ACCOUNT` | AWS rejected cross-account simulation (expected for Tier 1) |
| `LIVE_SIMULATION: SKIPPED_NO_ARN` | `--role-arn` not provided |

| Icon | Severity | Blocks static gate? |
|------|----------|---------------------|
| `✓ [PASS]` | Check passed | No |
| `ℹ [INFO]` | Informational | No |
| `⚠ [WARN]` | Review recommended | No |
| `✗ [FAIL]` | Blocking issue (static checks) | **Yes — FAIL_STATIC** |
| `? [MANUAL_REVIEW_REQUIRED]` | Needs human judgment | No |

---

## How Each Check Works

### SERVICE_LINKED_ROLE

When `--bootstrap-policy-json` is provided, the script **statically verifies** that
each SLR action required by resource types in the plan exists in the inline policy
with the correct `iam:AWSServiceName` condition. This is a **FAIL** if missing.

This is the check that would have caught the Order 624b06c6 incident:
`iam:CreateServiceLinkedRole` was absent from the bootstrap policy, causing RDS creation
to fail with `InvalidParameterValue: Unable to create the resource. Verify that you have
permission to create service linked role.`

The fix is in `cloudformation/tier1-bootstrap.yaml` v2+:
```yaml
- Sid: AllowRDSServiceLinkedRoleCreation
  Effect: Allow
  Action: iam:CreateServiceLinkedRole
  Resource: 'arn:aws:iam::*:role/aws-service-role/rds.amazonaws.com/AWSServiceRoleForRDS'
  Condition:
    StringEquals:
      iam:AWSServiceName: rds.amazonaws.com
```

### TAG_VALIDATION

Reads `tags_all` (merged result of provider `default_tags` + resource `tags`) from
tfplan.json. Checks every taggable resource for the required AspenX tags with correct
values. Non-taggable sub-resources (like `aws_s3_bucket_policy`) are skipped.

### COST_SAFETY

1. **Forbidden resource types** — `aws_nat_gateway`, `aws_eks_cluster`,
   `aws_opensearch_domain`, `aws_redshift_cluster` fail immediately.
2. **Forbidden attribute combinations** — `multi_az=true` on `aws_db_instance`,
   high-cost instance class prefixes (`db.r5.*`, `db.m5.*`, etc.).

### FORBIDDEN_PERMISSIONS

Scans every `Effect: Allow` statement for patterns that should never appear
in `AspenXDeployRole`:

| Pattern | Why |
|---------|-----|
| `*` | Full AWS access |
| `iam:*` | Unrestricted IAM; only scoped SLR grants are permitted |
| `sts:*` | Unrestricted STS |
| `sts:AssumeRole` without `Condition` | Role chaining without guard |

### IAM_SIMULATION (optional)

Calls `aws iam simulate-principal-policy` in batches. Only valid in-account.
Cross-account attempts produce `SKIPPED_CROSS_ACCOUNT` — this is expected behavior
for Tier 1 and is **not** a deployment block. Only explicit `implicitDeny` or
`explicitDeny` results from a successful in-account simulation produce `FAIL`.

---

## Recovering from a Partially-Applied Deployment

```bash
# 1. Find all resources that were created (by AspenX tags)
aws resourcegroupstaggingapi get-resources \
    --tag-filters Key=OrderId,Values=<order-id> \
    --region us-east-1 \
    --output table

# 2. Check Terraform state
terraform state list

# 3. Fix the root cause (update bootstrap CFN stack if IAM, fix .tf if config)

# 4. Re-run static preflight after the fix
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json
python deployment-engine/preflight.py \
    --tfplan-json tfplan.json \
    --bootstrap-policy-json /tmp/inline-policy.json

# 5. Re-apply — Terraform only creates the missing resources
terraform apply tfplan
```

---

## Updating the Bootstrap CloudFormation Stack

When preflight reports a missing SLR or forbidden permission:

```bash
aws cloudformation update-stack \
    --stack-name AspenXBootstrap \
    --template-body file://cloudformation/tier1-bootstrap.yaml \
    --parameters \
        ParameterKey=AspenXPrincipalAccountId,UsePreviousValue=true \
        ParameterKey=ExternalId,UsePreviousValue=true \
        ParameterKey=OrderId,UsePreviousValue=true \
        ParameterKey=OrderSuffix,UsePreviousValue=true \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-east-1

aws cloudformation wait stack-update-complete \
    --stack-name AspenXBootstrap \
    --region us-east-1

# Re-extract the inline policy after the update
aws iam get-role-policy \
    --role-name AspenXDeployRole-<ORDER_SUFFIX> \
    --policy-name AspenXSupplementalPolicy \
    --query 'PolicyDocument' --output json > /tmp/inline-policy.json

# Re-run preflight with the updated policy
python deployment-engine/preflight.py \
    --tfplan-json tfplan.json \
    --bootstrap-policy-json /tmp/inline-policy.json
```

---

## Adding New Resource Types to the Catalog

When a new Terraform resource type is introduced:

1. Find required IAM actions in the [AWS Service Authorization Reference](https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html).
2. Check whether the service requires a service-linked role.
3. Add the entry to `deployment-engine/aws-service-requirements.json`.
4. Bump `catalog_version` and update `generated_date`.
5. Test: `python deployment-engine/preflight.py --tfplan-json tfplan.json`.

---

## CI Integration

```yaml
# .github/workflows/preflight.yml
name: Deployment Preflight

on:
  workflow_dispatch:
    inputs:
      order_id:
        required: true
      order_suffix:
        required: true     # first 8 chars of OrderId, no dashes, uppercased

jobs:
  preflight:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (customer role — for plan + policy extract)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.CUSTOMER_DEPLOY_ROLE_ARN }}
          aws-region: us-east-1

      - name: Terraform plan
        working-directory: terraform/orders/${{ inputs.order_id }}
        run: |
          terraform init
          terraform plan -out=tfplan
          terraform show -json tfplan > tfplan.json

      - name: Extract bootstrap inline policy
        run: |
          aws iam get-role-policy \
            --role-name AspenXDeployRole-${{ inputs.order_suffix }} \
            --policy-name AspenXSupplementalPolicy \
            --query 'PolicyDocument' --output json > /tmp/inline-policy.json

      - name: Run static preflight (no AWS credentials needed)
        run: |
          python deployment-engine/preflight.py \
            --tfplan-json terraform/orders/${{ inputs.order_id }}/tfplan.json \
            --bootstrap-policy-json /tmp/inline-policy.json
        # Exits 1 on FAIL_STATIC — blocks the workflow

      - name: Apply
        working-directory: terraform/orders/${{ inputs.order_id }}
        run: terraform apply tfplan
```

---

## Future Fully Automated Validation Architecture

The current preflight is an MVP static analyzer. As AspenX scales, the following
architecture should replace it progressively.

### Near-term: in-account simulation agent

Deploy a lightweight Lambda or ECS task into the customer account during bootstrap.
The agent holds `iam:SimulatePrincipalPolicy` on `AspenXDeployRole` and can run
simulation on demand from AspenX's control plane via an SNS/SQS trigger. Eliminates
the cross-account constraint while keeping simulation entirely within the customer's
trust boundary.

### Medium-term: ephemeral dry-run accounts

Provision throwaway AWS accounts (via AWS Organizations + Control Tower) per order.
Run the full Terraform apply against a staging account, capture the CloudTrail event
stream, and derive the exact IAM permission set actually exercised. Automatically
synthesize a least-privilege inline policy from the captured actions. This eliminates
manual catalog maintenance for new resource types.

### Medium-term: automated bootstrap policy synthesis

Derive the `AspenXSupplementalPolicy` inline statements automatically from:
1. Terraform plan → catalog lookup → required actions set
2. CloudTrail post-deploy → exact actions used → minimal supplement

The synthesized policy replaces the hand-maintained bootstrap template. The catalog
becomes a structural validator rather than an exhaustive action list.

### Medium-term: automated least-privilege expansion

Start every deployment with zero inline supplement. Run the deploy, capture each
`AccessDenied` CloudTrail event, add exactly that action to the policy, re-run.
Iterate until the deploy succeeds. Commit the final minimal policy set back to the
bootstrap catalog. This eliminates permission creep and produces provably minimal
policies.

### Longer-term: CloudTrail-driven permission discovery

Post-deploy, continuously monitor the customer's CloudTrail for all API calls made
by `AspenXDeployRole`. After each deployment cycle, produce a diff of:
- Actions called but not in the bootstrap policy (gaps to patch)
- Actions in the bootstrap policy but never called (over-grants to prune)

Auto-generate PRs to `aws-service-requirements.json` with the discovered changes.

### Longer-term: deployment canaries

Before every new Tier 1 order deploys into a customer account, first execute the
identical Terraform plan against a dedicated AspenX canary account with equivalent
managed policies. If the canary deploy fails at the IAM level, the root cause is
identified before the customer sees any error. The canary account gets destroyed
after each successful canary run.

### Longer-term: rollback safety

Wrap every `terraform apply` in a transaction-aware shell:
1. Snapshot all resource states before apply (tag + ResourceGroups snapshot)
2. Apply with structured output capture
3. On any failure: run targeted `terraform destroy` for the failed resource set only
4. Emit structured failure report with exact recovery commands

No partial state reaches the customer. Complements the tag-based manual cleanup
that already exists.

### Future: AI-supervised dual validation

Before any deployment, submit the full Terraform plan and bootstrap policy to
dual AI review (Claude + GPT-4o, independent context windows) asking each to:
- Identify any permission gaps in the bootstrap policy
- Identify any resources that contradict the order spec
- Identify any cost risks not caught by the static rules

Both models must agree on PASS for the deployment to proceed. Disagreements route
to a human operator with both models' reasoning attached. This adds a second-opinion
layer with zero additional manual overhead for routine deployments.
