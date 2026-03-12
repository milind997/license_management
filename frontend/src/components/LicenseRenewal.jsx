import { useState, useEffect, useCallback } from "react";
import { useT } from "../context/LanguageContext";
import { getRenewalList, getRenewal, saveRenewal, advanceRenewalWorkflow, getLicenseList } from "../services/erpService";

const WORKFLOW_STEP_KEYS = ["Draft", "Submitted", "Under Review", "Inspection", "Approved", "Rejected"];
const TERMINAL_KEYS = ["Approved", "Rejected"];

const DOCUMENT_CHECKLIST = [
  "Store License Copy",
  "Pharmacist Registration",
  "Building Inspection Certificate",
  "Insurance Certificate",
  "Tax Registration",
  "Previous License Copy",
  "Identity Proof",
  "NOC Certificate",
  "Renewal Application Form",
];

const statusColors = {
  Open: "#3fcefb91", Submitted: "#f0ad4e", Approved: "#26c281",
  "Under Review": "#2980b9", Inspection: "#8e44ad", Rejected: "#e74c3c",
};

const workflowNextStep = {
  Draft: "Submitted",
  Submitted: "Under Review",
  "Under Review": "Inspection",
  Inspection: "Approved",
};

function WorkflowStepper({ currentStep, onAdvance, onReject, t }) {
  const currentIdx = WORKFLOW_STEP_KEYS.indexOf(currentStep);
  const isTerminal = TERMINAL_KEYS.includes(currentStep);

  return (
    <div className="renewal-workflow">
      <div className="workflow-steps">
        {WORKFLOW_STEP_KEYS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = step === currentStep;
          const isRejected = step === "Rejected" && currentStep === "Rejected";
          return (
            <div key={step} className="workflow-step-wrap">
              <div className={`workflow-step ${isDone ? "step-done" : ""} ${isCurrent ? "step-current" : ""} ${isRejected ? "step-rejected" : ""}`}>
                <div className="workflow-dot">{isDone ? "✓" : idx + 1}</div>
                <div className="workflow-label">{step}</div>
              </div>
              {idx < WORKFLOW_STEP_KEYS.length - 1 && (
                <div className={`workflow-connector ${isDone || isCurrent ? "connector-done" : ""}`} />
              )}
            </div>
          );
        })}
      </div>
      {!isTerminal && (
        <div className="workflow-actions">
          <button className="lms-btn lms-btn-primary" onClick={onAdvance}>
            &#8594; {t("renewal.advanceTo")} {workflowNextStep[currentStep] || ""}
          </button>
          {currentStep !== "Draft" && (
            <button className="lms-btn lms-btn-danger" onClick={onReject}>
              &#10005; {t("renewal.reject")}
            </button>
          )}
        </div>
      )}
      {isTerminal && (
        <div className="workflow-terminal" style={{
          background: currentStep === "Approved" ? "#e8faf2" : "#fdf0f0",
          borderColor: currentStep === "Approved" ? "#26c281" : "#e74c3c",
          color: currentStep === "Approved" ? "#1a7a50" : "#c0392b",
        }}>
          {currentStep === "Approved" ? "✓ " + t("renewal.approvedMsg") : "✗ " + t("renewal.rejectedMsg")}
        </div>
      )}
    </div>
  );
}

