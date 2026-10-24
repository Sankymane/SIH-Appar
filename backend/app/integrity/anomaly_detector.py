"""
Module: src/anomaly_detector.py
Component: Statistical Anomaly Engine
Purpose: Detect admission syndicates, geographic/pin-code clustering, merit cutoff outliers,
and compute multi-factor composite risk scores for student records and institutions.
"""

from typing import List, Dict, Tuple, Any
from collections import Counter, defaultdict
import numpy as np
from .schema import (
    StudentEnrollmentRecord,
    ViolationDetail,
    ViolationSeverity,
    RiskLevel,
    QuotaCategory,
)


class StatisticalAnomalyEngine:
    def __init__(
        self,
        contact_reuse_threshold: int = 3,
        pin_code_concentration_threshold: float = 0.25,
        min_cohort_size_for_stats: int = 10,
        z_score_cutoff_threshold: float = -2.5,
    ):
        self.contact_reuse_threshold = contact_reuse_threshold
        self.pin_code_concentration_threshold = pin_code_concentration_threshold
        self.min_cohort_size_for_stats = min_cohort_size_for_stats
        self.z_score_cutoff_threshold = z_score_cutoff_threshold

    def analyze_batch_anomalies(
        self, records: List[StudentEnrollmentRecord]
    ) -> Tuple[Dict[str, List[ViolationDetail]], List[Dict[str, Any]]]:
        """
        Runs statistical tests across the entire uploaded batch.
        Returns:
            - record_violations: mapping of record_id -> List[ViolationDetail]
            - anomaly_clusters: summary metadata on detected cluster syndicates
        """
        record_violations: Dict[str, List[ViolationDetail]] = defaultdict(list)
        anomaly_clusters: List[Dict[str, Any]] = []

        if not records:
            return record_violations, anomaly_clusters

        # -------------------------------------------------------------
        # 1. Contact Reuse Syndicate Detection (Phone & Email)
        # -------------------------------------------------------------
        phone_map = defaultdict(list)
        email_map = defaultdict(list)

        for r in records:
            if r.student_phone and len(r.student_phone.strip()) >= 10:
                phone_clean = "".join(filter(str.isdigit, r.student_phone))[-10:]
                phone_map[phone_clean].append(r)
            if r.student_email and "@" in r.student_email:
                email_clean = r.student_email.strip().lower()
                email_map[email_clean].append(r)

        # Flag phones shared by >= threshold distinct students
        for phone, shared_recs in phone_map.items():
            distinct_apaars = {rec.apaar_id for rec in shared_recs}
            if len(distinct_apaars) >= self.contact_reuse_threshold:
                cluster_desc = {
                    "type": "PHONE_SYNDICATE_CLUSTER",
                    "phone": phone,
                    "affected_students_count": len(distinct_apaars),
                    "apaar_ids": list(distinct_apaars),
                    "record_ids": [x.record_id for x in shared_recs],
                }
                anomaly_clusters.append(cluster_desc)
                
                for rec in shared_recs:
                    record_violations[rec.record_id].append(
                        ViolationDetail(
                            layer="L5_STATISTICAL",
                            rule_code="ANOMALY_CONTACT_REUSE_SYNDICATE",
                            severity=ViolationSeverity.HIGH,
                            message=(
                                f"Agent Syndicate Signature: Phone number '{phone}' shared across {len(distinct_apaars)} "
                                f"distinct student applications. High likelihood of unauthorized broker/middleman pool."
                            ),
                            remediation="Require biometric/OTP re-verification on student's personal Aadhaar-linked mobile.",
                            metadata={"shared_phone": phone, "cluster_size": len(distinct_apaars)},
                        )
                    )

        # Flag emails shared by >= threshold distinct students
        for email, shared_recs in email_map.items():
            distinct_apaars = {rec.apaar_id for rec in shared_recs}
            if len(distinct_apaars) >= self.contact_reuse_threshold:
                for rec in shared_recs:
                    record_violations[rec.record_id].append(
                        ViolationDetail(
                            layer="L5_STATISTICAL",
                            rule_code="ANOMALY_EMAIL_REUSE_SYNDICATE",
                            severity=ViolationSeverity.HIGH,
                            message=(
                                f"Agent Syndicate Signature: Email '{email}' shared across {len(distinct_apaars)} "
                                f"distinct student applications."
                            ),
                            remediation="Mandate individual student email verification with institutional domain or personal account.",
                            metadata={"shared_email": email, "cluster_size": len(distinct_apaars)},
                        )
                    )

        # -------------------------------------------------------------
        # 2. Geographic PIN Code Spatial Concentration Anomaly
        # -------------------------------------------------------------
        if len(records) >= self.min_cohort_size_for_stats:
            pin_counts = Counter(r.pin_code for r in records if r.pin_code)
            total_with_pin = sum(pin_counts.values())

            for pin, count in pin_counts.items():
                ratio = count / total_with_pin
                if ratio >= self.pin_code_concentration_threshold and count >= 4:
                    cluster_desc = {
                        "type": "GEOGRAPHIC_PIN_CONCENTRATION",
                        "pin_code": pin,
                        "admissions_count": count,
                        "cohort_percentage": round(ratio * 100, 2),
                    }
                    anomaly_clusters.append(cluster_desc)
                    
                    for r in records:
                        if r.pin_code == pin:
                            record_violations[r.record_id].append(
                                ViolationDetail(
                                    layer="L5_STATISTICAL",
                                    rule_code="ANOMALY_SPATIAL_PIN_CONCENTRATION",
                                    severity=ViolationSeverity.WARNING,
                                    message=(
                                        f"High Geographic Concentration: PIN code {pin} accounts for {count} ({ratio*100:.1f}%) "
                                        f"of all batch admissions. Potential localized coaching syndicate or synthetic demographic entry."
                                    ),
                                    remediation="Conduct physical domicile and residential address verification during inspection.",
                                    metadata={"pin_code": pin, "concentration_pct": round(ratio * 100, 1)},
                                )
                            )

        # -------------------------------------------------------------
        # 3. Entrance Merit Score Outlier Analysis
        # -------------------------------------------------------------
        # Group by program_code to establish cohort distribution
        program_scores = defaultdict(list)
        for r in records:
            if r.percentile_score is not None and r.quota_category == QuotaCategory.OPEN:
                program_scores[r.program_code].append((r.record_id, r.percentile_score))

        for prog, score_tuples in program_scores.items():
            if len(score_tuples) >= self.min_cohort_size_for_stats:
                scores = np.array([s for _, s in score_tuples])
                mean_score = np.mean(scores)
                std_score = np.std(scores)

                if std_score > 0:
                    for rec_id, score in score_tuples:
                        z_score = (score - mean_score) / std_score
                        # If student score is an extreme negative outlier in Open quota
                        if z_score <= self.z_score_cutoff_threshold or (mean_score >= 75.0 and score < 15.0):
                            record_violations[rec_id].append(
                                ViolationDetail(
                                    layer="L5_STATISTICAL",
                                    rule_code="ANOMALY_MERIT_CUTOFF_OUTLIER",
                                    severity=ViolationSeverity.HIGH,
                                    message=(
                                        f"Merit Cutoff Outlier: Open category candidate admitted with {score:.1f}%ile "
                                        f"(Z-score: {z_score:.2f}) while program '{prog}' cohort mean is {mean_score:.1f}%ile. "
                                        f"Potential unregularized management quota or seat manipulation."
                                    ),
                                    remediation="Audit merit rank allotment sheet and Central Allotment Process (CAP) round allotment.",
                                    metadata={"student_score": score, "cohort_mean": round(mean_score, 2), "z_score": round(z_score, 2)},
                                )
                            )

        return record_violations, anomaly_clusters

    @staticmethod
    def calculate_composite_risk_score(violations: List[ViolationDetail]) -> Tuple[float, RiskLevel, Dict[str, float]]:
        """
        Calculates a multi-factor composite risk score (0.0 to 100.0) from layer violations.
        Weights reflect regulatory severity under AICTE Approval Process norms.
        """
        weights = {
            # L1 Format (12 digits)
            "RULE_APAAR_INVALID_FORMAT": 30.0,
            # L2 Identity
            "RULE_GHOST_APAAR_NOT_FOUND": 50.0,
            "RULE_APAAR_DEACTIVATED": 60.0,
            "RULE_APAAR_FRAUD_WATCHLIST": 70.0,
            "RULE_DEMOGRAPHIC_NAME_MISMATCH": 25.0,
            "RULE_DEMOGRAPHIC_DOB_MISMATCH": 25.0,
            "RULE_DEMOGRAPHIC_GENDER_MISMATCH": 20.0,
            "RULE_DEMOGRAPHIC_NAME_MINOR_VARIATION": 5.0,
            # L3 Intake Capacity
            "RULE_REGULAR_INTAKE_EXCEEDED": 40.0,
            "RULE_TFW_CEILING_BREACHED": 20.0,
            "RULE_EWS_CEILING_BREACHED": 20.0,
            "RULE_EWS_INCOME_INELIGIBLE": 45.0,
            "RULE_LATERAL_CEILING_BREACHED": 20.0,
            "RULE_PMSSS_CEILING_BREACHED": 20.0,
            "RULE_NRI_CEILING_BREACHED": 20.0,
            "RULE_UNAPPROVED_PROGRAM_INTAKE": 50.0,
            # L4 Concurrency
            "RULE_CONCURRENT_FULLTIME_ENROLLMENT": 60.0,
            "RULE_INTRA_BATCH_DUPLICATE_SUBMISSION": 25.0,
            "RULE_INTRA_BATCH_SIMULTANEOUS_PROGRAMS": 40.0,
            "INFO_DUAL_DEGREE_ODL_PERMITTED": 0.0,
            # L5 Statistical
            "ANOMALY_CONTACT_REUSE_SYNDICATE": 25.0,
            "ANOMALY_EMAIL_REUSE_SYNDICATE": 20.0,
            "ANOMALY_SPATIAL_PIN_CONCENTRATION": 15.0,
            "ANOMALY_MERIT_CUTOFF_OUTLIER": 25.0,
        }

        layer_scores: Dict[str, float] = defaultdict(float)
        raw_total = 0.0

        for v in violations:
            pts = weights.get(v.rule_code, 15.0)
            raw_total += pts
            layer_scores[v.layer] += pts

        # Clamped between 0.0 and 100.0
        final_score = min(100.0, round(raw_total, 2))

        if final_score <= 25.0:
            risk_level = RiskLevel.LOW
        elif final_score <= 50.0:
            risk_level = RiskLevel.MEDIUM
        elif final_score <= 75.0:
            risk_level = RiskLevel.HIGH
        else:
            risk_level = RiskLevel.CRITICAL

        return final_score, risk_level, dict(layer_scores)
