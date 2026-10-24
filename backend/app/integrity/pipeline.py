"""
Module: src/pipeline.py
Component: Master Pipeline Orchestrator
Purpose: Coordinates layered validation (L1-L5) across batch student uploads, aggregating telemetry,
risk scoring, and issuing AICTE regulatory compliance determinations.
"""

from typing import List, Dict, Optional, Union, Any
from pathlib import Path
from datetime import datetime
import io
import json
import pandas as pd
from collections import defaultdict

import re
from .schema import (
    StudentEnrollmentRecord,
    RecordVerificationResult,
    BatchReport,
    ViolationDetail,
    ViolationSeverity,
    RiskLevel,
    InstitutionIntakeConfig,
    ProgrammeSpec,
)
from .registry import MockApaarRegistry, ApaarRegistryRecord
from .intake_validator import IntakeCeilingValidator
from .multi_enrollment import CrossCollegeEnrollmentResolver, CentralEnrollmentRepository
from .anomaly_detector import StatisticalAnomalyEngine


DATA_DIR = Path(__file__).resolve().parent / "data"


class MasterPipelineOrchestrator:
    def __init__(
        self,
        registry: Optional[MockApaarRegistry] = None,
        intake_validator: Optional[IntakeCeilingValidator] = None,
        anomaly_engine: Optional[StatisticalAnomalyEngine] = None,
    ):
        self.registry = registry or MockApaarRegistry()
        self.intake_validator = intake_validator or IntakeCeilingValidator()
        self.cross_resolver = CrossCollegeEnrollmentResolver(self.registry)
        self.anomaly_engine = anomaly_engine or StatisticalAnomalyEngine()

    def load_records_from_csv(self, file_path: Union[str, Path]) -> List[StudentEnrollmentRecord]:
        """
        Parses CSV batch file into StudentEnrollmentRecord domain objects.
        """
        df = pd.read_csv(file_path, dtype={"apaar_id": str, "student_phone": str, "pin_code": str})
        records: List[StudentEnrollmentRecord] = []
        
        for _, row in df.iterrows():
            rec_dict = row.dropna().to_dict()
            # Clean string fields
            for k, v in rec_dict.items():
                if isinstance(v, float) and v.is_integer() and k in ("apaar_id", "student_phone", "pin_code"):
                    rec_dict[k] = str(int(v))
                elif isinstance(v, str):
                    rec_dict[k] = v.strip()
            # Construct model
            rec = StudentEnrollmentRecord(**rec_dict)
            records.append(rec)
            
        return records

    def process_batch(
        self,
        records: List[StudentEnrollmentRecord],
        batch_id: Optional[str] = None,
    ) -> BatchReport:
        """
        Executes end-to-end layered verification pipeline.
        """
        if not records:
            raise ValueError("Cannot process an empty student batch.")

        batch_id = batch_id or f"BATCH-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        institution_id = records[0].institution_id
        institution_name = records[0].institution_name
        academic_year = records[0].academic_year

        # Master mapping of record_id -> List[ViolationDetail]
        violations_by_record: Dict[str, List[ViolationDetail]] = defaultdict(list)

        # -------------------------------------------------------------
        # Layer 1: Structural Validation (L1) - APAAR must be exactly 12 digits
        # -------------------------------------------------------------
        for r in records:
            clean_apaar = re.sub(r"[\s\-]", "", str(r.apaar_id or ""))
            if not re.fullmatch(r"\d{12}", clean_apaar):
                violations_by_record[r.record_id].append(
                    ViolationDetail(
                        layer="L1_FORMAT",
                        rule_code="RULE_APAAR_INVALID_FORMAT",
                        severity=ViolationSeverity.CRITICAL,
                        message=f"APAAR ID '{r.apaar_id}' is invalid. It must be exactly 12 numeric digits.",
                        remediation="Student must re-enter the 12-digit APAAR ID shown in DigiLocker.",
                        metadata={"raw_apaar": r.apaar_id},
                    )
                )

        # -------------------------------------------------------------
        # Layer 2: Central Identity & Registry Verification (L2)
        # -------------------------------------------------------------
        for r in records:
            # Check registry existence and demographic consistency
            is_verified, discrepancies, meta = self.registry.verify_identity(
                apaar_id=r.apaar_id,
                candidate_name=r.student_name,
                candidate_dob=r.dob,
                candidate_gender=r.gender,
            )
            for d in discrepancies:
                violations_by_record[r.record_id].append(
                    ViolationDetail(
                        layer="L2_IDENTITY",
                        rule_code=d["rule_code"],
                        severity=ViolationSeverity(d["severity"]),
                        message=d["message"],
                        remediation=d["remediation"],
                        metadata=meta,
                    )
                )

        # -------------------------------------------------------------
        # Layer 3: AICTE Regulatory Intake Ceiling & Quotas (L3)
        # -------------------------------------------------------------
        intake_violations, program_summaries = self.intake_validator.validate_batch_intake(records)
        for rec_id, vlist in intake_violations.items():
            violations_by_record[rec_id].extend(vlist)

        # -------------------------------------------------------------
        # Layer 4: Cross-College Concurrent Enrollment Resolution (L4)
        # -------------------------------------------------------------
        concurrency_violations, conflict_events = self.cross_resolver.resolve_enrollments(records)
        for rec_id, vlist in concurrency_violations.items():
            violations_by_record[rec_id].extend(vlist)

        # -------------------------------------------------------------
        # Layer 5: Statistical Anomaly & Risk Engine (L5)
        # -------------------------------------------------------------
        stat_violations, anomaly_clusters = self.anomaly_engine.analyze_batch_anomalies(records)
        for rec_id, vlist in stat_violations.items():
            violations_by_record[rec_id].extend(vlist)

        # -------------------------------------------------------------
        # Aggregation & Scoring
        # -------------------------------------------------------------
        record_results: List[RecordVerificationResult] = []
        clean_count = 0
        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0
        risk_scores = []

        for r in records:
            v_list = violations_by_record[r.record_id]
            # Exclude INFO notices from marking a record as invalid
            blocking_violations = [v for v in v_list if v.severity != ViolationSeverity.INFO]
            is_valid = len(blocking_violations) == 0

            score, risk_lvl, layer_scores = self.anomaly_engine.calculate_composite_risk_score(v_list)
            risk_scores.append(score)

            if is_valid and score == 0.0:
                clean_count += 1
            
            if risk_lvl == RiskLevel.CRITICAL:
                critical_count += 1
            elif risk_lvl == RiskLevel.HIGH:
                high_count += 1
            elif risk_lvl == RiskLevel.MEDIUM:
                medium_count += 1
            else:
                low_count += 1

            record_results.append(
                RecordVerificationResult(
                    record_id=r.record_id,
                    apaar_id=r.apaar_id,
                    student_name=r.student_name,
                    institution_id=r.institution_id,
                    program_code=r.program_code,
                    is_valid=is_valid,
                    risk_level=risk_lvl,
                    composite_risk_score=score,
                    layer_scores=layer_scores,
                    violations=v_list,
                )
            )

        total_records = len(records)
        flagged_count = total_records - clean_count

        # Compute Institution Risk Index (IRI)
        avg_risk = sum(risk_scores) / total_records if total_records > 0 else 0.0
        flag_ratio = (flagged_count / total_records) if total_records > 0 else 0.0
        critical_penalty = critical_count * 5.0
        
        iri = min(100.0, round(avg_risk * 0.5 + flag_ratio * 40.0 + critical_penalty, 2))

        # Determine AICTE Regulatory Verdict
        if critical_count > 0 or iri >= 50.0:
            verdict = "REJECTED_HEARING"
        elif high_count > 0 or iri >= 20.0:
            verdict = "PROVISIONAL_AUDIT"
        else:
            verdict = "APPROVED"

        return BatchReport(
            batch_id=batch_id,
            institution_id=institution_id,
            institution_name=institution_name,
            academic_year=academic_year,
            timestamp=datetime.now(),
            total_records=total_records,
            clean_records_count=clean_count,
            flagged_records_count=flagged_count,
            critical_records_count=critical_count,
            high_records_count=high_count,
            medium_records_count=medium_count,
            low_records_count=low_count,
            institution_risk_index=iri,
            regulatory_verdict=verdict,
            program_capacity_utilization=program_summaries,
            anomaly_clusters=anomaly_clusters,
            record_results=record_results,
        )


