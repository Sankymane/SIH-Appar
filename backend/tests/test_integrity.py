"""
Unit & Integration Test Suite: tests/test_integrity.py
System: Enrollment Integrity & Anomaly Detection System (SIH 2026)
Theme: Smart Automation | Team: Code Geass | Problem Statement ID: 26263
"""

import pytest
from datetime import date
from pathlib import Path
import json

from backend.app.integrity.schema import (
    StudentEnrollmentRecord,
    InstitutionIntakeConfig,
    EnrollmentType,
    QuotaCategory,
    RiskLevel,
    ViolationSeverity,
)
from backend.app.integrity.registry import MockApaarRegistry, ApaarRegistryRecord
from backend.app.integrity.intake_validator import IntakeCeilingValidator
from backend.app.integrity.multi_enrollment import CrossCollegeEnrollmentResolver
from backend.app.integrity.anomaly_detector import StatisticalAnomalyEngine
from backend.app.integrity.pipeline import MasterPipelineOrchestrator
from backend.app.integrity import DATA_DIR, get_registry
from backend.app.validation_engine import ValidationEngine


def generate_valid_apaar_id(prefix11: str) -> str:
    """Test helper: builds a 12-digit APAAR ID (format check is length/digits only)."""
    assert len(prefix11) == 11 and prefix11.isdigit()
    return prefix11 + "0"



# -------------------------------------------------------------
# 2. Schemas & Data Contracts Tests
# -------------------------------------------------------------
class TestSchemas:
    def test_valid_student_record_creation(self):
        apaar = generate_valid_apaar_id("91001000101")
        rec = StudentEnrollmentRecord(
            record_id="REC-TEST-01",
            apaar_id=apaar,
            student_name="Aarav Sharma",
            dob=date(2007, 3, 15),
            gender="M",
            institution_id="AICTE-1-10992384",
            institution_name="Apex Institute of Technology",
            program_code="BTECH-CSE",
            academic_year="2026-2027",
            admission_date=date(2026, 8, 1),
            percentile_score=94.5,
        )
        assert rec.apaar_id == apaar
        assert rec.student_name == "Aarav Sharma"
        assert rec.enrollment_type == EnrollmentType.REGULAR
        assert rec.quota_category == QuotaCategory.OPEN

    def test_intake_config_supernumerary_caps(self):
        cfg = InstitutionIntakeConfig(
            institution_id="AICTE-1-10992384",
            institution_name="Apex Institute",
            program_code="BTECH-CSE",
            academic_year="2026-2027",
            approved_intake=60,
            max_tfw_pct=0.05,
            max_ews_pct=0.10,
            max_lateral_pct=0.10,
            vacant_prior_year_seats=4,
        )
        assert cfg.max_tfw_seats == 3  # ceil(60 * 0.05) = 3
        assert cfg.max_ews_seats == 6  # ceil(60 * 0.10) = 6
        assert cfg.max_lateral_seats == 10  # ceil(60 * 0.10) + 4 = 10


