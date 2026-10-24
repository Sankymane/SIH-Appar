import React, { useRef, useState } from "react";
import {
  ScanSearch,
  Play,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { runIntegrityAudit, runIntegrityDemo, INTEGRITY_DEMO_CSV_URL } from "../api";
import { IntegrityBatchReport, IntegrityRecordResult, IntegrityRisk } from "../types";

const VERDICT_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  APPROVED: { bg: "#dcfce7", fg: "#166534", label: "APPROVED" },
  PROVISIONAL_AUDIT: { bg: "#fef3c7", fg: "#92400e", label: "PROVISIONAL AUDIT" },
  REJECTED_HEARING: { bg: "#fee2e2", fg: "#991b1b", label: "REJECTED - HEARING REQUIRED" },
};

const RISK_STYLE: Record<IntegrityRisk, { bg: string; fg: string }> = {
  LOW: { bg: "#dcfce7", fg: "#166534" },
  MEDIUM: { bg: "#fef3c7", fg: "#92400e" },
  HIGH: { bg: "#ffedd5", fg: "#9a3412" },
  CRITICAL: { bg: "#fee2e2", fg: "#991b1b" },
};

const LAYERS: Array<[string, string]> = [
  ["L1", "APAAR format (12 digits)"],
  ["L2", "Central registry: present, ACTIVE, name/DOB match"],
  ["L3", "Approved intake & supernumerary quotas"],
  ["L4", "Cross-college & duplicate enrollment"],
  ["L5", "Statistical anomalies & risk score"],
];

type Filter = "FLAGGED" | "ALL" | "CRITICAL";

