import {
  CollegeSummary,
  StudentProfile,
  AnalyticsData,
  StakeholderDirectoryItem,
  StakeholderAlertItem,
  ForecastingResult,
  StudentRemark,
  AuditLogItem
} from "./types";

export const MOCK_FILTERS = {
  states: [
    "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Uttar Pradesh",
    "Gujarat", "Telangana", "West Bengal", "Madhya Pradesh", "Rajasthan"
  ],
  institution_types: [
    "Government", "Govt Aided", "Private-Self Financing", "University Managed"
  ],
  minority_options: ["Y", "N"],
  women_options: ["Y", "N"]
};

export const MOCK_COLLEGES: CollegeSummary[] = [
  {
    aicte_id: "1-44465113304",
    name: "ST. XAVIER'S TECHNICAL INSTITUTE",
    address: "Mahim Causeway, Mumbai",
    district: "Mumbai",
    state: "Maharashtra",
    institution_type: "Govt Aided",
    women: "N",
    minority: "Y",
    total_approved_intake: 360,
    total_enrolled_students: 348,
    compliance_status: "COMPLIANT"
  },
  {
    aicte_id: "1-44525213207",
    name: "INDIAN INSTITUTE OF TECHNOLOGY BOMBAY",
    address: "Powai, Mumbai",
    district: "Mumbai Suburban",
    state: "Maharashtra",
    institution_type: "Government",
    women: "N",
    minority: "N",
    total_approved_intake: 1200,
    total_enrolled_students: 1185,
    compliance_status: "COMPLIANT"
  },
  {
    aicte_id: "1-44527437964",
    name: "COLLEGE OF ENGINEERING PUNE (COEP)",
    address: "Wellesley Road, Shivajinagar",
    district: "Pune",
    state: "Maharashtra",
    institution_type: "Government",
    women: "N",
    minority: "N",
    total_approved_intake: 840,
    total_enrolled_students: 825,
    compliance_status: "COMPLIANT"
  },
  {
    aicte_id: "1-44646585844",
    name: "VEERMATA JIJABAI TECHNOLOGICAL INSTITUTE (VJTI)",
    address: "H.R. Mahajani Marg, Matunga",
    district: "Mumbai",
    state: "Maharashtra",
    institution_type: "Govt Aided",
    women: "N",
    minority: "N",
    total_approved_intake: 720,
    total_enrolled_students: 710,
    compliance_status: "COMPLIANT"
  },
  {
    aicte_id: "1-44789123450",
    name: "D. Y. PATIL COLLEGE OF ENGINEERING",
    address: "Sector 29, Akurdi",
    district: "Pune",
    state: "Maharashtra",
    institution_type: "Private-Self Financing",
    women: "N",
    minority: "N",
    total_approved_intake: 600,
    total_enrolled_students: 642,
    compliance_status: "EXCEEDED"
  }
];

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  apaar_id: "126430259751",
  full_name: "SANKALP HEMANT MANE",
  enrollment_no: "EN26CS1264",
  gender: "Male",
  category: "General",
  date_of_birth: "2004-06-18",
  date_of_admission: "2026-08-01",
  academic_year: "2026-2027",
  aicte_id: "1-44465113304",
  college_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
  program: "Engineering and Technology",
  department: "Computer Science and Engineering",
  level: "UG",
  admission_type: "Regular",
  credits_earned: 84,
  cgpa: 8.92,
  digilocker_status: "DigiLocker Verified",
  card_photo_url: "/sankalp_abc_card.png",
  validation_status: "VALID",
  verification_hash: "sha256:d8b2e176430259751e041fa89c0281b37651e43c",
  is_verified: true,
  verified_by: "Academic Bank of Credits (ABC) & AICTE Trust Network",
  verified_at: "2026-10-24T12:00:00Z",
  mobile_number: "8767434172"
};

