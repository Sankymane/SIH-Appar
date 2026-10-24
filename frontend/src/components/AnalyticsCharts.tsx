import React from "react";
import { AnalyticsData } from "../types";
import { BarChart2, PieChart, Users, Award, ShieldAlert } from "lucide-react";

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data }) => {
  return (
    <div style={{ marginBottom: "28px" }}>
      {/* -------------------------------------------------------------
          Top KPI Tiles
          ------------------------------------------------------------- */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-card-border-blue">
          <div className="kpi-label">Sanctioned Approved Intake</div>
          <div className="kpi-value">{data.total_approved_intake}</div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>
            Supernumerary Quota: <b>+{data.total_supernumerary_intake}</b> seats
          </div>
        </div>

        <div className="kpi-card kpi-card-border-orange">
          <div className="kpi-label">Actual Admitted Students</div>
          <div className="kpi-value">{data.total_enrolled_students}</div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>
            Capacity Utilization: <b>{data.intake_utilization_rate}%</b>
          </div>
        </div>

        <div className="kpi-card kpi-card-border-green">
          <div className="kpi-label">APAAR ID Seeding Rate</div>
          <div className="kpi-value" style={{ color: "#166534" }}>
            {data.apaar_seeding_rate}%
          </div>
          <div style={{ fontSize: "11px", color: "#166534", fontWeight: 600 }}>
            {data.total_apaar_seeded} / {data.total_enrolled_students} Valid 12-Digit IDs
          </div>
        </div>

        <div className="kpi-card kpi-card-border-red">
          <div className="kpi-label">Flagged Discrepancies</div>
          <div className="kpi-value" style={{ color: "#991b1b" }}>
            {data.total_flagged_violations}
          </div>
          <div style={{ fontSize: "11px", color: "#991b1b", fontWeight: 600 }}>
            Action Required by Nodal Officer
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          Two-Column Charts Layout
          ------------------------------------------------------------- */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px" }}>
        {/* Course-by-Course Intake vs Admitted */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
            <BarChart2 size={16} color="var(--aicte-blue)" />
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0B2265" }}>
              Department-Wise Sanctioned Intake vs. Actual Enrollment
            </h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.department_intake_comparison.map((dept, i) => {
              const pct = dept.utilization_pct;
              const isOver = dept.actual_admitted > dept.approved_intake;

              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{dept.department}</span>
                    <span style={{ fontWeight: 700, color: isOver ? "#dc2626" : "#475569" }}>
                      {dept.actual_admitted} / {dept.approved_intake} seats ({pct}%)
                    </span>
                  </div>

                  {/* Dual Bar Representation */}
                  <div style={{ width: "100%", height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, pct)}%`,
                        background: isOver ? "#ef4444" : "linear-gradient(90deg, #0B2265 0%, #163691 100%)",
                        borderRadius: "5px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quota & Category Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Quotas */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              <Award size={15} color="var(--aicte-orange)" />
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#9a3412" }}>
                Quota & Supernumerary Allocation
              </h4>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
              {Object.entries(data.quota_distribution).map(([quota, count]) => (
                <div
                  key={quota}
                  style={{
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#64748b" }}>{quota}:</span>
                  <b style={{ color: "#0B2265" }}>{count}</b>
                </div>
              ))}
            </div>
          </div>

          {/* Social Categories */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              <Users size={15} color="var(--aicte-blue)" />
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0B2265" }}>
                Demographic & Category Representation
              </h4>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "11px" }}>
              {Object.entries(data.category_distribution).map(([cat, count]) => (
                <div
                  key={cat}
                  style={{
                    background: "#f0fdf4",
                    color: "#166534",
                    border: "1px solid #bbf7d0",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  {cat}: <b>{count}</b>
                </div>
              ))}
              {Object.entries(data.gender_distribution).map(([gender, count]) => (
                <div
                  key={gender}
                  style={{
                    background: "#f0f7ff",
                    color: "#075985",
                    border: "1px solid #bae6fd",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  {gender}: <b>{count}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
