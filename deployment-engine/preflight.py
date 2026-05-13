#!/usr/bin/env python3
"""
AspenX Deployment Preflight v1.2

VALIDATION MODEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Static validation is the PRIMARY, AUTHORITATIVE gate for Tier 1 deployments.
Live IAM simulation is OPTIONAL and only valid when running inside the same
AWS account as the role being checked.

WHY CROSS-ACCOUNT SIMULATION DOES NOT WORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::<CUSTOMER>:role/...
called from the AspenX account (908419136182) fails with:

  Invalid Policy Source Arn: caller's account 908419136182 does not have
  access to policies in account <CUSTOMER_ACCOUNT>

AWS does not allow cross-account IAM policy simulation. This is by design.
The preflight detects this condition and downgrades to WARN — it does not
block deployment, because static validation is the gate.

STATIC VALIDATION CHECKS (blocking)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. Catalog coverage     — all resource types are known
  2. SLR requirements     — service-linked-role actions are in bootstrap policy
  3. Tag validation       — all taggable resources carry required AspenX tags
  4. Cost safety          — no forbidden high-cost resources or configurations
  5. Forbidden perms      — bootstrap policy contains no overly-broad grants

LIVE SIMULATION (optional, same-account only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Only valid when the caller's credentials are in the SAME account as the
  role ARN. If simulation is requested and fails cross-account, preflight
  issues WARN and continues with the static result.

Usage:
  # Standard — static validation only (no AWS credentials needed)
  python deployment-engine/preflight.py \\
      --tfplan-json tfplan.json \\
      --bootstrap-policy-json inline-policy.json

  # With optional same-account simulation
  # Role: AspenXDeployRole-<ORDER_SUFFIX>
  # ORDER_SUFFIX = first 8 chars of OrderId (no dashes), uppercased
  python deployment-engine/preflight.py \\
      --tfplan-json tfplan.json \\
      --bootstrap-policy-json inline-policy.json \\
      --role-arn arn:aws:iam::823714877103:role/AspenXDeployRole-624B06C6 \\
      --aws-profile customer-account-admin

Exit codes:
  0  PASS_STATIC — static validation passed; safe to apply
  1  FAIL_STATIC — static validation failed; do not apply
  1  FAIL_SIM    — simulation ran in-account and found explicit denials
  2  ERROR       — preflight could not complete (bad arguments, missing files)
"""

from __future__ import annotations

import sys
import json
import argparse
import subprocess
import shutil
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

CATALOG_PATH = Path(__file__).parent / "aws-service-requirements.json"

RELEVANT_PLAN_ACTIONS = frozenset({"create", "update", "replace"})
SIM_BATCH_SIZE = 50

# Checks whose FAIL findings count against the static gate.
# IAM_SIMULATION is tracked separately.
STATIC_CHECK_NAMES = frozenset({
    "PLAN_ANALYSIS",
    "CATALOG_COVERAGE",
    "SERVICE_LINKED_ROLE",
    "TAG_VALIDATION",
    "COST_SAFETY",
    "FORBIDDEN_PERMISSIONS",
})

# Error text emitted by AWS when cross-account simulation is attempted
_CROSS_ACCOUNT_MARKERS = (
    "Invalid Policy Source Arn",
    "does not have access to policies in account",
)


# ─── Enums ────────────────────────────────────────────────────────────────────

class Severity(Enum):
    PASS   = "PASS"
    INFO   = "INFO"
    WARN   = "WARN"
    FAIL   = "FAIL"
    MANUAL = "MANUAL_REVIEW_REQUIRED"


class SimStatus(Enum):
    """Outcome of the optional live IAM simulation stage."""
    NOT_REQUESTED   = "SKIPPED_NO_ARN"
    CROSS_ACCOUNT   = "SKIPPED_CROSS_ACCOUNT"
    INFRA_ERROR     = "SKIPPED_INFRA_ERROR"
    PASS            = "PASS"
    FAIL            = "FAIL"


class _BatchOutcome(Enum):
    OK            = "ok"
    CROSS_ACCOUNT = "cross_account"
    ERROR         = "error"


# ─── Finding / Report ─────────────────────────────────────────────────────────