# -------------------------------------------------------------
# 3. Central Registry & Identity Verification Tests (L2)
# -------------------------------------------------------------
class TestMockApaarRegistry:
    def test_verify_active_identity_match(self):
        registry = MockApaarRegistry()
        apaar = generate_valid_apaar_id("91001000199")
        registry.add_record(
            ApaarRegistryRecord(
                apaar_id=apaar,
                full_name="Tanvi Joshi",
                dob="2007-05-30",
                gender="F",
                status="ACTIVE",
            )
        )
        is_verified, discrepancies, meta = registry.verify_identity(
            apaar_id=apaar,
            candidate_name="Tanvi Joshi",
            candidate_dob=date(2007, 5, 30),
            candidate_gender="F",
        )
        assert is_verified is True
        assert len(discrepancies) == 0
        assert meta["status"] == "ACTIVE"

    def test_ghost_apaar_not_found(self):
        registry = MockApaarRegistry()
        is_verified, discrepancies, _ = registry.verify_identity(
            apaar_id="999999999999",
            candidate_name="Ghost Candidate",
            candidate_dob=date(2006, 1, 1),
            candidate_gender="M",
        )
        assert is_verified is False
        assert any(d["rule_code"] == "RULE_GHOST_APAAR_NOT_FOUND" for d in discrepancies)

    def test_deactivated_citizen_flagged(self):
        registry = MockApaarRegistry()
        apaar = generate_valid_apaar_id("91001000198")
        registry.add_record(
            ApaarRegistryRecord(
                apaar_id=apaar,
                full_name="Deactivated Student",
                dob="2006-01-01",
                gender="M",
                status="DEACTIVATED",
            )
        )
        is_verified, discrepancies, _ = registry.verify_identity(
            apaar_id=apaar,
            candidate_name="Deactivated Student",
            candidate_dob=date(2006, 1, 1),
            candidate_gender="M",
        )
        assert is_verified is False
        assert any(d["rule_code"] == "RULE_APAAR_DEACTIVATED" for d in discrepancies)

    def test_demographic_mismatch_flags(self):
        registry = MockApaarRegistry()
        apaar = generate_valid_apaar_id("91001000197")
        registry.add_record(
            ApaarRegistryRecord(
                apaar_id=apaar,
                full_name="Original Name",
                dob="2005-01-01",
                gender="M",
            )
        )
        # Discrepancy in name, DOB, and gender
        is_verified, discrepancies, _ = registry.verify_identity(
            apaar_id=apaar,
            candidate_name="Completely Different",
            candidate_dob=date(2008, 12, 12),
            candidate_gender="F",
        )
        assert is_verified is False
        codes = [d["rule_code"] for d in discrepancies]
        assert "RULE_DEMOGRAPHIC_NAME_MISMATCH" in codes
        assert "RULE_DEMOGRAPHIC_DOB_MISMATCH" in codes
        assert "RULE_DEMOGRAPHIC_GENDER_MISMATCH" in codes


# -------------------------------------------------------------
# 4. Intake Ceiling Validator Tests (L3)
# -------------------------------------------------------------
class TestIntakeValidator:
    def test_regular_intake_ceiling_breach(self):
        cfg = InstitutionIntakeConfig(
            institution_id="INST-101",
            institution_name="Test College",
            program_code="CSE",
            academic_year="2026-2027",
            approved_intake=2,  # Only 2 approved seats
        )
        validator = IntakeCeilingValidator()
        validator.add_config(cfg)

        records = [
            StudentEnrollmentRecord(
                record_id=f"R-{i}",
                apaar_id=generate_valid_apaar_id(f"910010001{i:02d}"),
                student_name=f"Student {i}",
                dob=date(2006, 1, 1),
                gender="M",
                institution_id="INST-101",
                institution_name="Test College",
                program_code="CSE",
                academic_year="2026-2027",
                admission_date=date(2026, 8, i),
                enrollment_type=EnrollmentType.REGULAR,
            )
            for i in range(1, 4)  # 3 students for 2 seats
        ]

        violations, summaries = validator.validate_batch_intake(records)
        assert summaries["CSE"].is_overflow is True
        assert summaries["CSE"].overflow_count == 1
        # Student #3 must be flagged with overflow
        assert any(v.rule_code == "RULE_REGULAR_INTAKE_EXCEEDED" for v in violations["R-3"])
        # Student #1 and #2 must not have overflow
        assert not any(v.rule_code == "RULE_REGULAR_INTAKE_EXCEEDED" for v in violations["R-1"])
        assert not any(v.rule_code == "RULE_REGULAR_INTAKE_EXCEEDED" for v in violations["R-2"])

    def test_ews_income_fraud_flagged(self):
        cfg = InstitutionIntakeConfig(
            institution_id="INST-101",
            institution_name="Test College",
            program_code="CSE",
            academic_year="2026-2027",
            approved_intake=10,
        )
        validator = IntakeCeilingValidator({("INST-101", "CSE", "2026-2027"): cfg})

        rec = StudentEnrollmentRecord(
            record_id="R-EWS",
            apaar_id=generate_valid_apaar_id("91001000155"),
            student_name="Affluent EWS Claimant",
            dob=date(2006, 1, 1),
            gender="M",
            institution_id="INST-101",
            institution_name="Test College",
            program_code="CSE",
            academic_year="2026-2027",
            admission_date=date(2026, 8, 1),
            enrollment_type=EnrollmentType.SUPERNUMERARY_EWS,
            quota_category=QuotaCategory.EWS,
            annual_family_income=1500000.0,  # 15 LPA exceeds 8 LPA ceiling
        )

        violations, _ = validator.validate_batch_intake([rec])
        assert any(v.rule_code == "RULE_EWS_INCOME_INELIGIBLE" for v in violations["R-EWS"])


