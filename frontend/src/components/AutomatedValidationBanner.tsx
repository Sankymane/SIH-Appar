import React from "react";
import { AlertTriangle, ShieldAlert, Users, AlertOctagon, HelpCircle, CheckCircle2 } from "lucide-react";

interface AutomatedValidationBannerProps {
  statusBreakdown: Record<string, number>;
  selectedFilter: string;
  onSelectFilter: (status: string) => void;
}

export const AutomatedValidationBanner: React.FC<AutomatedValidationBannerProps> = ({
  statusBreakdown,
  selectedFilter,
  onSelectFilter,
}) => {
  const totalViolations = Object.entries(statusBreakdown)
    .filter(([status]) => status !== "VALID")
    .reduce((acc, [_, count]) => acc + count, 0);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #fed7aa",
        borderRadius: "6px",
        padding: "16px 20px",
        marginBottom: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={18} color="var(--aicte-orange)" />
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#9a3412" }}>
            Automated Validation Engine (Real-Time Policy Compliance Guard)
          </h3>
        </div>
        <div style={{ fontSize: "12px", color: "#6b7280" }}>
          Active Rule Checks: <b>Cross-Institute Duplicates</b> | <b>Intake Limits</b> | <b>APAAR Format</b> | <b>Data Consistency</b>
        </div>
      </div>

      {/* Interactive Filter Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          style={{
            background: selectedFilter === "--All--" ? "var(--aicte-blue)" : "#f1f5f9",
            color: selectedFilter === "--All--" ? "#ffffff" : "#475569",
            border: "1px solid #cbd5e1",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
          }}
          onClick={() => onSelectFilter("--All--")}
        >
          All Records ({Object.values(statusBreakdown).reduce((a, b) => a + b, 0)})
        </button>

        <button
          style={{
            background: selectedFilter === "VALID" ? "#166534" : "#dcfce7",
            color: selectedFilter === "VALID" ? "#ffffff" : "#166534",
            border: "1px solid #86efac",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onClick={() => onSelectFilter("VALID")}
        >
          <CheckCircle2 size={12} /> Valid & Verified ({statusBreakdown["VALID"] || 0})
        </button>

        <button
          style={{
            background: selectedFilter === "CROSS_INSTITUTION_DUPLICATE" ? "#b91c1c" : "#fee2e2",
            color: selectedFilter === "CROSS_INSTITUTION_DUPLICATE" ? "#ffffff" : "#991b1b",
            border: "1px solid #fca5a5",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onClick={() => onSelectFilter("CROSS_INSTITUTION_DUPLICATE")}
          title="Click to filter students enrolled simultaneously in two different colleges"
        >
          <AlertOctagon size={12} /> Cross-Institution Conflict ({statusBreakdown["CROSS_INSTITUTION_DUPLICATE"] || 0})
        </button>

        <button
          style={{
            background: selectedFilter === "DUPLICATE_APAAR" ? "#b91c1c" : "#fee2e2",
            color: selectedFilter === "DUPLICATE_APAAR" ? "#ffffff" : "#991b1b",
            border: "1px solid #fca5a5",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onClick={() => onSelectFilter("DUPLICATE_APAAR")}
        >
          <Users size={12} /> Same-College Duplicate ({statusBreakdown["DUPLICATE_APAAR"] || 0})
        </button>

        <button
          style={{
            background: selectedFilter === "INTAKE_EXCEEDED" ? "#b91c1c" : "#fee2e2",
            color: selectedFilter === "INTAKE_EXCEEDED" ? "#ffffff" : "#991b1b",
            border: "1px solid #fca5a5",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onClick={() => onSelectFilter("INTAKE_EXCEEDED")}
        >
          <AlertTriangle size={12} /> Approved Intake Exceeded ({statusBreakdown["INTAKE_EXCEEDED"] || 0})
        </button>

        <button
          style={{
            background: selectedFilter === "MISSING_APAAR" ? "#d97706" : "#fef3c7",
            color: selectedFilter === "MISSING_APAAR" ? "#ffffff" : "#92400e",
            border: "1px solid #fde68a",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onClick={() => onSelectFilter("MISSING_APAAR")}
        >
          <HelpCircle size={12} /> Missing APAAR ID ({statusBreakdown["MISSING_APAAR"] || 0})
        </button>

        <button
          style={{
            background: selectedFilter === "INVALID_APAAR_FORMAT" ? "#d97706" : "#fef3c7",
            color: selectedFilter === "INVALID_APAAR_FORMAT" ? "#ffffff" : "#92400e",
            border: "1px solid #fde68a",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
          }}
          onClick={() => onSelectFilter("INVALID_APAAR_FORMAT")}
        >
          Invalid Format ({statusBreakdown["INVALID_APAAR_FORMAT"] || 0})
        </button>

        <button
          style={{
            background: selectedFilter === "DATA_INCONSISTENCY" ? "#7c3aed" : "#ede9fe",
            color: selectedFilter === "DATA_INCONSISTENCY" ? "#ffffff" : "#5b21b6",
            border: "1px solid #ddd6fe",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
          }}
          onClick={() => onSelectFilter("DATA_INCONSISTENCY")}
        >
          Data Inconsistency ({statusBreakdown["DATA_INCONSISTENCY"] || 0})
        </button>
      </div>
    </div>
  );
};
