export interface CollegeSummary {
  aicte_id: string;
  name: string;
  address?: string;
  district?: string;
  state?: string;
  institution_type?: string;
  women: string;
  minority: string;
  total_approved_intake: number;
  total_enrolled_students: number;
  compliance_status: "COMPLIANT" | "EXCEEDED" | "NEAR_CAPACITY";
}

export interface CourseIntake {
  id: number;
  program: string;
  department: string;
  level: string;
  shift: string;
  approved_intake: number;
  supernumerary_intake: number;
  nri_quota: number;
  fn_quota: number;
  academic_year: string;
  enrolled_count: number;
  supernumerary_count: number;
}

export interface CollegeDetail {
  aicte_id: string;
  name: string;
  address?: string;
  district?: string;
  state?: string;
  institution_type?: string;
  women: string;
  minority: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  nodal_officer_name?: string;
  nodal_officer_email?: string;
  nodal_officer_mobile?: string;
  registered_phone?: string;
  total_approved_intake: number;
  total_enrolled_students: number;
  total_supernumerary_enrolled: number;
  flagged_records_count: number;
  courses: CourseIntake[];
}

export interface Student {
  id: number;
  apaar_id?: string;
  masked_apaar_id?: string;
  enrollment_no: string;
  full_name: string;
  gender: string;
  category: string;
  date_of_birth?: string;
  date_of_admission?: string;
  academic_year: string;
  aicte_id: string;
  college_name?: string;
  course_id?: number;
  program: string;
  department: string;
  level: string;
  admission_type: string;
  is_nri: boolean;
  is_oci: boolean;
  is_fn: boolean;
  validation_status: "VALID" | "DUPLICATE_APAAR" | "CROSS_INSTITUTION_DUPLICATE" | "MISSING_APAAR" | "INVALID_APAAR_FORMAT" | "INTAKE_EXCEEDED" | "DATA_INCONSISTENCY";
  validation_remarks?: string;
  verification_hash?: string;
  is_verified: boolean;
  credits_earned?: number;
  cgpa?: number;
  created_at?: string;
}

export interface StudentProfile {
  apaar_id: string;
  full_name: string;
  enrollment_no: string;
  gender: string;
  category: string;
  date_of_birth?: string;
  date_of_admission?: string;
  academic_year: string;
  aicte_id: string;
  college_name: string;
  program: string;
  department: string;
  level: string;
  admission_type: string;
  credits_earned: number;
  cgpa: number;
  digilocker_status: string;
  card_photo_url?: string;
  validation_status: string;
  verification_hash?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  mobile_number?: string;
}

export interface StudentRemark {
  id: number;
  student_id?: number;
  apaar_id: string;
  student_name: string;
  aicte_id: string;
  college_name?: string;
  remark_type: string;
  description: string;
  status: "PENDING" | "UNDER_REVIEW" | "RESOLVED";
  contact_email?: string;
  contact_mobile?: string;
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface StakeholderDirectoryItem {
  aicte_id: string;
  name: string;
  district: string;
  state: string;
  institution_type: string;
  nodal_officer_name: string;
  nodal_officer_email: string;
  registered_phone: string;
  is_active: boolean;
  total_approved_intake: number;
  total_enrolled: number;
  compliance_status: "COMPLIANT" | "EXCEEDED" | "DEACTIVATED";
}

export interface StakeholderAlertItem {
  id: string;
  alert_type: "INTAKE_EXCEEDED" | "CROSS_INSTITUTION_CONFLICT" | "DUPLICATE_APAAR" | "MISSING_APAAR" | "FORECAST_SURGE_WARNING";
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  aicte_id: string;
  college_name: string;
  department?: string;
  details: string;
  count: number;
  action_url?: string;
}

export interface TimeSeriesDataPoint {
  year: string;
  year_int: number;
  month?: number;
  approved_intake: number;
  actual_enrolment: number;
  trend: number;
  seasonal: number;
  residual: number;
  growth_rate_pct: number;
}

export interface ForecastingResult {
  grouping_key: string;
  programme: string;
  state: string;
  institution_type: string;
  aicte_id?: string;
  college_name?: string;
  current_approved_intake: number;
  historical_points: TimeSeriesDataPoint[];
  projected_year: string;
  projected_intake_p50: number;
  projected_intake_p10: number;
  projected_intake_p90: number;
  projected_overflow_pct: number;
  is_critical_overflow: boolean;
  alert_message?: string;
  seasonal_admission_peak_month: string;
  recommended_action: string;
}

export interface AuditLogItem {
  id: number;
  action: string;
  entity_type: string;
  entity_id?: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface AnalyticsData {
  total_approved_intake: number;
  total_supernumerary_intake: number;
  total_enrolled_students: number;
  total_apaar_seeded: number;
  apaar_seeding_rate: number;
  total_flagged_violations: number;
  intake_utilization_rate: number;
  category_distribution: Record<string, number>;
  quota_distribution: Record<string, number>;
  gender_distribution: Record<string, number>;
  validation_status_breakdown: Record<string, number>;
  department_intake_comparison: Array<{
    department: string;
    approved_intake: number;
    actual_admitted: number;
    supernumerary_quota: number;
    utilization_pct: number;
  }>;
}

export interface UserAuthContext {
  token: string;
  aicte_id: string;
  college_name: string;
  role: "INSTITUTE_ADMIN" | "AICTE_VERIFIER" | "STUDENT" | "PUBLIC";
  apaar_id?: string;
  student_name?: string;
}

export interface StudentRegistrationPayload {
  full_name: string;
  mobile_number: string;
  email?: string;
  aicte_id: string;
  program?: string;
  department: string;
  level?: string;
  enrollment_no?: string;
  apaar_id?: string;
  gender?: string;
  category?: string;
  date_of_birth?: string;
  academic_year?: string;
}

export interface AnomalyRegion {
  id: number;
  box: [number, number, number, number]; // [x, y, width, height]
  label: string;
  tamper_score: number;
  area_pct?: number;
}

export interface ForensicVerificationResult {
  success: boolean;
  filename: string;
  file_type: string;
  file_size_kb: number;
  image_dimensions: { width: number; height: number };
  processing_time_ms: number;
  is_forged: boolean;
  verdict: "AUTHENTIC" | "SUSPICIOUS" | "TAMPERED_FORGERY";
  forgery_probability: number;
  confidence_score: number;
  forensic_algorithms_used: string[];
  analysis_summary: string;
  anomaly_regions: AnomalyRegion[];
  metrics: {
    ela_mean_discrepancy: number;
    noise_variance_divergence: number;
    jpeg_grid_anomaly_ratio: number;
  };
  original_image_base64: string;
  heatmap_overlay_base64: string;
  heatmap_raw_base64: string;
  ela_visual_base64: string;
}

export interface ForensicSample {
  id: string;
  name: string;
  expected_verdict: "AUTHENTIC" | "TAMPERED_FORGERY";
  description: string;
  data_uri: string;
}