@dataclass
class Finding:
    severity: Severity
    check: str
    resource: str
    message: str
    detail: str = ""


@dataclass
class Report:
    findings: list[Finding] = field(default_factory=list)
    sim_status: SimStatus = SimStatus.NOT_REQUESTED

    def add(self, finding: Finding) -> None:
        self.findings.append(finding)

    @property
    def static_pass(self) -> bool:
        """True when no FAIL finding exists in any static check."""
        return not any(
            f.severity == Severity.FAIL and f.check in STATIC_CHECK_NAMES
            for f in self.findings
        )

    @property
    def overall_pass(self) -> bool:
        if not self.static_pass:
            return False
        if self.sim_status == SimStatus.FAIL:
            return False
        return True

    def print_report(self) -> None:
        ICONS = {
            Severity.PASS:   "✓",
            Severity.INFO:   "ℹ",
            Severity.WARN:   "⚠",
            Severity.FAIL:   "✗",
            Severity.MANUAL: "?",
        }
        BAR = "─" * 76

        print(f"\n{BAR}")
        print("  AspenX Deployment Preflight Report")
        print(BAR)

        checks: dict[str, list[Finding]] = {}
        for f in self.findings:
            checks.setdefault(f.check, []).append(f)

        for check_name, check_findings in checks.items():
            print(f"\n  ── {check_name}")
            for f in check_findings:
                icon = ICONS.get(f.severity, " ")
                loc  = f"  ({f.resource})" if f.resource else ""
                print(f"    {icon} [{f.severity.value}] {f.message}{loc}")
                if f.detail:
                    for line in f.detail.splitlines():
                        print(f"         → {line}")

        static_str = "PASS_STATIC" if self.static_pass else "FAIL_STATIC"
        total_fail = sum(
            1 for f in self.findings
            if f.severity == Severity.FAIL and f.check in STATIC_CHECK_NAMES
        )
        total_warn = sum(1 for f in self.findings if f.severity == Severity.WARN)

        print(f"\n{BAR}")
        print(f"  RESULT: {static_str}   static_failures={total_fail}  warnings={total_warn}")
        print(f"  LIVE_SIMULATION: {self.sim_status.value}")
        print(f"{BAR}\n")


# ─── File loading ──────────────────────────────────────────────────────────────

def load_json(path: str | Path, label: str) -> dict[str, Any]:
    try:
        with open(path) as fh:
            return json.load(fh)
    except FileNotFoundError:
        print(f"ERROR: {label} not found: {path}", file=sys.stderr)
        sys.exit(2)
    except json.JSONDecodeError as exc:
        print(f"ERROR: {label} is not valid JSON: {exc}", file=sys.stderr)
        sys.exit(2)


# ─── Resource extraction ───────────────────────────────────────────────────────

def extract_resources(tfplan: dict) -> list[dict]:
    result = []
    for rc in tfplan.get("resource_changes", []):
        actions = set(rc.get("change", {}).get("actions", []))
        if actions & RELEVANT_PLAN_ACTIONS:
            result.append(rc)
    return result


def attrs_of(resource: dict) -> dict:
    return resource.get("change", {}).get("after") or {}


# ─── Static check helpers ─────────────────────────────────────────────────────

def _statement_actions(stmt: dict) -> list[str]:
    actions = stmt.get("Action", [])
    return [actions] if isinstance(actions, str) else list(actions)


def _policy_allows_slr(policy_doc: dict, slr_action: str, required_service: str) -> bool:
    """
    Return True if policy_doc contains an Allow statement for slr_action whose
    Condition includes StringEquals on iam:AWSServiceName = required_service.
    """
    for stmt in policy_doc.get("Statement", []):
        if stmt.get("Effect", "Allow") != "Allow":
            continue
        if slr_action not in _statement_actions(stmt):
            continue
        service_val = (
            stmt.get("Condition", {})
                .get("StringEquals", {})
                .get("iam:AWSServiceName", "")
        )
        matches = (
            [service_val] if isinstance(service_val, str) else service_val
        )
        if required_service in matches:
            return True
    return False


# ─── Check 1: catalog coverage ────────────────────────────────────────────────

