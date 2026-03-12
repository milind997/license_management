import { useT } from "../context/LanguageContext";

const LICENSE_TYPES = ["Retail Drug License", "Pharmacy License"];
const PREFECTURES = [
  "Hokkaido","Aomori","Iwate","Miyagi","Akita","Yamagata","Fukushima",
  "Ibaraki","Tochigi","Gunma","Saitama","Chiba","Tokyo","Kanagawa",
  "Niigata","Toyama","Ishikawa","Fukui","Yamanashi","Nagano",
  "Shizuoka","Aichi","Mie","Shiga","Kyoto","Osaka","Hyogo",
  "Nara","Wakayama","Tottori","Shimane","Okayama","Hiroshima","Yamaguchi",
  "Tokushima","Kagawa","Ehime","Kochi","Fukuoka","Saga","Nagasaki",
  "Kumamoto","Oita","Miyazaki","Kagoshima","Okinawa"
];

const SCOPE_OPTIONS = ["Prescription Drugs", "OTC", "Controlled Substances"];

function FormField({ label, required, note, children }) {
  return (
    <div className="lms-field">
      <label className="lms-label">
        {label} {required && <span className="lms-required">*</span>}
      </label>
      {children}
      {note && <span className="lms-field-note">{note}</span>}
    </div>
  );
}

function LicenseDetails({ formData, updateFormData }) {
  const t = useT();
  const val = (key) => formData[key] || "";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateFormData({ [name]: type === "checkbox" ? (checked ? 1 : 0) : value });
  };

  // license_scope is stored as comma-separated string
  const scopeList = val("license_scope") ? val("license_scope").split(",").map(s => s.trim()) : [];

  const handleScopeChange = (option) => {
    const newScope = scopeList.includes(option)
      ? scopeList.filter(s => s !== option)
      : [...scopeList, option];
    updateFormData({ license_scope: newScope.join(", ") });
  };

  const statusColor = {
    Active: "#26c281", Expiring: "#f0ad4e", Expired: "#e74c3c", Draft: "#aaa",
  };

  return (
    <div className="lms-page">
      <div className="card">
        <div className="lms-section-title-row">
          <h3 className="lms-section-title">{t("licDetails.title")}</h3>
          {val("license_status") && (
            <span className="lms-status-badge" style={{ background: statusColor[val("license_status")] || "#aaa" }}>
              {val("license_status")}
            </span>
          )}
        </div>

        <div className="lms-grid-2">
          <FormField label={t("licDetails.licenseType")} required>
            <select name="license_type" className="lms-input" value={val("license_type")} onChange={handleChange}>
              <option value="">{t("licDetails.selectType")}</option>
              {LICENSE_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          </FormField>

          <FormField label={t("licDetails.licenseNumber")} required note={t("licDetails.licenseNumberNote")}>
            <input name="license_number" className="lms-input" placeholder="e.g. PH-2024-001234" value={val("license_number")} onChange={handleChange} />
          </FormField>

          <FormField label={t("licDetails.issuingAuthority")} note={t("licDetails.issuingAuthorityNote")}>
            <select name="issuing_authority" className="lms-input" value={val("issuing_authority")} onChange={handleChange}>
              <option value="">{t("licDetails.selectPrefecture")}</option>
              {PREFECTURES.map((p) => <option key={p} value={`${p} ${t("licDetails.prefGovernment")}`}>{p} {t("licDetails.prefGovernment")}</option>)}
            </select>
          </FormField>

          <FormField label={t("licDetails.licenseStatus")}>
            <input className="lms-input lms-input-readonly" readOnly value={val("license_status") || t("licDetails.autoCalculated")} style={{ color: statusColor[val("license_status")] || "#aaa", fontWeight: 600 }} />
          </FormField>

          <FormField label={t("licDetails.issueDate")} required note={t("licDetails.issueDateNote")}>
            <input type="date" name="issue_date" className="lms-input" value={val("issue_date")} onChange={handleChange} />
          </FormField>

          <FormField label={t("licDetails.expiryDate")} required note={t("licDetails.expiryDateNote")}>
            <input type="date" name="expiry_date" className="lms-input" value={val("expiry_date")} onChange={handleChange} />
          </FormField>
        </div>

        <FormField label={t("licDetails.licenseScope")} note={t("licDetails.licenseScopeNote")}>
          <div className="lms-multiselect">
            {SCOPE_OPTIONS.map((opt) => (
              <label key={opt} className="lms-checkbox-label">
                <input type="checkbox" checked={scopeList.includes(opt)} onChange={() => handleScopeChange(opt)} />
                {opt}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label={t("licDetails.onlineSales")} note={t("licDetails.onlineSalesNote")}>
          <label className="lms-checkbox-label">
            <input type="checkbox" name="online_sales" checked={!!formData.online_sales} onChange={handleChange} />
            {t("licDetails.allowOnlineSales")}
          </label>
        </FormField>
      </div>
    </div>
  );
}

export default LicenseDetails;
