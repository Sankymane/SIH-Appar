"""
Module: src/multi_enrollment.py
Component: Cross-College Enrollment Resolver
Purpose: Detect simultaneous active regular degree enrollments across institutions and within batches,
enforcing AICTE/UGC Guidelines for Pursuing Dual Academic Programmes.
"""

from typing import List, Dict, Tuple, Optional, Any
from collections import defaultdict
from .schema import StudentEnrollmentRecord, ViolationDetail, ViolationSeverity
from .registry import MockApaarRegistry, ApaarRegistryRecord


class CrossCollegeEnrollmentResolver:
    def __init__(self, registry: MockApaarRegistry):
        self.registry = registry

    def resolve_enrollments(
        self, records: List[StudentEnrollmentRecord]
    ) -> Tuple[Dict[str, List[ViolationDetail]], List[Dict]]:
        """
        Scans batch for intra-batch duplicate APAAR IDs and inter-institution conflicts
        against the Central Registry.
        Returns:
            - record_violations: mapping of record_id -> List[ViolationDetail]
            - multi_enrollment_events: detailed event log of conflict pairs
        """
        record_violations: Dict[str, List[ViolationDetail]] = defaultdict(list)
        conflict_events: List[Dict] = []

        # 1. Intra-batch duplicate check
        apaar_to_records = defaultdict(list)
        for r in records:
            apaar_to_records[r.apaar_id].append(r)

        for apaar_id, recs in apaar_to_records.items():
            if len(recs) > 1:
                # Multiple occurrences within the current batch
                inst_ids = {r.institution_id for r in recs}
                prog_codes = {r.program_code for r in recs}

                for r in recs:
                    if len(prog_codes) == 1 and len(inst_ids) == 1:
                        violation = ViolationDetail(
                            layer="L4_CONCURRENCY",
                            rule_code="RULE_INTRA_BATCH_DUPLICATE_SUBMISSION",
                            severity=ViolationSeverity.HIGH,
                            message=f"APAAR ID {apaar_id} submitted {len(recs)} times for the same program ({recs[0].program_code}) in this batch.",
                            remediation="Deduplicate enrollment batch file before re-uploading.",
                            metadata={"duplicate_record_ids": [x.record_id for x in recs]},
                        )
                    else:
                        violation = ViolationDetail(
                            layer="L4_CONCURRENCY",
                            rule_code="RULE_INTRA_BATCH_SIMULTANEOUS_PROGRAMS",
                            severity=ViolationSeverity.CRITICAL,
                            message=f"APAAR ID {apaar_id} concurrently enrolled in multiple programs within same batch: {list(prog_codes)}.",
                            remediation="Cancel conflicting regular admission; dual full-time degrees prohibited under AICTE norms.",
                            metadata={"programs": list(prog_codes), "record_ids": [x.record_id for x in recs]},
                        )
                    record_violations[r.record_id].append(violation)

                conflict_events.append({
                    "event_type": "INTRA_BATCH_DUPLICATE",
                    "apaar_id": apaar_id,
                    "student_name": recs[0].student_name,
                    "record_ids": [x.record_id for x in recs],
                    "programs": list(prog_codes),
                    "institutions": list(inst_ids),
                })

        # 2. Inter-institution Central Registry check
        for r in records:
            active_prior = self.registry.get_active_enrollments(r.apaar_id)
            for prior in active_prior:
                # Check if it's the exact same institution and program (idempotent re-admission)
                if (
                    prior.get("institution_id") == r.institution_id
                    and prior.get("program_code") == r.program_code
                    and prior.get("academic_year") == r.academic_year
                ):
                    continue

                mode = prior.get("mode", "REGULAR_FULLTIME")
                prior_inst = prior.get("institution_name", prior.get("institution_id"))
                prior_prog = prior.get("program_code")
                prior_year = prior.get("academic_year")

                if mode == "REGULAR_FULLTIME":
                    # Critical AICTE/UGC violation: Two active full-time regular degree programs
                    record_violations[r.record_id].append(
                        ViolationDetail(
                            layer="L4_CONCURRENCY",
                            rule_code="RULE_CONCURRENT_FULLTIME_ENROLLMENT",
                            severity=ViolationSeverity.CRITICAL,
                            message=(
                                f"Simultaneous Full-Time Enrollment Detected! Student is already actively enrolled in "
                                f"'{prior_prog}' at '{prior_inst}' ({prior_year}). Dual regular degrees are prohibited by AICTE/UGC."
                            ),
                            remediation=(
                                "Obtain formal Transfer Certificate (TC) / Migration Certificate and update registry "
                                "prior to admitting in new full-time institution."
                            ),
                            metadata={
                                "conflicting_institution": prior_inst,
                                "conflicting_program": prior_prog,
                                "conflicting_academic_year": prior_year,
                                "mode": mode,
                            },
                        )
                    )
                    conflict_events.append({
                        "event_type": "CROSS_COLLEGE_CONCURRENT_ENROLLMENT",
                        "apaar_id": r.apaar_id,
                        "student_name": r.student_name,
                        "current_record_id": r.record_id,
                        "current_institution": r.institution_name,
                        "current_program": r.program_code,
                        "conflicting_institution": prior_inst,
                        "conflicting_program": prior_prog,
                        "conflicting_year": prior_year,
                    })
                elif mode in ("ODL_DISTANCE", "ONLINE"):
                    # Permitted under UGC 2022 dual degree guidelines
                    record_violations[r.record_id].append(
                        ViolationDetail(
                            layer="L4_CONCURRENCY",
                            rule_code="INFO_DUAL_DEGREE_ODL_PERMITTED",
                            severity=ViolationSeverity.INFO,
                            message=(
                                f"Notice: Student has an active {mode} program at '{prior_inst}'. "
                                f"Permitted under UGC/AICTE Dual Academic Programmes Guidelines 2022."
                            ),
                            remediation="No action required. Maintain ODL/Online verification record in dossier.",
                            metadata={"prior_program": prior_prog, "mode": mode},
                        )
                    )

        return record_violations, conflict_events


class CentralEnrollmentRepository:
    """
    Central database repository simulating inter-institutional enrollment registrations.
    """
    def __init__(self):
        self._enrollments: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    def register(
        self,
        apaar_id: str,
        academic_year: str,
        institution_id: str,
        programme: str,
        institution_name: Optional[str] = None,
        mode: str = "REGULAR_FULLTIME",
        status: str = "ACTIVE",
    ):
        clean_id = str(apaar_id).replace("-", "").replace(" ", "").strip()
        self._enrollments[clean_id].append({
            "institution_id": institution_id,
            "institution_name": institution_name or institution_id,
            "program_code": programme,
            "programme": programme,
            "academic_year": academic_year,
            "mode": mode,
            "status": status,
        })

    def get_enrollments(self, apaar_id: str) -> List[Dict[str, Any]]:
        clean_id = str(apaar_id).replace("-", "").replace(" ", "").strip()
        return self._enrollments.get(clean_id, [])

    def sync_to_registry(self, registry: MockApaarRegistry):
        """
        Synchronizes registered student records and active enrollments into MockApaarRegistry.
        """
        for apaar_id, enrolls in self._enrollments.items():
            clean_id = str(apaar_id).replace("-", "").replace(" ", "").strip()
            record = registry.get_record(clean_id)
            if not record:
                record = ApaarRegistryRecord(
                    apaar_id=clean_id,
                    full_name="Registered Student",
                    dob="2006-01-01",
                    gender="M",
                )
                registry.add_record(record)
            for e in enrolls:
                if e not in record.existing_enrollments:
                    record.existing_enrollments.append(e)