def check_catalog_coverage(resources: list[dict], catalog: dict, report: Report) -> None:
    known = set(catalog.get("resource_types", {}).keys())
    for r in resources:
        if r["type"] not in known:
            report.add(Finding(
                severity=Severity.WARN,
                check="CATALOG_COVERAGE",
                resource=r["address"],
                message=f"Resource type '{r['type']}' not in aws-service-requirements.json",
                detail="IAM actions and tag requirements cannot be verified for this type.\n"
                       "Add it to deployment-engine/aws-service-requirements.json.",
            ))


# ─── Check 2: service-linked roles ────────────────────────────────────────────

def check_service_linked_roles(
    resources: list[dict],
    catalog: dict,
    report: Report,
    policy_doc: dict | None,
) -> None:
    """
    When policy_doc is provided, verify each required SLR action actually
    appears in the inline policy with the correct AWSServiceName condition.
    This is a FAIL if missing — it was the root cause of the 624b06c6 incident.

    When policy_doc is absent, emit WARN (cannot verify statically).
    """
    type_catalog = catalog.get("resource_types", {})
    seen: set[str] = set()

    for r in resources:
        for slr in type_catalog.get(r["type"], {}).get("service_linked_roles", []):
            action  = slr["action"]
            service = (
                slr.get("condition", {})
                   .get("StringEquals", {})
                   .get("iam:AWSServiceName", "unknown")
            )
            key = f"{action}:{service}"
            if key in seen:
                continue
            seen.add(key)

            resource_arn = slr["resource"]

            if policy_doc is None:
                report.add(Finding(
                    severity=Severity.WARN,
                    check="SERVICE_LINKED_ROLE",
                    resource=r["address"],
                    message=f"SLR required: {action} (iam:AWSServiceName={service})",
                    detail=f"Cannot verify statically — provide --bootstrap-policy-json.\n"
                           f"Resource ARN: {resource_arn}\n"
                           f"Trigger: {slr.get('trigger', '')}",
                ))
            elif _policy_allows_slr(policy_doc, action, service):
                report.add(Finding(
                    severity=Severity.PASS,
                    check="SERVICE_LINKED_ROLE",
                    resource=r["address"],
                    message=f"SLR permission confirmed in bootstrap policy: "
                            f"{action} (iam:AWSServiceName={service})",
                ))
            else:
                report.add(Finding(
                    severity=Severity.FAIL,
                    check="SERVICE_LINKED_ROLE",
                    resource=r["address"],
                    message=f"SLR permission MISSING from bootstrap policy: {action}",
                    detail=f"Required: Allow {action} with Condition "
                           f"StringEquals iam:AWSServiceName={service}\n"
                           f"Resource ARN: {resource_arn}\n"
                           f"Fix: update cloudformation/tier1-bootstrap.yaml and re-deploy the bootstrap stack.\n"
                           f"Trigger: {slr.get('trigger', '')}",
                ))


# ─── Check 3: AspenX tag validation ──────────────────────────────────────────

def check_tags(resources: list[dict], catalog: dict, report: Report) -> None:
    required     = {k: v for k, v in catalog.get("required_aspenx_tags", {}).items()
                    if not k.startswith("_")}
    type_catalog = catalog.get("resource_types", {})

    for r in resources:
        if not type_catalog.get(r["type"], {}).get("taggable", False):
            continue

        after = attrs_of(r)
        tags  = after.get("tags_all") or after.get("tags")

        if tags is None:
            report.add(Finding(
                severity=Severity.WARN,
                check="TAG_VALIDATION",
                resource=r["address"],
                message="tags_all is unknown after apply — tag validation deferred",
                detail="Ensure the provider default_tags block includes all required AspenX tags.",
            ))
            continue

        missing = [k for k in required if k not in tags]
        wrong   = [
            f"{k}={tags[k]!r} (expected {v!r})"
            for k, v in required.items()
            if v is not None and tags.get(k) != v
        ]

        if missing or wrong:
            issues = []
            if missing:
                issues.append(f"missing keys: {', '.join(sorted(missing))}")
            if wrong:
                issues.append("wrong values: " + "; ".join(wrong))
            report.add(Finding(
                severity=Severity.FAIL,
                check="TAG_VALIDATION",
                resource=r["address"],
                message="Required AspenX tags missing or incorrect",
                detail="\n".join(issues),
            ))
        else:
            report.add(Finding(
                severity=Severity.PASS,
                check="TAG_VALIDATION",
                resource=r["address"],
                message="All required AspenX tags present",
            ))