def parse_and_validate_batch(
    csv_content: Union[str, Path],
    institution_id: Optional[str] = None,
    academic_year: Optional[str] = None,
    programmes: Optional[Dict[str, Any]] = None,
    registry: Optional[MockApaarRegistry] = None,
    central_repo: Optional[CentralEnrollmentRepository] = None,
) -> BatchReport:
    """
    Parses and runs layered validation on candidate enrollment batch CSV data.
    """
    if registry is None:
        registry = MockApaarRegistry()

    # Pre-populate foundational registry records if available
    central_file = DATA_DIR / "apaar_central_registry.json"
    if central_file.exists():
        try:
            with open(central_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            for apaar_id, rec_data in data.items():
                clean_id = str(apaar_id).replace("-", "").replace(" ", "").strip()
                if clean_id not in registry.records:
                    registry.records[clean_id] = ApaarRegistryRecord(
                        apaar_id=clean_id,
                        full_name=rec_data["full_name"],
                        dob=rec_data["dob"],
                        gender=rec_data["gender"],
                        status=rec_data.get("status", "ACTIVE"),
                        aadhaar_linked=rec_data.get("aadhaar_linked", True),
                        existing_enrollments=rec_data.get("existing_enrollments", []),
                    )
        except Exception:
            pass

    # Synchronize inter-college central repository registrations if supplied
    if central_repo is not None:
        central_repo.sync_to_registry(registry)

    # Initialize intake ceiling validator
    intake_validator = IntakeCeilingValidator()
    intake_file = DATA_DIR / "aicte_approved_intake.json"
    if intake_file.exists():
        try:
            with open(intake_file, "r", encoding="utf-8") as f:
                intake_list = json.load(f)
            for item in intake_list:
                intake_validator.add_config(InstitutionIntakeConfig(**item))
        except Exception:
            pass

    # Add custom programmes config if specified
    if programmes:
        inst_id = institution_id or "AICTE-1-DEFAULT"
        acad_yr = academic_year or "2026-2027"
        for prog_code, spec in programmes.items():
            if hasattr(spec, "to_intake_config"):
                cfg = spec.to_intake_config(
                    institution_id=inst_id,
                    institution_name=inst_id,
                    academic_year=acad_yr,
                )
            elif isinstance(spec, dict):
                cfg = InstitutionIntakeConfig(
                    institution_id=inst_id,
                    institution_name=inst_id,
                    program_code=prog_code,
                    academic_year=acad_yr,
                    approved_intake=spec.get("sanctioned_intake", 60),
                )
            else:
                cfg = InstitutionIntakeConfig(
                    institution_id=inst_id,
                    institution_name=inst_id,
                    program_code=prog_code,
                    academic_year=acad_yr,
                    approved_intake=getattr(spec, "sanctioned_intake", 60),
                )
            intake_validator.add_config(cfg)

    orchestrator = MasterPipelineOrchestrator(
        registry=registry,
        intake_validator=intake_validator,
    )

    # Ingest records
    if isinstance(csv_content, Path):
        records = orchestrator.load_records_from_csv(csv_content)
    elif isinstance(csv_content, str):
        p = Path(csv_content)
        if len(csv_content) < 300 and p.exists() and p.is_file():
            records = orchestrator.load_records_from_csv(p)
        else:
            df = pd.read_csv(io.StringIO(csv_content), dtype={"apaar_id": str, "student_phone": str, "pin_code": str})
            records = []
            for _, row in df.iterrows():
                rec_dict = row.dropna().to_dict()
                for k, v in rec_dict.items():
                    if isinstance(v, float) and v.is_integer() and k in ("apaar_id", "student_phone", "pin_code"):
                        rec_dict[k] = str(int(v))
                    elif isinstance(v, str):
                        rec_dict[k] = v.strip()
                rec = StudentEnrollmentRecord(**rec_dict)
                records.append(rec)
    else:
        raise ValueError("Unsupported csv_content format. Provide string content or Path object.")

    return orchestrator.process_batch(records)