export const IntegrityAuditView: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<IntegrityBatchReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<Filter>("FLAGGED");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [source, setSource] = useState<string>("");

  const run = async (fn: () => Promise<IntegrityBatchReport>, label: string) => {
    setLoading(true);
    setError("");
    try {
      const r = await fn();
      setReport(r);
      setSource(label);
      setOpen({});
      setFilter("FLAGGED");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Integrity audit failed");
    } finally {
      setLoading(false);
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) run(() => runIntegrityAudit(f), f.name);
    e.target.value = "";
  };

  const visible: IntegrityRecordResult[] = report
    ? report.record_results.filter((r) =>
        filter === "ALL" ? true : filter === "CRITICAL" ? r.risk_level === "CRITICAL" : !r.is_valid || r.composite_risk_score > 0
      )
    : [];

  const verdict = report ? VERDICT_STYLE[report.regulatory_verdict] : null;

  return (
    <div style={{ maxWidth: "1280px", margin: "20px auto", padding: "0 24px" }}>
      {/* Title card */}
      <div
        style={{
          background: "linear-gradient(135deg, #0B2265 0%, #071744 100%)",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <ScanSearch size={22} />
          <h2 style={{ fontSize: "18px", fontWeight: 800 }}>Enrollment Integrity &amp; Anomaly Detection</h2>
        </div>
        <p style={{ fontSize: "12px", color: "#cbd5e1", marginBottom: "12px" }}>
          Upload an admission batch to run the five-layer audit and get a per-student risk score, an Institutional Risk Index and an AICTE regulatory determination.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {LAYERS.map(([k, v]) => (
            <span
              key={k}
              style={{ background: "rgba(255,255,255,0.12)", borderRadius: "14px", padding: "3px 10px", fontSize: "11px" }}
            >
              <b>{k}</b> {v}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => run(runIntegrityDemo, "Planted demo batch")}
          disabled={loading}
          style={{
            background: "var(--aicte-orange)",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "9px 16px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Play size={14} /> Run planted demo batch
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          style={{
            background: "#fff",
            color: "var(--aicte-blue)",
            border: "2px solid var(--aicte-blue)",
            borderRadius: "4px",
            padding: "7px 14px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Upload size={14} /> Upload batch CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={onPickFile} />
        <a
          href={INTEGRITY_DEMO_CSV_URL}
          style={{ fontSize: "12px", color: "var(--aicte-blue)", display: "inline-flex", alignItems: "center", gap: "4px" }}
        >
          <Download size={13} /> Download the demo CSV (shows the expected columns)
        </a>
        {loading && <span style={{ fontSize: "12px", color: "#64748b" }}>Running L1-L5 checks...</span>}
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            borderRadius: "6px",
            padding: "10px 14px",
            fontSize: "13px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {!report && !error && !loading && (
        <div
          style={{
            background: "#fff",
            border: "1px dashed #cbd5e1",
            borderRadius: "8px",
            padding: "40px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          No audit run yet. Start with <b>Run planted demo batch</b> to see every layer fire.
        </div>
      )}

      {report && verdict && (
        <>
          {/* Verdict + KPIs */}
          <div
            style={{
              background: verdict.bg,
              color: verdict.fg,
              borderRadius: "8px",
              padding: "14px 20px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.8 }}>REGULATORY DETERMINATION</div>
              <div style={{ fontSize: "20px", fontWeight: 800 }}>{verdict.label}</div>
              <div style={{ fontSize: "12px" }}>
                {report.institution_name} ({report.institution_id}) &middot; {report.academic_year} &middot; source: {source}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.8 }}>INSTITUTIONAL RISK INDEX</div>
              <div style={{ fontSize: "28px", fontWeight: 800 }}>{report.institution_risk_index.toFixed(1)}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Records", value: report.total_records, color: "#0B2265" },
              { label: "Clean", value: report.clean_records_count, color: "#166534" },
              { label: "Flagged", value: report.flagged_records_count, color: "#9a3412" },
              { label: "Critical risk", value: report.critical_records_count, color: "#991b1b" },
              { label: "Anomaly clusters", value: report.anomaly_clusters.length, color: "#5b21b6" },
            ].map((k) => (
              <div key={k.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px 14px" }}>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>{k.label.toUpperCase()}</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Capacity */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "16px 20px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0B2265", marginBottom: "10px" }}>
              Approved intake vs enrolled (per programme)
            </h3>
            {Object.values(report.program_capacity_utilization).map((p) => {
              const max = Math.max(p.approved_intake, p.total_enrolled, 1);
              return (
                <div key={p.program_code} style={{ marginBottom: "10px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <b>{p.program_code}</b>
                    <span style={{ color: p.is_overflow ? "#991b1b" : "#166534", fontWeight: 700 }}>
                      {p.total_enrolled} enrolled / {p.approved_intake} approved
                      {p.is_overflow ? ` (+${p.overflow_count} over the limit)` : ""}
                    </span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: "4px", height: "10px", position: "relative" }}>
                    <div
                      style={{
                        width: `${(p.total_enrolled / max) * 100}%`,
                        background: p.is_overflow ? "#d32f2f" : "#2e7d32",
                        height: "10px",
                        borderRadius: "4px",
                      }}
                    />
                    <div
                      title="Approved intake"
                      style={{
                        position: "absolute",
                        left: `${(p.approved_intake / max) * 100}%`,
                        top: "-3px",
                        width: "2px",
                        height: "16px",
                        background: "#0B2265",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Records */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: "8px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0B2265" }}>Student-level findings ({visible.length})</h3>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["FLAGGED", "CRITICAL", "ALL"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      background: filter === f ? "var(--aicte-blue)" : "#f1f5f9",
                      color: filter === f ? "#fff" : "#475569",
                      border: "1px solid #cbd5e1",
                      borderRadius: "16px",
                      padding: "4px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {f === "FLAGGED" ? "Flagged" : f === "CRITICAL" ? "Critical only" : "All records"}
                  </button>
                ))}
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#0B2265", color: "#fff", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px", width: "28px" }}></th>
                  <th style={{ padding: "8px 12px" }}>Record</th>
                  <th style={{ padding: "8px 12px" }}>Student</th>
                  <th style={{ padding: "8px 12px" }}>APAAR ID</th>
                  <th style={{ padding: "8px 12px" }}>Programme</th>
                  <th style={{ padding: "8px 12px" }}>Risk</th>
                  <th style={{ padding: "8px 12px" }}>Findings</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const isOpen = !!open[r.record_id];
                  const rs = RISK_STYLE[r.risk_level];
                  const expandable = r.violations.length > 0;
                  return (
                    <React.Fragment key={r.record_id}>
                      <tr
                        onClick={() => expandable && setOpen({ ...open, [r.record_id]: !isOpen })}
                        style={{ borderBottom: "1px solid #eef2f7", cursor: expandable ? "pointer" : "default" }}
                      >
                        <td style={{ padding: "8px 12px" }}>
                          {expandable ? isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} /> : null}
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 700 }}>{r.record_id}</td>
                        <td style={{ padding: "8px 12px" }}>{r.student_name}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{r.apaar_id}</td>
                        <td style={{ padding: "8px 12px" }}>{r.program_code}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ background: rs.bg, color: rs.fg, borderRadius: "10px", padding: "2px 8px", fontWeight: 700, fontSize: "11px" }}>
                            {r.risk_level} &middot; {r.composite_risk_score.toFixed(0)}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {r.violations.length === 0 ? (
                            <span style={{ color: "#166534", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <CheckCircle2 size={12} /> Clean
                            </span>
                          ) : (
                            <span style={{ color: "#9a3412", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <AlertTriangle size={12} /> {r.violations.length} rule{r.violations.length > 1 ? "s" : ""} triggered
                            </span>
                          )}
                        </td>
                      </tr>
                      {isOpen &&
                        r.violations.map((v, i) => (
                          <tr key={`${r.record_id}-${i}`} style={{ background: "#f8fafc", borderBottom: "1px solid #eef2f7" }}>
                            <td></td>
                            <td colSpan={6} style={{ padding: "8px 12px" }}>
                              <div style={{ display: "flex", gap: "8px", alignItems: "baseline", flexWrap: "wrap" }}>
                                <ShieldAlert size={12} color="#9a3412" />
                                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0B2265" }}>{v.rule_code}</span>
                                <span style={{ fontSize: "10px", background: "#e2e8f0", borderRadius: "8px", padding: "1px 6px" }}>
                                  {v.layer.split("_")[0]} &middot; {v.severity}
                                </span>
                              </div>
                              <div style={{ margin: "3px 0 0 20px", color: "#334155" }}>{v.message}</div>
                              <div style={{ margin: "2px 0 0 20px", color: "#64748b" }}>
                                <b>Action:</b> {v.remediation}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                      No records match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default IntegrityAuditView;