# ─── Check 4: cost safety ─────────────────────────────────────────────────────

def check_high_cost(resources: list[dict], catalog: dict, report: Report) -> None:
    hc_types = catalog.get("high_cost_resource_types", {})
    hc_attrs = catalog.get("high_cost_attribute_checks", {})

    for r in resources:
        rtype = r["type"]

        if rtype in hc_types:
            info = hc_types[rtype]
            sev  = Severity.FAIL if info.get("severity") == "FAIL" else Severity.WARN
            report.add(Finding(
                severity=sev,
                check="COST_SAFETY",
                resource=r["address"],
                message=f"Forbidden/high-cost resource type: {rtype}",
                detail=info.get("reason", ""),
            ))
            continue

        if rtype not in hc_attrs:
            continue

        after  = attrs_of(r)
        checks = hc_attrs[rtype]

        if "multi_az" in checks:
            rule = checks["multi_az"]
            if after.get("multi_az") == rule["forbidden_value"]:
                sev = Severity.FAIL if rule.get("severity") == "FAIL" else Severity.WARN
                report.add(Finding(
                    severity=sev,
                    check="COST_SAFETY",
                    resource=r["address"],
                    message=f"multi_az={rule['forbidden_value']} is forbidden in prototype stacks",
                    detail=rule.get("reason", ""),
                ))

        if "forbidden_instance_class_prefixes" in checks:
            inst_key   = checks.get("instance_class_key", "instance_class")
            inst_class = after.get(inst_key, "") or ""
            for prefix in checks["forbidden_instance_class_prefixes"]:
                if inst_class.startswith(prefix):
                    allowed = checks.get("allowed_instance_class_prefixes", [])
                    sev     = Severity.FAIL if checks.get("instance_class_severity") == "FAIL" else Severity.WARN
                    report.add(Finding(
                        severity=sev,
                        check="COST_SAFETY",
                        resource=r["address"],
                        message=f"Instance class '{inst_class}' is a high-cost type",
                        detail=f"Forbidden prefix: '{prefix}'.\n"
                               f"Allowed prefixes for prototype stacks: {allowed}",
                    ))
                    break


# ─── Check 5: forbidden IAM permissions ───────────────────────────────────────

def check_forbidden_permissions(policy_doc: dict, catalog: dict, report: Report) -> None:
    """Scan inline policy for overly broad Allow statements."""
    forbidden_rules = catalog.get("forbidden_iam_patterns", [])
    statements      = policy_doc.get("Statement", [])

    found_any = False
    for stmt in statements:
        if stmt.get("Effect", "Allow") != "Allow":
            continue
        sid     = stmt.get("Sid", "(no-sid)")
        actions = _statement_actions(stmt)

        for action in actions:
            for rule in forbidden_rules:
                pattern = rule["action_pattern"]
                if action == pattern:
                    if action == "sts:AssumeRole" and stmt.get("Condition"):
                        continue
                    sev = Severity.FAIL if rule.get("severity") == "FAIL" else Severity.WARN
                    report.add(Finding(
                        severity=sev,
                        check="FORBIDDEN_PERMISSIONS",
                        resource=f"Statement Sid={sid!r}",
                        message=f"Forbidden action '{action}' found in Allow statement",
                        detail=rule.get("reason", ""),
                    ))
                    found_any = True

    if not found_any:
        report.add(Finding(
            severity=Severity.PASS,
            check="FORBIDDEN_PERMISSIONS",
            resource="",
            message="No forbidden IAM patterns detected in bootstrap policy",
        ))


# ─── Required action sets ─────────────────────────────────────────────────────

def compute_required_actions(resources: list[dict], catalog: dict) -> set[str]:
    actions      = set()
    type_catalog = catalog.get("resource_types", {})
    for r in resources:
        actions.update(type_catalog.get(r["type"], {}).get("required_iam_actions", []))
    return actions


