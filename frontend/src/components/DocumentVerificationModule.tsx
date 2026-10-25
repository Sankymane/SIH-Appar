import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  Download,
  RefreshCw,
  Info,
  ExternalLink,
  Cpu,
  Lock,
  ChevronRight,
  Maximize2
} from "lucide-react";
import {
  ForensicVerificationResult,
  ForensicSample,
  AnomalyRegion
} from "../types";
import { verifyDocument, fetchSampleDocuments } from "../api";

export const DocumentVerificationModule: React.FC = () => {
  // Upload and file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Analysis & Loading state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<ForensicVerificationResult | null>(null);

  // Quick Demo Samples
  const [samples, setSamples] = useState<ForensicSample[]>([]);
  const [loadingSamples, setLoadingSamples] = useState<boolean>(false);

  // Visualizer settings
  const [viewMode, setViewMode] = useState<"overlay" | "ela" | "raw" | "side_by_side">("overlay");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(65); // 0 to 100%
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Analysis step progress simulation
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isAnalyzing) {
      setAnalysisStep(1);
      timer = setInterval(() => {
        setAnalysisStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 700);
    } else {
      setAnalysisStep(0);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing]);

  // Load samples on mount
  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    setLoadingSamples(true);
    try {
      const data = await fetchSampleDocuments();
      setSamples(data);
    } catch {
      // Handled silently
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setUploadError(null);
    setAnalysisResult(null);

    // Validate size (15MB max)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 15 MB regulatory limit.`);
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Validate type
    const validExtensions = [".png", ".jpg", ".jpeg", ".webp", ".tiff", ".pdf"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setUploadError(`Unsupported document format '${ext}'. Accepted formats: PNG, JPG, JPEG, WEBP, TIFF, PDF.`);
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    setSelectedFile(file);

    // Create local preview if image
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // PDF representation
      setFilePreview(null);
    }
  };

  const executeAnalysis = async (fileToVerify?: File) => {
    const file = fileToVerify || selectedFile;
    if (!file) {
      setUploadError("Please select a document or sample certificate to verify.");
      return;
    }

    setIsAnalyzing(true);
    setUploadError(null);
    setAnalysisResult(null);

    try {
      const result = await verifyDocument(file);
      setAnalysisResult(result);
    } catch (err: any) {
      setUploadError(err.message || "Forensic analysis failed. Please verify stakeholder authorization.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run a sample certificate directly
  const runSample = async (sample: ForensicSample) => {
    setUploadError(null);
    setAnalysisResult(null);

    // Convert sample data_uri to File object
    try {
      const res = await fetch(sample.data_uri);
      const blob = await res.blob();
      const filename = `${sample.id}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      setSelectedFile(file);
      setFilePreview(sample.data_uri);

      // Execute directly
      executeAnalysis(file);
    } catch (err: any) {
      setUploadError("Failed to load sample: " + err.message);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setAnalysisResult(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const stepLabels = [
    "Decompressing document & rasterizing vector layers...",
    "Executing PhotoHolmes Zero (JPEG grid & quantization alignment)...",
    "Computing Error Level Analysis (ELA 90% re-compression discrepancy)...",
    "Calculating localized noise variance & generating tamper heatmaps..."
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0B2265 0%, #1e3a8a 60%, #1e1b4b 100%)",
          borderRadius: "16px",
          padding: "24px 30px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 10px 25px -5px rgba(11, 34, 101, 0.3)"
        }}
      >
        <div style={{ maxWidth: "700px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                background: "rgba(255, 87, 34, 0.25)",
                color: "#ffedd5",
                border: "1px solid rgba(255, 87, 34, 0.5)",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <Lock size={12} /> RESTRICTED REGULATORY ACCESS (STAKEHOLDER ONLY)
            </span>
            <span
              style={{
                background: "rgba(5, 150, 105, 0.25)",
                color: "#a7f3d0",
                border: "1px solid rgba(5, 150, 105, 0.4)",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <Cpu size={12} /> PHOTOHOLMES MULTI-ALGORITHM CORE
            </span>
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px 0", color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={28} style={{ color: "#38bdf8" }} />
            Document Forensic & Forgery Detection Studio
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#cbd5e1", lineHeight: 1.5 }}>
            Automated tamper detection for academic transcripts, approval letters, and caste certificates.
            Powered by <strong>PhotoHolmes</strong> (JPEG grid artifact alignment, Error Level Analysis 90%, and localized noise variance estimation).
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              padding: "8px 16px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              fontSize: "12px",
              color: "#f1f5f9"
            }}
          >
            Role: <strong>STAKEHOLDER_VERIFIER</strong> | 2FA Cleared
          </div>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Max Payload: 15 MB | PDF & High-Res Images</span>
        </div>
      </div>

      {/* Error Alert Box */}
      {uploadError && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#991b1b"
          }}
        >
          <XCircle size={22} style={{ flexShrink: 0, color: "#dc2626" }} />
          <div style={{ flex: 1, fontSize: "14px", fontWeight: 500 }}>{uploadError}</div>
          <button
            onClick={() => setUploadError(null)}
            style={{
              background: "none",
              border: "none",
              color: "#991b1b",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px"
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Upload & Inspection Controls */}
      <div style={{ display: "grid", gridTemplateColumns: analysisResult ? "1fr" : "1.4fr 1fr", gap: "24px" }}>
        {/* Upload Zone */}
        {!analysisResult && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0B2265", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Upload size={18} style={{ color: "#FF5722" }} />
              Upload Document for Forensic Verification
            </h3>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? "2px dashed #0B2265" : "2px dashed #cbd5e1",
                background: isDragging ? "#eff6ff" : selectedFile ? "#f8fafc" : "#fafafa",
                borderRadius: "14px",
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.tiff,.pdf,application/pdf,image/*"
                onChange={handleFileInputChange}
                style={{ display: "none" }}
              />

              {selectedFile ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      background: "#e0e7ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#4338ca"
                    }}
                  >
                    {selectedFile.name.endsWith(".pdf") ? <FileText size={28} /> : <ImageIcon size={28} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>{selectedFile.name}</div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "Document"}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#059669",
                      background: "#dcfce7",
                      padding: "4px 12px",
                      borderRadius: "16px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <CheckCircle2 size={13} /> Ready for PhotoHolmes Pipeline
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b"
                    }}
                  >
                    <Upload size={24} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: "#0B2265", fontSize: "15px" }}>Click to select</span> or drag & drop document here
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    PDF, PNG, JPG, JPEG, WEBP or TIFF (Max 15MB)
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ marginTop: "20px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              {selectedFile && (
                <button
                  onClick={resetAll}
                  disabled={isAnalyzing}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: isAnalyzing ? "not-allowed" : "pointer"
                  }}
                >
                  Clear
                </button>
              )}

              <button
                onClick={() => executeAnalysis()}
                disabled={!selectedFile || isAnalyzing}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: !selectedFile || isAnalyzing ? "#94a3b8" : "linear-gradient(135deg, #0B2265 0%, #1e40af 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: !selectedFile || isAnalyzing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(11, 34, 101, 0.2)"
                }}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" style={{ animation: "spin 1s linear infinite" }} />
                    Running Forensic Analysis...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Verify Document Authenticity
                  </>
                )}
              </button>
            </div>

            {/* Multi-step loading bar */}
            {isAnalyzing && (
              <div style={{ marginTop: "20px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "#0B2265" }}>
                  <span>Forensic Analysis in Progress</span>
                  <span>Step {analysisStep} of 4</span>
                </div>
                <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(analysisStep / 4) * 100}%`,
                      background: "linear-gradient(90deg, #3b82f6 0%, #FF5722 100%)",
                      transition: "width 0.4s ease"
                    }}
                  />
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Cpu size={14} style={{ color: "#3b82f6" }} />
                  {stepLabels[analysisStep - 1] || "Initializing neural pipeline..."}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1-Click Test Samples Panel */}
        {!analysisResult && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0B2265", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} style={{ color: "#8b5cf6" }} />
                Instant 1-Click Verification Test Bench
              </h3>
            </div>

            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
              Test the PhotoHolmes pipeline immediately with pre-loaded AICTE certificates designed with authentic layout vs. tampered CGPA marks & spliced regulatory seal:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              {samples.length > 0 ? (
                samples.map((sample) => {
                  const isTampered = sample.expected_verdict === "TAMPERED_FORGERY";
                  return (
                    <div
                      key={sample.id}
                      onClick={() => !isAnalyzing && runSample(sample)}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        border: isTampered ? "1.5px solid #fecaca" : "1.5px solid #bbf7d0",
                        background: isTampered ? "#fff5f5" : "#f0fdf4",
                        cursor: isAnalyzing ? "not-allowed" : "pointer",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          background: isTampered ? "#fee2e2" : "#dcfce7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isTampered ? "#b91c1c" : "#15803d",
                          flexShrink: 0
                        }}
                      >
                        {isTampered ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 700, fontSize: "14px", color: isTampered ? "#991b1b" : "#166534" }}>
                            {sample.name}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: isTampered ? "#ef4444" : "#10b981",
                              color: "#ffffff"
                            }}
                          >
                            {isTampered ? "TAMPERED" : "GENUINE"}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                          {sample.description}
                        </p>
                      </div>

                      <ChevronRight size={18} style={{ color: "#94a3b8" }} />
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "13px" }}>
                  {loadingSamples ? "Loading test fixtures..." : "No test fixtures found on server."}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: "16px",
                background: "#f8fafc",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                color: "#64748b",
                display: "flex",
                gap: "8px",
                alignItems: "flex-start"
              }}
            >
              <Info size={16} style={{ color: "#0B2265", flexShrink: 0, marginTop: "2px" }} />
              <div>
                Documents with forged elements exhibit localized JPEG quantization differences, high-frequency boundary energy, and error residuals flagged automatically by PhotoHolmes.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RESULTS VISUALIZATION STUDIO */}
      {analysisResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Verdict Banner */}
          <div
            style={{
              borderRadius: "16px",
              padding: "24px 28px",
              background:
                analysisResult.verdict === "TAMPERED_FORGERY"
                  ? "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)"
                  : analysisResult.verdict === "SUSPICIOUS"
                  ? "linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)"
                  : "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
              color: "#ffffff",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255, 255, 255, 0.3)"
                }}
              >
                {analysisResult.verdict === "TAMPERED_FORGERY" ? (
                  <ShieldAlert size={38} style={{ color: "#fca5a5" }} />
                ) : analysisResult.verdict === "SUSPICIOUS" ? (
                  <AlertTriangle size={38} style={{ color: "#fcd34d" }} />
                ) : (
                  <ShieldCheck size={38} style={{ color: "#6ee7b7" }} />
                )}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      padding: "3px 10px",
                      borderRadius: "14px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.5px"
                    }}
                  >
                    FORENSIC VERDICT
                  </span>
                  <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.8)" }}>
                    Document: <strong>{analysisResult.filename}</strong>
                  </span>
                </div>

                <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                  {analysisResult.verdict === "TAMPERED_FORGERY"
                    ? "FORGERY DETECTED — DOCUMENT TAMPERED"
                    : analysisResult.verdict === "SUSPICIOUS"
                    ? "SUSPICIOUS INCONSISTENCIES FLAGGED"
                    : "DOCUMENT AUTHENTIC — VERIFIED"}
                </h1>

                <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "rgba(255, 255, 255, 0.9)", maxWidth: "700px" }}>
                  {analysisResult.analysis_summary}
                </p>
              </div>
            </div>

            {/* Verdict Stats Badges */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  backdropFilter: "blur(8px)",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: "1px solid rgba(255, 255, 255, 0.15)"
                }}
              >
                <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>TAMPER PROBABILITY</div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: analysisResult.forgery_probability > 50 ? "#fca5a5" : "#6ee7b7" }}>
                  {analysisResult.forgery_probability}%
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  backdropFilter: "blur(8px)",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: "1px solid rgba(255, 255, 255, 0.15)"
                }}
              >
                <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>CONFIDENCE SCORE</div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#ffffff" }}>
                  {analysisResult.confidence_score <= 1.0
                    ? Math.round(analysisResult.confidence_score * 100)
                    : analysisResult.confidence_score}%
                </div>
              </div>

              <button
                onClick={resetAll}
                style={{
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 20px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                }}
              >
                <RefreshCw size={15} /> Verify Another Document
              </button>
            </div>
          </div>

          {/* Interactive Inspection Workspace */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              overflow: "hidden"
            }}
          >
            {/* Visualizer Toolbar */}
            <div
              style={{
                background: "#0f172a",
                color: "#ffffff",
                padding: "14px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px"
              }}
            >
              {/* View Mode Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginRight: "4px" }}>
                  VIEW MODE:
                </span>
                <button
                  onClick={() => setViewMode("overlay")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    background: viewMode === "overlay" ? "#FF5722" : "#1e293b",
                    color: "#ffffff"
                  }}
                >
                  Thermal Heatmap Overlay
                </button>
                <button
                  onClick={() => setViewMode("side_by_side")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    background: viewMode === "side_by_side" ? "#FF5722" : "#1e293b",
                    color: "#ffffff"
                  }}
                >
                  Side-by-Side Comparison
                </button>
                <button
                  onClick={() => setViewMode("ela")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    background: viewMode === "ela" ? "#FF5722" : "#1e293b",
                    color: "#ffffff"
                  }}
                >
                  ELA Compression Difference
                </button>
                <button
                  onClick={() => setViewMode("raw")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    background: viewMode === "raw" ? "#FF5722" : "#1e293b",
                    color: "#ffffff"
                  }}
                >
                  Raw Thermal Spectrum
                </button>
              </div>

              {/* Opacity Slider & Bounding Box Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                {viewMode === "overlay" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Sliders size={15} style={{ color: "#94a3b8" }} />
                    <span style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 600 }}>
                      Heatmap Intensity: <strong>{overlayOpacity}%</strong>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                      style={{
                        width: "120px",
                        accentColor: "#FF5722",
                        cursor: "pointer"
                      }}
                    />
                  </div>
                )}

                {analysisResult.anomaly_regions.length > 0 && (
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#cbd5e1", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showBoundingBoxes}
                      onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                      style={{ accentColor: "#ef4444" }}
                    />
                    Highlight Tampered Regions ({analysisResult.anomaly_regions.length})
                  </label>
                )}
              </div>
            </div>

            {/* Document Viewer Frame */}
            <div
              style={{
                padding: "24px",
                background: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "450px"
              }}
            >
              {viewMode === "side_by_side" ? (
                /* Side-by-Side Dual View */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%", maxWidth: "1100px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0B2265", marginBottom: "8px" }}>
                      Original Document
                    </div>
                    <div
                      style={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                      }}
                    >
                      <img
                        src={analysisResult.original_image_base64}
                        alt="Original Document"
                        style={{ width: "100%", height: "auto", display: "block" }}
                      />
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#991b1b", marginBottom: "8px" }}>
                      PhotoHolmes Thermal Anomaly Overlay
                    </div>
                    <div
                      style={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid #cbd5e1",
                        background: "#000000",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                      }}
                    >
                      <img
                        src={analysisResult.heatmap_overlay_base64}
                        alt="Anomaly Overlay"
                        style={{ width: "100%", height: "auto", display: "block" }}
                      />
                    </div>
                  </div>
                </div>
              ) : viewMode === "ela" ? (
                /* ELA Visual */
                <div style={{ maxWidth: "700px", width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0B2265", marginBottom: "8px" }}>
                    Error Level Analysis (ELA 90% Quality Compression Inconsistencies)
                  </div>
                  <div
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #cbd5e1",
                      background: "#000000",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.1)"
                    }}
                  >
                    <img
                      src={analysisResult.ela_visual_base64}
                      alt="ELA Visual"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                  </div>
                  <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                    Brighter or divergent noise patches indicate modified pixels saved at different compression levels than the original document body.
                  </p>
                </div>
              ) : viewMode === "raw" ? (
                /* Raw Thermal Spectrum */
                <div style={{ maxWidth: "700px", width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0B2265", marginBottom: "8px" }}>
                    PhotoHolmes Raw Normalized Thermal Anomaly Spectrum (JET)
                  </div>
                  <div
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #cbd5e1",
                      background: "#000000",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.1)"
                    }}
                  >
                    <img
                      src={analysisResult.heatmap_raw_base64}
                      alt="Raw Thermal Heatmap"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                  </div>
                  <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                    Deep blue = homogeneous genuine substrate. Vibrant yellow/red = high tamper anomaly confidence.
                  </p>
                </div>
              ) : (
                /* Overlay Blend Mode with Interactive Opacity & Bounding Boxes */
                <div
                  ref={imageContainerRef}
                  style={{
                    position: "relative",
                    maxWidth: "750px",
                    width: "100%",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {/* Base Original Image */}
                  <img
                    src={analysisResult.original_image_base64}
                    alt="Original Document Base"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />

                  {/* Overlaid Thermal Heatmap with variable opacity */}
                  <img
                    src={analysisResult.heatmap_raw_base64}
                    alt="Thermal Heatmap Layer"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "fill",
                      opacity: overlayOpacity / 100,
                      mixBlendMode: "multiply",
                      pointerEvents: "none",
                      transition: "opacity 0.1s ease"
                    }}
                  />

                  {/* Bounding Boxes for Anomaly Regions */}
                  {showBoundingBoxes &&
                    analysisResult.anomaly_regions.map((region) => {
                      const [bx, by, bw, bh] = region.box;
                      const imgW = analysisResult.image_dimensions.width;
                      const imgH = analysisResult.image_dimensions.height;

                      const leftPct = (bx / imgW) * 100;
                      const topPct = (by / imgH) * 100;
                      const widthPct = (bw / imgW) * 100;
                      const heightPct = (bh / imgH) * 100;
                      const isSelected = selectedRegionId === region.id;

                      return (
                        <div
                          key={region.id}
                          onClick={() => setSelectedRegionId(isSelected ? null : region.id)}
                          style={{
                            position: "absolute",
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: `${widthPct}%`,
                            height: `${heightPct}%`,
                            border: isSelected ? "3px solid #ff0055" : "2px dashed #ef4444",
                            background: isSelected ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.12)",
                            cursor: "pointer",
                            boxShadow: isSelected ? "0 0 12px #ef4444" : "none",
                            transition: "all 0.15s ease",
                            zIndex: 10
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: "-22px",
                              left: "0",
                              background: "#dc2626",
                              color: "#ffffff",
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              whiteSpace: "nowrap",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                            }}
                          >
                            Tamper #{region.id}: {region.tamper_score}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Tampered Regions List & Detailed Forensic Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
            {/* Anomaly Regions List */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "20px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0B2265", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} style={{ color: "#ef4444" }} />
                Localized Tamper Annotations ({analysisResult.anomaly_regions.length})
              </h3>

              {analysisResult.anomaly_regions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {analysisResult.anomaly_regions.map((region) => {
                    const isSelected = selectedRegionId === region.id;
                    return (
                      <div
                        key={region.id}
                        onClick={() => setSelectedRegionId(isSelected ? null : region.id)}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "10px",
                          border: isSelected ? "2px solid #ef4444" : "1px solid #e2e8f0",
                          background: isSelected ? "#fef2f2" : "#f8fafc",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                            Region #{region.id}: {region.label}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Bounding Box: [{region.box[0]}, {region.box[1]}, {region.box[2]}×{region.box[3]} px]
                            {region.area_pct ? ` • ${region.area_pct}% of surface` : ""}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              background: "#fee2e2",
                              color: "#991b1b",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontWeight: 700,
                              fontSize: "12px"
                            }}
                          >
                            {region.tamper_score}% anomaly
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#059669",
                    background: "#f0fdf4",
                    borderRadius: "12px",
                    border: "1px solid #bbf7d0"
                  }}
                >
                  <CheckCircle2 size={28} style={{ margin: "0 auto 8px auto", display: "block" }} />
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>Zero Anomaly Clusters Found</div>
                  <div style={{ fontSize: "12px", color: "#166534", marginTop: "4px" }}>
                    The document exhibits uniform compression quality and homogeneous noise distribution.
                  </div>
                </div>
              )}
            </div>

            {/* Forensic Metrics */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "20px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0B2265", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <Cpu size={18} style={{ color: "#3b82f6" }} />
                Neural & Algorithmic Diagnostics
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>ELA Residual Discrepancy</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {analysisResult.metrics.ela_mean_discrepancy.toFixed(3)}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Noise Variance Divergence</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {analysisResult.metrics.noise_variance_divergence.toFixed(3)}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>JPEG Grid Inconsistency</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {analysisResult.metrics.jpeg_grid_anomaly_ratio.toFixed(3)}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Analysis Latency</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {analysisResult.processing_time_ms} ms
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "#64748b" }}>
                <strong>Algorithms executed:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {analysisResult.forensic_algorithms_used.map((algo, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#e0e7ff",
                        color: "#3730a3",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 600
                      }}
                    >
                      {algo}
                    </span>
                  ))}
                </div>
              </div>

              {/* Regulatory Audit Watermark */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#eff6ff",
                  border: "1px solid #dbeafe",
                  fontSize: "11px",
                  color: "#1e40af",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <ShieldCheck size={14} style={{ flexShrink: 0 }} />
                <span>Verification recorded to AICTE Central Forensic Audit Log.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
