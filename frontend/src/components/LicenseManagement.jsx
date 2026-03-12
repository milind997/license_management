import { useState, useEffect, useCallback } from "react";
import LicenseBasicInfo from "./LicenseBasicInfo";
import LicenseDetails from "./LicenseDetails";
import LicensePersonnel from "./LicensePersonnel";
import LicenseDocuments from "./LicenseDocuments";
import { useT } from "../context/LanguageContext";
import { getLicenseList, getLicense, saveLicense, deleteLicense } from "../services/erpService";

const STATUS_COLORS = {
  Active:   { bg: "#eafaf3", color: "#1a7a50", border: "#b2ecd8" },
  Expiring: { bg: "#fff8e1", color: "#e67e22", border: "#ffd180" },
  Expired:  { bg: "#fff3f3", color: "#c0392b", border: "#f5c6c6" },
  Draft:    { bg: "#F0F2FF", color: "#1814F3", border: "#c4c2fc" },
};

const TABS = [
  { key: "basic-info", labelKey: "license.tabBasicInfo",  icon: "&#128203;" },
  { key: "details",    labelKey: "license.tabDetails",    icon: "&#128196;" },
  { key: "personnel",  labelKey: "license.tabPersonnel",  icon: "&#128100;" },
  { key: "documents",  labelKey: "license.tabDocuments",  icon: "&#128193;" },
];

function FormView({ licenseName, onBack, onSaved, t }) {
  const [activeTab, setActiveTab] = useState("basic-info");
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!licenseName) {
      setFormData({});
      setLicense(null);
      return;
    }
    setLoading(true);
    getLicense(licenseName)
      .then((res) => {
        const doc = res.data.message;
        setLicense(doc);
        setFormData(doc);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [licenseName]);

  const updateFormData = useCallback((partial) => {
    setFormData((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveLicense(formData);
      const doc = res.data.message;
      setLicense(doc);
      setFormData(doc);
      setSaved(true);
      onSaved?.();
    } catch (err) {
      const msg = err?.response?.data?._server_messages;
      if (msg) {
        try { alert(JSON.parse(JSON.parse(msg)[0]).message); } catch { alert("Save failed"); }
      } else {
        alert("Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (license) setFormData(license);
    else setFormData({});
    setSaved(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#8BA3CB" }}>Loading...</div>;

  return (
    <div>
      <div className="lms-toolbar">
        <button className="lms-icon-btn" data-label={t("common.back")} title={t("common.back")} onClick={onBack}>
          <span className="lms-ibtn-icon">&#9664;</span>
        </button>
        <div className="lms-toolbar-sep" />
        <button className="lms-icon-btn btn-primary" data-label={t("common.save")} title={t("common.save")} onClick={handleSave} disabled={saving}>
          <span className="lms-ibtn-icon">&#128190;</span>
        </button>
        <button className="lms-icon-btn" data-label={t("common.clear")} title={t("common.clear")} onClick={handleClear}>
          <span className="lms-ibtn-icon">&#8635;</span>
        </button>
        {saved && <span className="lms-saved-badge" style={{ margin: "auto 8px" }}>&#10003; {t("common.saved")}</span>}
        {formData.name && <span style={{ marginLeft: "auto", color: "#8BA3CB", fontSize: 12 }}>{formData.name}</span>}
      </div>

      <div className="lm-tabs">
        {TABS.map((tab) => (
          <button key={tab.key} className={`lm-tab ${activeTab === tab.key ? "lm-tab-active" : ""}`} onClick={() => setActiveTab(tab.key)}>
            <span className="lm-tab-icon" dangerouslySetInnerHTML={{ __html: tab.icon }} />
            <span className="lm-tab-label">{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="lm-tab-content">
        {activeTab === "basic-info" && <LicenseBasicInfo formData={formData} updateFormData={updateFormData} />}
        {activeTab === "details"    && <LicenseDetails formData={formData} updateFormData={updateFormData} />}
        {activeTab === "personnel"  && <LicensePersonnel formData={formData} updateFormData={updateFormData} />}
        {activeTab === "documents"  && <LicenseDocuments formData={formData} updateFormData={updateFormData} />}
      </div>
    </div>
  );
}

function LicenseManagement() {
  const t = useT();
  const [view, setView] = useState("list");
  const [editName, setEditName] = useState(null);
  const [search, setSearch] = useState("");
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(() => {
    setLoading(true);
    getLicenseList(search)
      .then((res) => setLicenses(res.data.message?.data || []))
      .catch(() => setLicenses([]))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadList(); }, [loadList]);

  const handleDelete = async (name, e) => {
    e.stopPropagation();
    if (!confirm(t("common.confirmDelete") || "Delete this record?")) return;
    await deleteLicense(name);
    loadList();
  };

  if (view === "form") {
    return (
      <FormView
        licenseName={editName}
        onBack={() => { setView("list"); setEditName(null); loadList(); }}
        onSaved={loadList}
        t={t}
      />
    );
  }

  return (
    <div>
      <div className="lms-toolbar">
        <button className="lms-icon-btn btn-primary" data-label={t("common.new")} title={t("license.newLicense")} onClick={() => { setEditName(null); setView("form"); }}>
          <span className="lms-ibtn-icon">&#43;</span>
        </button>
        <div className="lms-toolbar-sep" />
        <button className="lms-icon-btn" data-label={t("common.export")} title={t("common.export")}>
          <span className="lms-ibtn-icon">&#128229;</span>
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F5F7FA", border: "1px solid #E6EFF5", borderRadius: 8, padding: "4px 10px" }}>
          <span style={{ color: "#8BA3CB", fontSize: 13 }}>&#128269;</span>
          <input
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: "#343c6a", minWidth: 150 }}
            placeholder={t("common.search") + "..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr style={{ background: "#F5F7FA", borderBottom: "2px solid #F2F4F7" }}>
              {[t("license.colLicenseNo"), t("license.colStoreName"), t("license.colLicenseType"), t("common.status"), t("license.colExpiryDate"), t("common.action")].map((h, i) => (
                <th key={i} style={{ padding: "8px 12px", textAlign: i === 5 ? "center" : "left", fontSize: 11, fontWeight: 700, color: "#8BA3CB", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#8BA3CB" }}>Loading...</td></tr>
            ) : licenses.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#8BA3CB" }}>{t("common.noData")}</td></tr>
            ) : (
              licenses.map((rec, i) => {
                const sc = STATUS_COLORS[rec.license_status] || STATUS_COLORS.Draft;
                return (
                  <tr key={rec.name} style={{ borderBottom: "1px solid #F2F4F7", background: i % 2 === 0 ? "#fff" : "#FAFBFF", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF0FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFBFF")}
                    onClick={() => { setEditName(rec.name); setView("form"); }}
                  >
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#343c6a", fontSize: 12.5 }}>{rec.name}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12.5 }}>{rec.store_name_jp}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12.5 }}>{rec.license_type}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                        {rec.license_status || "Draft"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 12.5 }}>{rec.expiry_date || "—"}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <button className="lms-btn lms-btn-outline lms-btn-sm" onClick={(e) => { e.stopPropagation(); setEditName(rec.name); setView("form"); }}>{t("common.edit")}</button>
                      <button className="lms-btn lms-btn-danger lms-btn-sm" style={{ marginLeft: 4 }} onClick={(e) => handleDelete(rec.name, e)}>{t("common.delete")}</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

export default LicenseManagement;