# -------------------------------------------------------------
# 5. Cross-College Concurrent Enrollment Tests (L4)
# -------------------------------------------------------------
class TestMultiEnrollmentResolver:
    def test_cross_college_fulltime_conflict(self):
        registry = MockApaarRegistry()
        apaar = generate_valid_apaar_id("91001000188")
        registry.add_record(
            ApaarRegistryRecord(
                apaar_id=apaar,
                full_name="Dual Enrollee",
                dob="2006-05-10",
                gender="M",
                existing_enrollments=[
                    {
                        "institution_id": "INST-A",
                        "institution_name": "IIT Bombay",
                        "program_code": "BTECH-EE",
                        "academic_year": "2026-2027",
                        "status": "ACTIVE",
                        "mode": "REGULAR_FULLTIME",
                    }
                ],
            )
        )
        resolver = CrossCollegeEnrollmentResolver(registry)

        rec = StudentEnrollmentRecord(
            record_id="R-DUAL",
            apaar_id=apaar,
            student_name="Dual Enrollee",
            dob=date(2006, 5, 10),
            gender="M",
            institution_id="INST-B",
            institution_name="Anna University",
            program_code="BTECH-CSE",
            academic_year="2026-2027",
            admission_date=date(2026, 8, 1),
        )

        violations, events = resolver.resolve_enrollments([rec])
        assert len(events) == 1
        assert any(v.rule_code == "RULE_CONCURRENT_FULLTIME_ENROLLMENT" for v in violations["R-DUAL"])

    def test_intra_batch_duplicate_detection(self):
        registry = MockApaarRegistry()
        resolver = CrossCollegeEnrollmentResolver(registry)
        apaar = generate_valid_apaar_id("91001000187")

        rec1 = StudentEnrollmentRecord(
            record_id="R-DUP1",
            apaar_id=apaar,
            student_name="Dup Candidate",
            dob=date(2006, 5, 10),
            gender="M",
            institution_id="INST-B",
            institution_name="College B",
            program_code="BTECH-CSE",
            academic_year="2026-2027",
            admission_date=date(2026, 8, 1),
        )
        rec2 = StudentEnrollmentRecord(
            record_id="R-DUP2",
            apaar_id=apaar,
            student_name="Dup Candidate",
            dob=date(2006, 5, 10),
            gender="M",
            institution_id="INST-B",
            institution_name="College B",
            program_code="BTECH-CSE",
            academic_year="2026-2027",
            admission_date=date(2026, 8, 1),
        )

        violations, events = resolver.resolve_enrollments([rec1, rec2])
        assert any(v.rule_code == "RULE_INTRA_BATCH_DUPLICATE_SUBMISSION" for v in violations["R-DUP1"])
        assert any(v.rule_code == "RULE_INTRA_BATCH_DUPLICATE_SUBMISSION" for v in violations["R-DUP2"])


# -------------------------------------------------------------
# 6. Statistical Anomaly Engine Tests (L5)
# -------------------------------------------------------------
class TestStatisticalAnomalyEngine:
    def test_agent_phone_reuse_syndicate(self):
        engine = StatisticalAnomalyEngine(contact_reuse_threshold=3)
        shared_phone = "9876599999"

        records = [
            StudentEnrollmentRecord(
                record_id=f"R-SYN-{i}",
                apaar_id=generate_valid_apaar_id(f"910010002{i:02d}"),
                student_name=f"Syndicate Student {i}",
                dob=date(2006, 1, 1),
                gender="M",
                institution_id="INST-101",
                institution_name="Test College",
                program_code="CSE",
                academic_year="2026-2027",
                admission_date=date(2026, 8, 1),
                student_phone=shared_phone,
            )
            for i in range(1, 4)
        ]

        violations, clusters = engine.analyze_batch_anomalies(records)
        assert len(clusters) == 1
        assert clusters[0]["type"] == "PHONE_SYNDICATE_CLUSTER"
        for i in range(1, 4):
            assert any(v.rule_code == "ANOMALY_CONTACT_REUSE_SYNDICATE" for v in violations[f"R-SYN-{i}"])