def compute_slr_actions(resources: list[dict], catalog: dict) -> dict[str, str]:
    """Map SLR IAM action → resource ARN."""
    slr_map      = {}
    type_catalog = catalog.get("resource_types", {})
    for r in resources:
        for slr in type_catalog.get(r["type"], {}).get("service_linked_roles", []):
            slr_map[slr["action"]] = slr["resource"]
    return slr_map


# ─── Optional live IAM simulation ─────────────────────────────────────────────

def _is_cross_account_error(stderr: str) -> bool:
    return any(marker in stderr for marker in _CROSS_ACCOUNT_MARKERS)


def _simulate_batch(
    role_arn: str,
    actions: list[str],
    resource_arn: str,
    aws_profile: str | None,
) -> tuple[dict[str, str], _BatchOutcome]:
    """
    Call aws iam simulate-principal-policy for one batch.
    Returns (decisions, outcome). Only valid for same-account simulation.
    """
    cmd = ["aws"]
    if aws_profile:
        cmd += ["--profile", aws_profile]
    cmd += [
        "iam", "simulate-principal-policy",
        "--policy-source-arn", role_arn,
        "--action-names", *actions,
        "--resource-arns", resource_arn,
        "--output", "json",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    except subprocess.TimeoutExpired:
        return {}, _BatchOutcome.ERROR
    except Exception:
        return {}, _BatchOutcome.ERROR

    if result.returncode != 0:
        if _is_cross_account_error(result.stderr):
            return {}, _BatchOutcome.CROSS_ACCOUNT
        return {}, _BatchOutcome.ERROR

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        return {}, _BatchOutcome.ERROR

    return (
        {
            entry["EvalActionName"]: entry["EvalDecision"]
            for entry in data.get("EvaluationResults", [])
        },
        _BatchOutcome.OK,
    )


def run_iam_simulation(
    role_arn: str,
    required_actions: set[str],
    slr_actions: dict[str, str],
    aws_profile: str | None,
    report: Report,
) -> None:
    """
    Optional same-account IAM simulation. Sets report.sim_status.

    CROSS_ACCOUNT failures are downgraded to WARN — static validation is the gate.
    Only explicit DENY results from a successful simulation produce sim_status=FAIL.

    AWS limitation: simulate-principal-policy is rejected when the caller's account
    differs from the role's account. This function detects that condition and exits
    cleanly with SimStatus.CROSS_ACCOUNT rather than blocking deployment.
    """
    if not shutil.which("aws"):
        report.add(Finding(
            severity=Severity.WARN,
            check="IAM_SIMULATION",
            resource="",
            message="AWS CLI not found — live simulation skipped (static validation is the gate)",
            detail="Install awscli v2 if you want optional same-account simulation.",
        ))
        report.sim_status = SimStatus.INFRA_ERROR
        return

    all_decisions: dict[str, str] = {}
    infra_errors: list[str]       = []

    # Regular actions against wildcard resource
    regular_actions = sorted(required_actions - set(slr_actions.keys()))
    for i in range(0, len(regular_actions), SIM_BATCH_SIZE):
        batch = regular_actions[i:i + SIM_BATCH_SIZE]
        decisions, outcome = _simulate_batch(role_arn, batch, "*", aws_profile)
        if outcome == _BatchOutcome.CROSS_ACCOUNT:
            report.add(Finding(
                severity=Severity.WARN,
                check="IAM_SIMULATION",
                resource=role_arn,
                message="Cross-account simulation rejected by AWS — skipping (expected for Tier 1)",
                detail="AWS does not allow simulate-principal-policy when the caller's account\n"
                       "differs from the role's account. This is a hard AWS API limitation.\n"
                       "Static validation (--bootstrap-policy-json) is the authoritative gate.\n"
                       "To run live simulation, assume the customer role first and run preflight\n"
                       "from within the customer account.",
            ))
            report.sim_status = SimStatus.CROSS_ACCOUNT
            return
        if outcome == _BatchOutcome.ERROR:
            infra_errors.append(f"batch starting at index {i}")
        else:
            all_decisions.update(decisions)

    # SLR actions against their specific resource ARN
    for action, resource_arn in slr_actions.items():
        decisions, outcome = _simulate_batch(role_arn, [action], resource_arn, aws_profile)
        if outcome == _BatchOutcome.CROSS_ACCOUNT:
            report.add(Finding(
                severity=Severity.WARN,
                check="IAM_SIMULATION",
                resource=role_arn,
                message="Cross-account simulation rejected by AWS — skipping (expected for Tier 1)",
                detail="See above for explanation.",
            ))
            report.sim_status = SimStatus.CROSS_ACCOUNT
            return
        if outcome == _BatchOutcome.ERROR:
            infra_errors.append(f"SLR action {action}")
        else:
            all_decisions.update(decisions)

    if infra_errors:
        report.add(Finding(
            severity=Severity.WARN,
            check="IAM_SIMULATION",
            resource=role_arn,
            message=f"Simulation infrastructure errors on {len(infra_errors)} batch(es) — partial results only",
            detail="Affected: " + ", ".join(infra_errors),
        ))

    if not all_decisions:
        report.add(Finding(
            severity=Severity.WARN,
            check="IAM_SIMULATION",
            resource=role_arn,
            message="No simulation results returned — check credentials and role ARN",
            detail="Ensure the caller's credentials are in the SAME account as the role ARN.\n"
                   "Static validation is the authoritative gate.",
        ))
        report.sim_status = SimStatus.INFRA_ERROR
        return

    # Evaluate results — explicit denials become FAIL
    denied  = sorted(a for a, d in all_decisions.items() if d != "allowed")
    allowed = sum(1 for d in all_decisions.values() if d == "allowed")

    for action in denied:
        decision = all_decisions[action]
        report.add(Finding(
            severity=Severity.FAIL,
            check="IAM_SIMULATION",
            resource=role_arn,
            message=f"Action DENIED by role: {action}  [{decision}]",
            detail="Add this action to the bootstrap CloudFormation inline policy.",
        ))

    if allowed:
        report.add(Finding(
            severity=Severity.PASS,
            check="IAM_SIMULATION",
            resource=role_arn,
            message=f"{allowed} of {len(all_decisions)} actions allowed by the role",
        ))

    not_simulated = (required_actions | set(slr_actions)) - set(all_decisions)
    if not_simulated:
        report.add(Finding(
            severity=Severity.MANUAL,
            check="IAM_SIMULATION",
            resource=role_arn,
            message=f"{len(not_simulated)} action(s) not returned by simulation — manual review",
            detail="Actions: " + ", ".join(sorted(not_simulated)[:15]) +
                   ("\n(truncated)" if len(not_simulated) > 15 else "") +
                   "\nS3 and CloudFront actions may behave differently against '*' resource ARN.",
        ))

    report.sim_status = SimStatus.FAIL if denied else SimStatus.PASS


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="preflight.py",
        description="AspenX Deployment Preflight v1.2 — static validation is the authoritative gate.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
mandatory workflow (Tier 1 MVP):
  # No AWS credentials needed for static validation
  terraform plan -out=tfplan
  terraform show -json tfplan > tfplan.json

  # Extract inline policy from the deployed bootstrap stack
  aws iam get-role-policy \\
      --role-name AspenXDeployRole-<ORDER_SUFFIX> \\
      --policy-name AspenXSupplementalPolicy \\
      --query 'PolicyDocument' --output json > /tmp/inline-policy.json

  # Run static preflight — this is the gate
  python deployment-engine/preflight.py \\
      --tfplan-json tfplan.json \\
      --bootstrap-policy-json /tmp/inline-policy.json

  # Apply only if exit code is 0 (PASS_STATIC)
  terraform apply tfplan

optional same-account simulation (future / advanced):
  # Must be run from inside the customer account with credentials that hold
  # iam:SimulatePrincipalPolicy. Cross-account simulation is rejected by AWS.
  python deployment-engine/preflight.py \\
      --tfplan-json tfplan.json \\
      --bootstrap-policy-json /tmp/inline-policy.json \\
      --role-arn arn:aws:iam::<customer-account>:role/AspenXDeployRole-<ORDER_SUFFIX> \\
      --aws-profile customer-account-admin

exit codes:
  0  PASS_STATIC — safe to apply
  1  FAIL_STATIC — static validation failed; do not apply
  1  FAIL_SIM    — simulation ran in-account and found explicit denials
  2  ERROR       — preflight could not complete
""",
    )
    parser.add_argument(
        "--tfplan-json", required=True,
        help="Path to tfplan.json (from: terraform show -json tfplan > tfplan.json)",
    )
    parser.add_argument(
        "--bootstrap-policy-json",
        help="Path to the inline IAM policy JSON extracted from the deployed bootstrap stack. "
             "This is the PRIMARY static validation input. Extract with: "
             "aws iam get-role-policy --role-name AspenXDeployRole-<SUFFIX> "
             "--policy-name AspenXSupplementalPolicy --query PolicyDocument --output json",
    )
    parser.add_argument(
        "--role-arn",
        help="OPTIONAL. ARN of AspenXDeployRole-<ORDER_SUFFIX> for live IAM simulation. "
             "Only works when called from within the SAME AWS account as the role. "
             "Cross-account simulation is rejected by AWS — preflight will WARN and continue. "
             "Static validation (--bootstrap-policy-json) remains the gate regardless.",
    )
    parser.add_argument(
        "--aws-profile",
        help="AWS CLI profile for live simulation. Must be credentials in the SAME account "
             "as --role-arn. Cross-account profiles will trigger the cross-account rejection.",
    )
    parser.add_argument(
        "--catalog", default=str(CATALOG_PATH),
        help=f"Path to aws-service-requirements.json (default: {CATALOG_PATH})",
    )
    args = parser.parse_args()

    catalog = load_json(args.catalog, "requirements catalog")
    tfplan  = load_json(args.tfplan_json, "tfplan.json")
    policy  = load_json(args.bootstrap_policy_json, "bootstrap policy JSON") \
              if args.bootstrap_policy_json else None

    report    = Report()
    resources = extract_resources(tfplan)

    if not resources:
        report.add(Finding(
            severity=Severity.INFO,
            check="PLAN_ANALYSIS",
            resource="",
            message="No resource creates/updates/replacements in this plan — nothing to preflight.",
        ))
        report.print_report()
        sys.exit(0)

    report.add(Finding(
        severity=Severity.INFO,
        check="PLAN_ANALYSIS",
        resource="",
        message=f"{len(resources)} resource change(s) to validate "
                f"({', '.join(sorted({r['type'] for r in resources}))})",
    ))

    # ── Static checks (blocking gate) ─────────────────────────────────────────
    check_catalog_coverage(resources, catalog, report)
    check_service_linked_roles(resources, catalog, report, policy)
    check_tags(resources, catalog, report)
    check_high_cost(resources, catalog, report)

    if policy:
        check_forbidden_permissions(policy, catalog, report)
    else:
        report.add(Finding(
            severity=Severity.WARN,
            check="FORBIDDEN_PERMISSIONS",
            resource="",
            message="--bootstrap-policy-json not provided — forbidden-permission scan skipped",
            detail="Provide --bootstrap-policy-json to validate the inline policy statically.\n"
                   "SLR permissions and forbidden grant patterns cannot be verified without it.",
        ))

    # ── Optional live simulation (non-blocking for infrastructure failures) ────
    required_actions = compute_required_actions(resources, catalog)
    slr_actions      = compute_slr_actions(resources, catalog)

    if args.role_arn:
        run_iam_simulation(
            args.role_arn, required_actions, slr_actions,
            args.aws_profile, report,
        )
    else:
        report.add(Finding(
            severity=Severity.INFO,
            check="IAM_SIMULATION",
            resource="",
            message="--role-arn not provided — live simulation not requested",
            detail="Static validation is the gate for Tier 1 MVP deployments.\n"
                   "Live simulation is optional and only works same-account.",
        ))
        report.sim_status = SimStatus.NOT_REQUESTED

    report.print_report()
    sys.exit(0 if report.overall_pass else 1)


if __name__ == "__main__":
    main()