function FormView({ renewalName, onBack, onSave, t }) {
  const [form, setForm] = useState({
    license: "",
    prev_license_ref: "",
    renewal_date: new Date().toISOString().split("T")[0],
    new_expiry_date: "",
    inspection_required: 0,
    approval_status: "Open",
    workflow_state: "Draft",
    checklist: [],
    send_email_notification: 0,
  });
  const [licenses, setLicenses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getLicenseList("", 200).then((res) => setLicenses(res.data.message?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!renewalName) return;
    getRenewal(renewalName)
      .then((res) => setForm(res.data.message))
      .catch(() => {});
  }, [renewalName]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? (checked ? 1 : 0) : value }));
    setSaved(false);
  };

  const handleChecklistToggle = (docName) => {
    const checklist = form.checklist || [];
    const exists = checklist.find((c) => c.document_name === docName);
    const updated = exists
      ? checklist.filter((c) => c.document_name !== docName)
      : [...checklist, { document_name: docName, is_submitted: 1 }];
    setForm((f) => ({ ...f, checklist: updated }));
    setSaved(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.license) errs.license = "Required";
    if (!form.prev_license_ref?.trim()) errs.prev_license_ref = "Required";
    if (!form.renewal_date) errs.renewal_date = "Required";
    if (!form.new_expiry_date) errs.new_expiry_date = "Required";
    if (form.new_expiry_date && form.renewal_date && form.new_expiry_date <= form.renewal_date) errs.new_expiry_date = "Must be after renewal date";
    if (!form.checklist || form.checklist.length === 0) errs.checklist = "Select at least one document";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const res = await saveRenewal(form);
      setForm(res.data.message);
      setSaved(true);
      onSave?.();
    } catch (err) {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAdvance = async () => {
    if (!form.name) { alert("Save first"); return; }
    const res = await advanceRenewalWorkflow(form.name, "advance");
    setForm(res.data.message);
  };

  const handleReject = async () => {
    if (!form.name) { alert("Save first"); return; }
    const res = await advanceRenewalWorkflow(form.name, "reject");
    setForm(res.data.message);
  };

  const checklist = form.checklist || [];
  const checklistNames = checklist.map((c) => c.document_name);

  return (
    <div className="lms-page">
      <div className="lms-toolbar">
        <button className="lms-icon-btn" data-label={t("common.back")} onClick={onBack}>
          <span className="lms-ibtn-icon">&#9664;</span>
        </button>
        <div className="lms-toolbar-sep" />
        <button className="lms-icon-btn btn-primary" data-label={t("common.save")} onClick={handleSave} disabled={saving}>
          <span className="lms-ibtn-icon">&#128190;</span>
        </button>
        {saved && <span className="lms-saved-badge" style={{ margin: "auto 8px" }}>&#10003; {t("common.saved")}</span>}
        {form.name && <span style={{ marginLeft: "auto", color: "#8BA3CB", fontSize: 12 }}>{form.name}</span>}
      </div>

      <div className="card">
        <h3 className="lms-section-title">{t("renewal.workflowTitle")}</h3>
        <WorkflowStepper currentStep={form.workflow_state || "Draft"} onAdvance={handleAdvance} onReject={handleReject} t={t} />
      </div>

      <div className="card">
        <h3 className="lms-section-title">{t("renewal.formTitle")}</h3>
        <div className="lms-grid-2">
          <div className="lms-field">
            <label className="lms-label">{t("renewal.license") || "License"} <span className="lms-required">*</span></label>
            <select name="license" className={`lms-input ${errors.license ? "input-error" : ""}`} value={form.license || ""} onChange={handleChange}>
              <option value="">Select License...</option>
              {licenses.map((l) => <option key={l.name} value={l.name}>{l.name} — {l.store_name_jp}</option>)}
            </select>
            {errors.license && <span className="lms-field-error">{errors.license}</span>}
          </div>
          <div className="lms-field">
            <label className="lms-label">{t("renewal.approvalStatus")} <span className="lms-auto-badge">{t("common.auto")}</span></label>
            <input className="lms-input lms-input-readonly" readOnly value={form.approval_status || "Open"} style={{ color: statusColors[form.approval_status] || "#555", fontWeight: 600 }} />
          </div>
          <div className="lms-field">
            <label className="lms-label">{t("renewal.prevLicenseRef")} <span className="lms-required">*</span></label>
            <input name="prev_license_ref" className={`lms-input ${errors.prev_license_ref ? "input-error" : ""}`} placeholder={t("renewal.prevLicenseRefPlaceholder")} value={form.prev_license_ref || ""} onChange={handleChange} />
            {errors.prev_license_ref && <span className="lms-field-error">{errors.prev_license_ref}</span>}
          </div>
          <div className="lms-field">
            <label className="lms-label">{t("renewal.renewalDate")} <span className="lms-required">*</span></label>
            <input type="date" name="renewal_date" className="lms-input" value={form.renewal_date || ""} onChange={handleChange} />
          </div>
          <div className="lms-field">
            <label className="lms-label">{t("renewal.newExpiryDate")} <span className="lms-required">*</span></label>
            <input type="date" name="new_expiry_date" className={`lms-input ${errors.new_expiry_date ? "input-error" : ""}`} value={form.new_expiry_date || ""} onChange={handleChange} />
            {errors.new_expiry_date && <span className="lms-field-error">{errors.new_expiry_date}</span>}
          </div>
          <div className="lms-field">
            <label className="lms-label">{t("renewal.inspectionRequired")}</label>
            <label className="lms-checkbox-label">
              <input type="checkbox" name="inspection_required" checked={!!form.inspection_required} onChange={handleChange} />
              {t("common.yes")}
            </label>
          </div>
        </div>

        <div className="lms-field" style={{ marginTop: 20 }}>
          <label className="lms-label">{t("renewal.checklistTitle")} <span className="lms-required">*</span>
            <span className="lms-field-note" style={{ marginLeft: 8 }}>({checklist.length} / {DOCUMENT_CHECKLIST.length})</span>
          </label>
          <div className="renewal-checklist">
            {DOCUMENT_CHECKLIST.map((docName) => (
              <label key={docName} className={`renewal-checklist-item ${checklistNames.includes(docName) ? "checklist-checked" : ""}`}>
                <input type="checkbox" checked={checklistNames.includes(docName)} onChange={() => handleChecklistToggle(docName)} />
                <span>{docName}</span>
              </label>
            ))}
          </div>
          {errors.checklist && <span className="lms-field-error">{errors.checklist}</span>}
        </div>
      </div>

      <div className="card lms-email-trigger">
        <h3 className="lms-section-title">&#9993; {t("renewal.emailTitle")}</h3>
        <label className="lms-checkbox-label">
          <input type="checkbox" name="send_email_notification" checked={!!form.send_email_notification} onChange={handleChange} />
          {t("renewal.emailLabel")}
        </label>
      </div>
    </div>
  );
}

function LicenseRenewal() {
  const t = useT();
  const [view, setView] = useState("list");
  const [editName, setEditName] = useState(null);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(() => {
    setLoading(true);
    getRenewalList(search)
      .then((res) => setRecords(res.data.message?.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadList(); }, [loadList]);

  if (view === "form") {
    return (
      <FormView
        renewalName={editName}
        onBack={() => { setView("list"); setEditName(null); loadList(); }}
        onSave={loadList}
        t={t}
      />
    );
  }

  return (
    <div>
      <div className="lms-toolbar">
        <button className="lms-icon-btn btn-primary" data-label={t("common.new")} title={t("renewal.newRenewal")} onClick={() => { setEditName(null); setView("form"); }}>
          <span className="lms-ibtn-icon">&#43;</span>
        </button>
        <div className="lms-toolbar-sep" />
        <button className="lms-icon-btn" data-label={t("common.export")} title={t("common.export")}>
          <span className="lms-ibtn-icon">&#128229;</span>
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F5F7FA", border: "1px solid #E6EFF5", borderRadius: 8, padding: "4px 10px" }}>
          <span style={{ color: "#8BA3CB", fontSize: 14 }}>&#128269;</span>
          <input style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#343c6a", minWidth: 180 }} placeholder={t("common.search") + "..."} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F5F7FA", borderBottom: "2px solid #F2F4F7" }}>
              {[t("renewal.colAppNo"), t("renewal.colPrevRef"), t("renewal.colAppDate"), t("renewal.colNewExpiry"), t("renewal.colInspection"), t("common.status"), t("renewal.colDocs"), t("common.action")].map((h, i) => (
                <th key={i} style={{ padding: "12px 16px", textAlign: i === 7 ? "center" : "left", fontSize: 12, fontWeight: 700, color: "#8BA3CB", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#8BA3CB" }}>Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#8BA3CB" }}>{t("common.noData")}</td></tr>
            ) : (
              records.map((rec, i) => (
                <tr key={rec.name} style={{ borderBottom: "1px solid #F2F4F7", background: i % 2 === 0 ? "#fff" : "#FAFBFF", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF0FF")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFBFF")}
                  onClick={() => { setEditName(rec.name); setView("form"); }}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#343c6a", fontSize: 13 }}>{rec.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{rec.prev_license_ref}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{rec.renewal_date}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{rec.new_expiry_date}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{rec.inspection_required ? t("common.yes") : t("common.no")}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="lms-status-badge" style={{ background: statusColors[rec.approval_status] || "#888", fontSize: 11 }}>{rec.approval_status}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{rec.checklist_count || 0} docs</td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <button className="lms-btn lms-btn-outline lms-btn-sm" onClick={(e) => { e.stopPropagation(); setEditName(rec.name); setView("form"); }}>{t("common.edit")}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LicenseRenewal;
