import React, { useState, useEffect } from "react";
import { fetchInstitutions, fetchFilterOptions } from "../api";
import { CollegeSummary } from "../types";
import { Search, Building, ChevronRight, BarChart2 } from "lucide-react";

interface InstitutionsExplorerProps {
  onSelectCollege: (aicte_id: string) => void;
  onDirectLoginWithCollege: (aicte_id: string, name: string) => void;
}

export const InstitutionsExplorer: React.FC<InstitutionsExplorerProps> = ({
  onSelectCollege,
  onDirectLoginWithCollege,
}) => {
  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>("2026-2027");
  const [selectedState, setSelectedState] = useState<string>("Maharashtra");
  const [selectedProgram, setSelectedProgram] = useState<string>("--All--");
  const [selectedLevel, setSelectedLevel] = useState<string>("--All--");
  const [courseSearch, setCourseSearch] = useState<string>("");
  const [selectedInstType, setSelectedInstType] = useState<string>("--All--");
  const [minority, setMinority] = useState<string>("--All--");
  const [women, setWomen] = useState<string>("--All--");

  // Table options
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Data states
  const [institutions, setInstitutions] = useState<CollegeSummary[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterOptions, setFilterOptions] = useState<any>({
    states: ["Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Goa", "Gujarat", "Uttar Pradesh"],
    institution_types: ["--All--", "Government", "Private-Self Financing", "Govt aided", "Central University"],
    years: ["2026-2027", "2025-2026", "2024-2025", "2023-2024"],
    programs: ["--All--", "Engineering and Technology", "Management", "MCA", "Pharmacy"],
    levels: ["--All--", "UG", "PG", "Diploma"],
  });

  // Load filter options on mount
  useEffect(() => {
    fetchFilterOptions().then((opts) => {
      if (opts && opts.states) {
        setFilterOptions(opts);
      }
    });
  }, []);

  // Fetch institutions
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchInstitutions({
        state: selectedState,
        institution_type: selectedInstType,
        minority: minority,
        women: women,
        search: searchQuery || courseSearch,
        page: currentPage,
        page_size: pageSize,
      });
      setInstitutions(res.records || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error("Failed to load institutions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  const handleSubmitFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  return (
    <div className="explorer-layout">
      {/* ---------------------------------------------------------------
          LEFT SIDEBAR: Filters (Mirroring Screenshot #2)
          --------------------------------------------------------------- */}
      <aside className="sidebar-filters">
        <div className="sidebar-logo-card">
          <svg viewBox="0 0 100 100" style={{ width: "90px", height: "90px", margin: "0 auto" }}>
            <circle cx="50" cy="50" r="46" fill="#F75700" stroke="#0B2265" strokeWidth="2" />
            <circle cx="50" cy="50" r="38" fill="#FFF9F5" />
            <circle cx="50" cy="50" r="28" stroke="#0B2265" strokeWidth="3" strokeDasharray="6 3" />
            <path d="M50 24 L52 30 L48 30 Z" fill="#0B2265" />
            <path d="M50 76 L52 70 L48 70 Z" fill="#0B2265" />
            <path d="M24 50 L30 52 L30 48 Z" fill="#0B2265" />
            <path d="M76 50 L70 52 L70 48 Z" fill="#0B2265" />
            <path d="M38 56 C38 64 62 64 62 56 L38 56 Z" fill="#0B2265" />
            <path d="M50 42 C47 48 53 48 50 42 Z" fill="#F75700" />
            <circle cx="50" cy="46" r="2" fill="#FFC107" />
          </svg>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#1f2937", marginTop: "6px" }}>
            AICTE Approved Institutes Registry
          </div>
        </div>

        <form onSubmit={handleSubmitFilters}>
          {/* Year */}
          <div className="filter-group">
            <label>Year</label>
            <select
              className="filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {filterOptions.years.map((y: string) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Select State */}
          <div className="filter-group">
            <label>Select State</label>
            <select
              className="filter-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              {filterOptions.states.map((st: string) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Select Program */}
          <div className="filter-group">
            <label>Select Program</label>
            <select
              className="filter-select"
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
            >
              {filterOptions.programs.map((p: string) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Select Level */}
          <div className="filter-group">
            <label>Select Level</label>
            <select
              className="filter-select"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              {filterOptions.levels.map((lvl: string) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          {/* Course Search */}
          <div className="filter-group">
            <label>Course:</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Type course name (e.g. Computer)"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
            />
            <div style={{ fontSize: "10px", color: "#d32f2f", marginTop: "3px", fontWeight: 600 }}>
              Suggestions: Computer, Civil, Mechanical, MBA, MCA
            </div>
          </div>

          {/* University / Institution Type */}
          <div className="filter-group">
            <label>University/Institution Type</label>
            <select
              className="filter-select"
              value={selectedInstType}
              onChange={(e) => setSelectedInstType(e.target.value)}
            >
              <option value="--All--">--All--</option>
              {filterOptions.institution_types.filter((t: string) => t !== "--All--").map((t: string) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Minority & Women row */}
          <div className="filter-row-half">
            <div className="filter-group">
              <label>Minority</label>
              <select
                className="filter-select"
                value={minority}
                onChange={(e) => setMinority(e.target.value)}
              >
                <option value="--All--">--All--</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Women</label>
              <select
                className="filter-select"
                value={women}
                onChange={(e) => setWomen(e.target.value)}
              >
                <option value="--All--">--All--</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-filter-submit">
            Submit
          </button>
        </form>
      </aside>

      {/* ---------------------------------------------------------------
          MAIN CONTENT AREA: Data Table (Mirroring Screenshot #2)
          --------------------------------------------------------------- */}
      <main className="explorer-content">
        <h2 className="explorer-header-title">
          List of AICTE approved Institutes for the state {selectedState} for the academic year: {selectedYear}
        </h2>

        {/* DataTables Controls */}
        <div className="datatable-controls">
          <div>
            Show
            <select
              className="dt-length-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            entries
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label style={{ fontSize: "13px" }}>Search:</label>
            <input
              type="text"
              className="dt-search-input"
              placeholder="Search by ID, name, district..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Institutional Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="aicte-table">
            <thead>
              <tr>
                <th style={{ width: "11%" }}>Aicte ID</th>
                <th style={{ width: "24%" }}>Name</th>
                <th style={{ width: "24%" }}>Address</th>
                <th style={{ width: "10%" }}>District</th>
                <th style={{ width: "11%" }}>Institution Type</th>
                <th style={{ width: "4%", textAlign: "center" }}>Women</th>
                <th style={{ width: "4%", textAlign: "center" }}>Minority</th>
                <th style={{ width: "6%", textAlign: "center" }}>Course Details</th>
                <th style={{ width: "6%", textAlign: "center" }}>Faculty Details</th>
                <th style={{ width: "10%", textAlign: "center", background: "#f0fdf4" }}>APAAR Intake & Verification</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ display: "inline-block", color: "#f75700", fontWeight: 600 }}>
                      Loading AICTE Institutions Database...
                    </div>
                  </td>
                </tr>
              ) : institutions.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                    No institutes found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                institutions.map((c) => (
                  <tr key={c.aicte_id}>
                    <td style={{ fontWeight: 600, color: "#0B2265" }}>
                      {c.aicte_id}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <span
                        style={{ cursor: "pointer", color: "#0B2265" }}
                        onClick={() => onSelectCollege(c.aicte_id)}
                        title="Click to view Approved Intake vs. Actual Students Admitted"
                      >
                        {c.name}
                      </span>
                    </td>
                    <td style={{ fontSize: "11px", color: "#4b5563" }}>{c.address}</td>
                    <td style={{ fontWeight: 500 }}>{c.district}</td>
                    <td style={{ fontSize: "11px" }}>{c.institution_type}</td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{c.women}</td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{c.minority}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn-table-action"
                        onClick={() => onSelectCollege(c.aicte_id)}
                      >
                        Click Here
                      </button>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button className="btn-table-na">NA</button>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        style={{
                          background: "#0B2265",
                          color: "#ffffff",
                          border: "none",
                          padding: "4px 8px",
                          borderRadius: "3px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px"
                        }}
                        onClick={() => onSelectCollege(c.aicte_id)}
                        title="View Intake vs Actual Enrolment Slide"
                      >
                        <BarChart2 size={11} /> Intake Slide
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Records Found banner & Pagination Footer */}
        <div style={{ textAlign: "center", fontWeight: 700, color: "#166534", margin: "14px 0 6px" }}>
          Records Found: {totalRecords}
        </div>

        <div className="datatable-footer">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
          </div>

          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  className={`page-btn ${currentPage === pNum ? "active" : ""}`}
                  onClick={() => setCurrentPage(pNum)}
                >
                  {pNum}
                </button>
              );
            })}
            {totalPages > 5 && <span style={{ padding: "4px" }}>... {totalPages}</span>}
            <button
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {/* Exact note matching screenshot #2 */}
        <div className="portal-notice-note">
          Note : Faculty Data will display only for Current Academic Year
        </div>

        {/* Hit counter */}
        <div className="hit-counter-container">
          Number of Hits: <b style={{ color: "#000" }}>8358112</b>
          <br />
          <span style={{ fontSize: "10px" }}>* Based on Self Disclosure and APAAR Verification.</span>
        </div>
      </main>
    </div>
  );
};