export const MOCK_SYNTHETIC_STUDENTS: Record<string, StudentProfile> = {
  "8767434172": MOCK_STUDENT_PROFILE,
  "9137270864": {
    apaar_id: "219384750192",
    full_name: "AARAV PRADEEP SHARMA",
    enrollment_no: "EN26IT9137",
    gender: "Male",
    category: "General",
    date_of_birth: "2004-04-12",
    date_of_admission: "2026-08-01",
    academic_year: "2026-2027",
    aicte_id: "1-44465113304",
    college_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
    program: "Engineering and Technology",
    department: "Information Technology",
    level: "UG",
    admission_type: "Regular",
    credits_earned: 80,
    cgpa: 8.75,
    digilocker_status: "DigiLocker Verified",
    validation_status: "VALID",
    verification_hash: "sha256:synth_219384750192",
    is_verified: true,
    verified_by: "Academic Bank of Credits (ABC) & AICTE Trust Network",
    verified_at: "2026-10-24T12:00:00Z",
    mobile_number: "9137270864"
  },
  "9324862618": {
    apaar_id: "384759201847",
    full_name: "PRIYA RAJESH DESHMUKH",
    enrollment_no: "EN26CS9324",
    gender: "Female",
    category: "OBC-NCL",
    date_of_birth: "2004-11-20",
    date_of_admission: "2026-08-01",
    academic_year: "2026-2027",
    aicte_id: "1-44465113304",
    college_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
    program: "Engineering and Technology",
    department: "Computer Science and Engineering",
    level: "UG",
    admission_type: "Regular",
    credits_earned: 88,
    cgpa: 9.14,
    digilocker_status: "DigiLocker Verified",
    validation_status: "VALID",
    verification_hash: "sha256:synth_384759201847",
    is_verified: true,
    verified_by: "Academic Bank of Credits (ABC) & AICTE Trust Network",
    verified_at: "2026-10-24T12:00:00Z",
    mobile_number: "9324862618"
  },
  "8928197021": {
    apaar_id: "495820194857",
    full_name: "ROHAN SUNIL KULKARNI",
    enrollment_no: "EN26EE8928",
    gender: "Male",
    category: "General",
    date_of_birth: "2003-09-15",
    date_of_admission: "2026-08-01",
    academic_year: "2026-2027",
    aicte_id: "1-44465113304",
    college_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
    program: "Engineering and Technology",
    department: "Electronics and Telecommunication",
    level: "UG",
    admission_type: "Regular",
    credits_earned: 82,
    cgpa: 8.60,
    digilocker_status: "DigiLocker Verified",
    validation_status: "VALID",
    verification_hash: "sha256:synth_495820194857",
    is_verified: true,
    verified_by: "Academic Bank of Credits (ABC) & AICTE Trust Network",
    verified_at: "2026-10-24T12:00:00Z",
    mobile_number: "8928197021"
  },
  "8828246643": {
    apaar_id: "501928475638",
    full_name: "ANANYA VIKRAM JOSHI",
    enrollment_no: "EN26AI8828",
    gender: "Female",
    category: "EWS",
    date_of_birth: "2004-02-28",
    date_of_admission: "2026-08-01",
    academic_year: "2026-2027",
    aicte_id: "1-44465113304",
    college_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
    program: "Engineering and Technology",
    department: "Artificial Intelligence and Data Science",
    level: "UG",
    admission_type: "Regular",
    credits_earned: 90,
    cgpa: 9.30,
    digilocker_status: "DigiLocker Verified",
    validation_status: "VALID",
    verification_hash: "sha256:synth_501928475638",
    is_verified: true,
    verified_by: "Academic Bank of Credits (ABC) & AICTE Trust Network",
    verified_at: "2026-10-24T12:00:00Z",
    mobile_number: "8828246643"
  },
  "9833074194": {
    apaar_id: "618294750193",
    full_name: "ADITYA MANOJ VERMA",
    enrollment_no: "EN26ME9833",
    gender: "Male",
    category: "General",
    date_of_birth: "2003-12-05",
    date_of_admission: "2026-08-01",
    academic_year: "2026-2027",
    aicte_id: "1-44465113304",
    college_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
    program: "Engineering and Technology",
    department: "Mechanical Engineering",
    level: "UG",
    admission_type: "Regular",
    credits_earned: 78,
    cgpa: 8.45,
    digilocker_status: "DigiLocker Verified",
    validation_status: "VALID",
    verification_hash: "sha256:synth_618294750193",
    is_verified: true,
    verified_by: "Academic Bank of Credits (ABC) & AICTE Trust Network",
    verified_at: "2026-10-24T12:00:00Z",
    mobile_number: "9833074194"
  }
};