# -------------------------------------------------------------
# 7. End-to-End Master Pipeline Integration Tests
# -------------------------------------------------------------
class TestMasterPipelineIntegration:
    @pytest.fixture
    def setup_pipeline(self):
        data_dir = DATA_DIR
        registry = MockApaarRegistry(str(data_dir / "apaar_central_registry.json"))
        with open(data_dir / "aicte_approved_intake.json") as f:
            intake_list = json.load(f)
        intake_val = IntakeCeilingValidator()
        for item in intake_list:
            intake_val.add_config(InstitutionIntakeConfig(**item))
        pipeline = MasterPipelineOrchestrator(registry=registry, intake_validator=intake_val)
        return pipeline, data_dir / "demo_planted_batch.csv"

    def test_end_to_end_batch_processing(self, setup_pipeline):
        pipeline, csv_path = setup_pipeline
        records = pipeline.load_records_from_csv(csv_path)
        report = pipeline.process_batch(records)

        assert report.total_records == 35
        assert report.clean_records_count == 17
        assert report.flagged_records_count == 18
        assert report.critical_records_count >= 8
        assert report.institution_risk_index > 50.0
        assert report.regulatory_verdict == "REJECTED_HEARING"
        assert report.program_capacity_utilization["BTECH-CSE"].is_overflow is True
        assert report.program_capacity_utilization["BTECH-ECE"].is_overflow is False



def get_registry_records():
    return get_registry().records


# -------------------------------------------------------------
# 8. APAAR format (12 digits) + Central Registry presence/active
# -------------------------------------------------------------
class TestApaarFormatAndRegistryPresence:
    @pytest.fixture
    def pipeline(self):
        registry = MockApaarRegistry(str(DATA_DIR / "apaar_central_registry.json"))
        return MasterPipelineOrchestrator(registry=registry)

    def _record(self, apaar):
        return StudentEnrollmentRecord(
            record_id="T-1", apaar_id=apaar, student_name="Aarav Sharma", dob=date(2007, 3, 15), gender="M",
            institution_id="AICTE-1-10992384", institution_name="Apex", program_code="BTECH-CSE",
            academic_year="2026-2027", admission_date=date(2026, 8, 1),
        )

    def test_short_id_fails_l1_format(self, pipeline):
        report = pipeline.process_batch([self._record("91001000101")])
        codes = [v.rule_code for v in report.record_results[0].violations]
        assert "RULE_APAAR_INVALID_FORMAT" in codes

    def test_id_missing_from_registry_is_ghost(self, pipeline):
        report = pipeline.process_batch([self._record("123456789012")])
        codes = [v.rule_code for v in report.record_results[0].violations]
        assert "RULE_GHOST_APAAR_NOT_FOUND" in codes
        assert "RULE_APAAR_INVALID_FORMAT" not in codes  # 12 digits, so L1 passes

    def test_active_registry_id_has_no_identity_violation(self, pipeline):
        report = pipeline.process_batch([self._record("910010001012")])
        codes = [v.rule_code for v in report.record_results[0].violations]
        assert not any(c.startswith("RULE_APAAR") or c == "RULE_GHOST_APAAR_NOT_FOUND" for c in codes)

    def test_registry_check_active_helper(self):
        ok, code, _ = ValidationEngine.check_registry_active("910010001012")
        assert ok is True and code == "VALID"
        ok, code, _ = ValidationEngine.check_registry_active("123456789012")
        assert ok is False and code == "APAAR_NOT_IN_REGISTRY"
        inactive = next(k for k, v in get_registry_records().items() if v.status != "ACTIVE")
        ok, code, _ = ValidationEngine.check_registry_active(inactive)
        assert ok is False and code == "APAAR_INACTIVE"
