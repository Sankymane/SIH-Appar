"""
Module: src/intake_validator.py
Component: Intake Ceiling Validator
Purpose: Strict enforcement of AICTE Approval Process Handbook (APH) regulatory caps:
- Sanctioned base intake capacity
- Supernumerary quotas: Tuition Fee Waiver (TFW 5%), EWS (10%), PMSSS, Lateral Entry (10% + vacancies), NRI (15%)
- Economic eligibility criteria validation (EWS income ceiling <= INR 8,00,000)
"""

from typing import List, Dict, Tuple, Optional
from collections import defaultdict
import math
from .schema import (
    StudentEnrollmentRecord,
    InstitutionIntakeConfig,
    ViolationDetail,
    ViolationSeverity,
    EnrollmentType,
    QuotaCategory,
    ProgramUtilizationSummary,
)

EWS_INCOME_CEILING_INR = 800000.0  # 8 Lakhs per annum DoPT / AICTE standard


class IntakeCeilingValidator:
    def __init__(self, intake_configs: Optional[Dict[str, InstitutionIntakeConfig]] = None):
        # Key: (institution_id, program_code, academic_year)
        self.configs: Dict[Tuple[str, str, str], InstitutionIntakeConfig] = {}
        if intake_configs:
            for cfg in intake_configs.values():
                self.add_config(cfg)

    def add_config(self, config: InstitutionIntakeConfig):
        key = (config.institution_id, config.program_code, config.academic_year)
        self.configs[key] = config

    def get_config(
        self, institution_id: str, program_code: str, academic_year: str
    ) -> Optional[InstitutionIntakeConfig]:
        return self.configs.get((institution_id, program_code, academic_year))

    def validate_batch_intake(
        self, records: List[StudentEnrollmentRecord]
    ) -> Tuple[Dict[str, List[ViolationDetail]], Dict[str, ProgramUtilizationSummary]]:
        """
        Validates intake capacity per (institution, program, academic_year) group.
        Returns:
            - record_violations: mapping of record_id -> List[ViolationDetail]
            - summaries: mapping of program_code -> ProgramUtilizationSummary
        """
        record_violations: Dict[str, List[ViolationDetail]] = defaultdict(list)
        summaries: Dict[str, ProgramUtilizationSummary] = {}

        # Group records by (institution_id, program_code, academic_year)
        grouped_records = defaultdict(list)
        for r in records:
            key = (r.institution_id, r.program_code, r.academic_year)
            grouped_records[key].append(r)

        for (inst_id, prog_code, acad_yr), group in grouped_records.items():
            config = self.get_config(inst_id, prog_code, acad_yr)
            
            # If no AICTE config found, generate critical configuration missing violation
            if not config:
                for r in group:
                    record_violations[r.record_id].append(
                        ViolationDetail(
                            layer="L3_INTAKE",
                            rule_code="RULE_UNAPPROVED_PROGRAM_INTAKE",
                            severity=ViolationSeverity.CRITICAL,
                            message=f"No approved AICTE intake found for {inst_id} in program {prog_code} ({acad_yr}). Program may be unapproved.",
                            remediation="Submit Extension of Approval (EoA) petition to AICTE Bureau.",
                        )
                    )
                continue

            # Capacity tracking counters
            reg_count = 0
            tfw_count = 0
            ews_count = 0
            lat_count = 0
            pmsss_count = 0
            nri_count = 0

            # Sort records chronologically by admission_date to identify who entered after ceiling was breached
            sorted_group = sorted(group, key=lambda x: x.admission_date)

            for rec in sorted_group:
                # 1. Income verification for EWS candidates
                is_ews = (
                    rec.enrollment_type == EnrollmentType.SUPERNUMERARY_EWS
                    or rec.quota_category == QuotaCategory.EWS
                )
                if is_ews:
                    if rec.annual_family_income is not None and rec.annual_family_income > EWS_INCOME_CEILING_INR:
                        record_violations[rec.record_id].append(
                            ViolationDetail(
                                layer="L3_INTAKE",
                                rule_code="RULE_EWS_INCOME_INELIGIBLE",
                                severity=ViolationSeverity.CRITICAL,
                                message=f"Candidate declared EWS quota but annual family income (INR {rec.annual_family_income:,.2f}) exceeds AICTE/DoPT ceiling of INR 8,00,000.",
                                remediation="Cancel EWS reservation benefit and re-verify income certificate via Tehsildar/Revenue authority.",
                                metadata={"declared_income": rec.annual_family_income, "ceiling": EWS_INCOME_CEILING_INR},
                            )
                        )

                # 2. Categorize and check capacity limits
                if (
                    rec.enrollment_type == EnrollmentType.SUPERNUMERARY_TFW
                    or rec.quota_category == QuotaCategory.TFW
                ):
                    tfw_count += 1
                    if tfw_count > config.max_tfw_seats:
                        record_violations[rec.record_id].append(
                            ViolationDetail(
                                layer="L3_INTAKE",
                                rule_code="RULE_TFW_CEILING_BREACHED",
                                severity=ViolationSeverity.ERROR,
                                message=f"Tuition Fee Waiver (TFW) ceiling exceeded. Admitted {tfw_count}/{config.max_tfw_seats} allowed (5% cap).",
                                remediation="Convert excess TFW admissions to general pool or deregister over-allotment.",
                                metadata={"current_tfw": tfw_count, "cap": config.max_tfw_seats},
                            )
                        )
                elif (
                    rec.enrollment_type == EnrollmentType.SUPERNUMERARY_EWS
                    or rec.quota_category == QuotaCategory.EWS
                ):
                    ews_count += 1
                    if ews_count > config.max_ews_seats:
                        record_violations[rec.record_id].append(
                            ViolationDetail(
                                layer="L3_INTAKE",
                                rule_code="RULE_EWS_CEILING_BREACHED",
                                severity=ViolationSeverity.ERROR,
                                message=f"EWS supernumerary quota exceeded. Admitted {ews_count}/{config.max_ews_seats} allowed (10% cap).",
                                remediation="Rectify EWS allotment via state counseling authority.",
                                metadata={"current_ews": ews_count, "cap": config.max_ews_seats},
                            )
                        )
                elif rec.enrollment_type == EnrollmentType.LATERAL_ENTRY:
                    lat_count += 1
                    if lat_count > config.max_lateral_seats:
                        record_violations[rec.record_id].append(
                            ViolationDetail(
                                layer="L3_INTAKE",
                                rule_code="RULE_LATERAL_CEILING_BREACHED",
                                severity=ViolationSeverity.ERROR,
                                message=f"Lateral Entry ceiling exceeded. Admitted {lat_count}/{config.max_lateral_seats} allowed.",
                                remediation="Audit previous year vacancy matrix to substantiate extra lateral intake.",
                                metadata={"current_lateral": lat_count, "cap": config.max_lateral_seats},
                            )
                        )
                elif (
                    rec.enrollment_type == EnrollmentType.SUPERNUMERARY_PMSSS
                    or rec.quota_category == QuotaCategory.PMSSS
                ):
                    pmsss_count += 1
                    if pmsss_count > config.max_pmsss_seats:
                        record_violations[rec.record_id].append(
                            ViolationDetail(
                                layer="L3_INTAKE",
                                rule_code="RULE_PMSSS_CEILING_BREACHED",
                                severity=ViolationSeverity.ERROR,
                                message=f"PMSSS supernumerary ceiling exceeded. Admitted {pmsss_count}/{config.max_pmsss_seats} allowed.",
                                remediation="Verify central PMSSS counseling allotment letter issued by AICTE J&K Cell.",
                                metadata={"current_pmsss": pmsss_count, "cap": config.max_pmsss_seats},
                            )
                        )
                elif (
                    rec.enrollment_type == EnrollmentType.SUPERNUMERARY_NRI
                    or rec.quota_category == QuotaCategory.NRI
                ):
                    nri_count += 1
                    max_nri_seats = math.ceil(config.approved_intake * config.max_nri_pct)
                    if nri_count > max_nri_seats:
                        record_violations[rec.record_id].append(
                            ViolationDetail(
                                layer="L3_INTAKE",
                                rule_code="RULE_NRI_CEILING_BREACHED",
                                severity=ViolationSeverity.ERROR,
                                message=f"NRI quota exceeded. Admitted {nri_count}/{max_nri_seats} allowed (15% cap).",
                                remediation="Inspect sponsor NRI declarations and bank remittance proofs.",
                                metadata={"current_nri": nri_count, "cap": max_nri_seats},
                            )
                        )
                else:
                    # Regular intake
                    reg_count += 1
                    if reg_count > config.approved_intake:
                        record_violations[rec.record_id].append(
                            ViolationDetail(
                                layer="L3_INTAKE",
                                rule_code="RULE_REGULAR_INTAKE_EXCEEDED",
                                severity=ViolationSeverity.CRITICAL,
                                message=f"Sanctioned regular intake exceeded! Admitted student #{reg_count} beyond sanctioned limit of {config.approved_intake}.",
                                remediation="Revoke unauthorized admissions immediately under Section 10(k) AICTE Act 1987.",
                                metadata={"current_regular": reg_count, "approved_intake": config.approved_intake},
                            )
                        )

            total_enrolled = len(group)
            is_overflow = (
                reg_count > config.approved_intake
                or tfw_count > config.max_tfw_seats
                or ews_count > config.max_ews_seats
                or lat_count > config.max_lateral_seats
                or pmsss_count > config.max_pmsss_seats
            )
            overflow_count = max(0, reg_count - config.approved_intake)

            summaries[prog_code] = ProgramUtilizationSummary(
                program_code=prog_code,
                approved_intake=config.approved_intake,
                regular_enrolled=reg_count,
                tfw_enrolled=tfw_count,
                tfw_cap=config.max_tfw_seats,
                ews_enrolled=ews_count,
                ews_cap=config.max_ews_seats,
                lateral_enrolled=lat_count,
                lateral_cap=config.max_lateral_seats,
                pmsss_enrolled=pmsss_count,
                pmsss_cap=config.max_pmsss_seats,
                total_enrolled=total_enrolled,
                is_overflow=is_overflow,
                overflow_count=overflow_count,
            )

        return record_violations, summaries