export const MOCK_ANALYTICS: AnalyticsData = {
  total_approved_intake: 32400,
  total_supernumerary_intake: 4860,
  total_enrolled_students: 29850,
  total_apaar_seeded: 28920,
  apaar_seeding_rate: 96.9,
  total_flagged_violations: 142,
  intake_utilization_rate: 92.1,
  category_distribution: {
    "General": 14200,
    "OBC-NCL": 8500,
    "SC": 4100,
    "ST": 2150,
    "EWS": 900
  },
  gender_distribution: {
    "Male": 18500,
    "Female": 11100,
    "Other": 250
  },
  quota_distribution: {
    "Regular": 25400,
    "Supernumerary-TFW": 2100,
    "Supernumerary-PMSSS": 950,
    "Supernumerary-Sports": 800,
    "NRI / Foreign National": 600
  },
  validation_status_breakdown: {
    "VALID": 28920,
    "INTAKE_EXCEEDED": 512,
    "DUPLICATE_APAAR": 18,
    "MISSING_APAAR": 45,
    "CROSS_INSTITUTION_DUPLICATE": 14
  },
  department_intake_comparison: [
    {
      department: "Computer Science and Engineering",
      approved_intake: 120,
      actual_admitted: 118,
      supernumerary_quota: 18,
      utilization_pct: 98.3
    },
    {
      department: "Information Technology",
      approved_intake: 60,
      actual_admitted: 59,
      supernumerary_quota: 9,
      utilization_pct: 98.3
    },
    {
      department: "Electronics & Telecommunication",
      approved_intake: 60,
      actual_admitted: 56,
      supernumerary_quota: 9,
      utilization_pct: 93.3
    }
  ]
};

export const MOCK_DIRECTORY: StakeholderDirectoryItem[] = [
  {
    aicte_id: "1-44465113304",
    name: "ST. XAVIER'S TECHNICAL INSTITUTE",
    district: "Mumbai",
    state: "Maharashtra",
    institution_type: "Govt Aided",
    nodal_officer_name: "Dr. Registrar Office",
    nodal_officer_email: "registrar@xavier.edu.in",
    registered_phone: "+91 •••••4172",
    is_active: true,
    total_approved_intake: 360,
    total_enrolled: 348,
    compliance_status: "COMPLIANT"
  },
  {
    aicte_id: "1-44525213207",
    name: "INDIAN INSTITUTE OF TECHNOLOGY BOMBAY",
    district: "Mumbai Suburban",
    state: "Maharashtra",
    institution_type: "Government",
    nodal_officer_name: "Dr. Academic Dean",
    nodal_officer_email: "dean.acad@iitb.ac.in",
    registered_phone: "+91 •••••4172",
    is_active: true,
    total_approved_intake: 1200,
    total_enrolled: 1185,
    compliance_status: "COMPLIANT"
  },
  {
    aicte_id: "1-44789123450",
    name: "D. Y. PATIL COLLEGE OF ENGINEERING",
    district: "Pune",
    state: "Maharashtra",
    institution_type: "Private-Self Financing",
    nodal_officer_name: "Prof. Nodal Officer",
    nodal_officer_email: "nodal@dypcoe.edu.in",
    registered_phone: "+91 •••••4172",
    is_active: true,
    total_approved_intake: 600,
    total_enrolled: 642,
    compliance_status: "EXCEEDED"
  }
];

export const MOCK_ALERTS: StakeholderAlertItem[] = [
  {
    id: "ALT-2026-001",
    alert_type: "INTAKE_EXCEEDED",
    severity: "CRITICAL",
    aicte_id: "1-44789123450",
    college_name: "D. Y. PATIL COLLEGE OF ENGINEERING",
    title: "Sanctioned Intake Overflow Detected (+7.0%)",
    details: "642 students enrolled against sanctioned cap of 600. Potential unauthorized supernumerary seats.",
    count: 42
  },
  {
    id: "ALT-2026-002",
    alert_type: "CROSS_INSTITUTION_CONFLICT",
    severity: "CRITICAL",
    aicte_id: "1-44465113304",
    college_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
    title: "Duplicate APAAR Enrolled Across Multiple Colleges",
    details: "APAAR ID 778899001122 active simultaneously at ST. XAVIER'S and COEP Pune.",
    count: 2
  }
];

export const MOCK_FORECASTING_RESULTS: ForecastingResult[] = [
  {
    grouping_key: "Maharashtra-UG-Engineering and Technology",
    programme: "Engineering and Technology",
    state: "Maharashtra",
    institution_type: "Govt Aided",
    current_approved_intake: 120,
    historical_points: [
      {
        year: "2021-2022",
        year_int: 2021,
        approved_intake: 120,
        actual_enrolment: 110,
        trend: 110.0,
        seasonal: 0.0,
        residual: 0.0,
        growth_rate_pct: 0.0
      },
      {
        year: "2025-2026",
        year_int: 2025,
        approved_intake: 120,
        actual_enrolment: 122,
        trend: 120.0,
        seasonal: 2.0,
        residual: 0.0,
        growth_rate_pct: 10.9
      }
    ],
    projected_year: "2026-2027",
    projected_intake_p50: 168,
    projected_intake_p10: 145,
    projected_intake_p90: 185,
    projected_overflow_pct: 40.0,
    is_critical_overflow: true,
    alert_message: "Early warning triggered: Demand surge exceeds 30%. Recommend reviewing AICTE seat sanction quota.",
    seasonal_admission_peak_month: "August",
    recommended_action: "Review institutional laboratory infrastructure before granting seat increase."
  }
];

export const MOCK_FORECASTING = {
  status: "OPTIMAL",
  model_architecture: "Time-Series Seasonal Decomposition (Trend + Seasonal + Residual)",
  historical_training_span: "2021-2022 to 2025-2026 (5-Year AICTE Master Intake Baseline)",
  prediction_season: "2026-2027 Sanctioned Demand Cycle",
  early_warning_threshold_pct: 30.0,
  forecasts: MOCK_FORECASTING_RESULTS
};

export const MOCK_REMARKS: StudentRemark[] = [
  {
    id: 1,
    apaar_id: "126430259751",
    student_name: "SANKALP HEMANT MANE",
    aicte_id: "1-44465113304",
    college_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
    remark_type: "Inaccurate Personal Details",
    description: "Date of birth was entered as 2004-06-18 instead of official Class X certificate date. Requesting sync with DigiLocker.",
    status: "RESOLVED",
    contact_email: "sankalp.mane@abc.gov.in",
    contact_mobile: "+91 •••••4172",
    created_at: "2026-10-23T10:15:00Z"
  }
];

export const MOCK_AUDIT: { total: number; records: AuditLogItem[] } = {
  total: 2,
  records: [
    {
      id: 1,
      action: "STAKEHOLDER_LOGIN_SUCCESS",
      entity_type: "Stakeholder",
      entity_id: "AICTE_HQ_NEW_DELHI",
      actor_id: "AICTE_REGULATOR",
      actor_name: "AICTE Central Regulatory Bureau",
      actor_role: "AICTE_VERIFIER",
      details: "Authorized regulatory access granted via 2FA verification.",
      timestamp: "2026-10-24T15:00:00Z"
    },
    {
      id: 2,
      action: "INSTITUTE_LOGIN_SUCCESS",
      entity_type: "College",
      entity_id: "1-44465113304",
      actor_id: "1-44465113304",
      actor_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
      actor_role: "INSTITUTE_ADMIN",
      details: "Institutional login authorized for verified nodal officer.",
      timestamp: "2026-10-24T14:30:00Z"
    }
  ]
};
