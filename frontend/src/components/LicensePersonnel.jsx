import { useState, useEffect } from "react";
import { useT } from "../context/LanguageContext";
import { getEmployeesForLicense } from "../services/erpService";

const statusColors = { Verified: "#26c281", Pending: "#f0ad4e", Expired: "#e74c3c" };

function LicensePersonnel({ formData, updateFormData }) {
  const t = useT();
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    getEmployeesForLicense()
      .then((res) => setEmployees(res.data.message || []))
      .catch(() => setEmployees([]));
  }, []);

  const personnel = formData.personnel || [];

  const addRow = () => {
    updateFormData({
      personnel: [...personnel, {
        employee: "", employee_name: "", registration_no: "",
        registration_status: "", employment_type: "", contact: "",
        joining_date: "", leaving_date: "", certificate: "",
      }],
    });
  };

  const updateRow = (idx, field, value) => {
    const updated = [...personnel];
    updated[idx] = { ...updated[idx], [field]: value };

    // auto-fill from employee master when employee is selected
    if (field === "employee" && value) {
      const emp = employees.find((e) => e.name === value);
      if (emp) {
        updated[idx].employee_name = emp.employee_name;
        updated[idx].employment_type = emp.employment_type || "";
        updated[idx].contact = emp.company_email || "";
        updated[idx].joining_date = emp.date_of_joining || "";
        updated[idx].leaving_date = emp.relieving_date || "";
      }
    }

    updateFormData({ personnel: updated });
  };

  const removeRow = (idx) => {
    updateFormData({ personnel: personnel.filter((_, i) => i !== idx) });
  };

  return (
    <div className="lms-page">
      <div className="card">
        <h3 className="lms-section-title">{t("personnel.title")}</h3>

        <button className="lms-btn lms-btn-primary" style={{ marginBottom: 16 }} onClick={addRow}>
          + {t("personnel.addPersonnel") || "Add Personnel"}
        </button>

        {personnel.length === 0 ? (
          <div className="lms-empty-state">
            <span>&#128100;</span>
            <p>{t("personnel.noPersonnel") || "No personnel added yet"}</p>
          </div>
        ) : (
          personnel.map((row, idx) => (
            <div key={idx} className="card" style={{ marginBottom: 12, padding: 16, border: "1px solid #E6EFF5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <strong>#{idx + 1}</strong>
                <button className="lms-btn lms-btn-danger lms-btn-sm" onClick={() => removeRow(idx)}>
                  {t("common.delete")}
                </button>
              </div>
              <div className="lms-grid-2">
                <div className="lms-field">
                  <label className="lms-label">{t("personnel.selectEmployee")} <span className="lms-required">*</span></label>
                  <select className="lms-input" value={row.employee || ""} onChange={(e) => updateRow(idx, "employee", e.target.value)}>
                    <option value="">{t("personnel.selectPlaceholder")}</option>
                    {employees.map((em) => (
                      <option key={em.name} value={em.name}>{em.employee_name} ({em.name})</option>
                    ))}
                  </select>
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("personnel.regNo")}</label>
                  <input className="lms-input" value={row.registration_no || ""} onChange={(e) => updateRow(idx, "registration_no", e.target.value)} />
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("personnel.regStatus")}</label>
                  <select className="lms-input" value={row.registration_status || ""} onChange={(e) => updateRow(idx, "registration_status", e.target.value)}>
                    <option value="">—</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("personnel.employmentType")}</label>
                  <input className="lms-input lms-input-readonly" readOnly value={row.employment_type || "—"} />
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("personnel.contact")}</label>
                  <input className="lms-input lms-input-readonly" readOnly value={row.contact || "—"} />
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("personnel.certificate")}</label>
                  <input className="lms-input" placeholder={t("personnel.certificatePlaceholder")} value={row.certificate || ""} onChange={(e) => updateRow(idx, "certificate", e.target.value)} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LicensePersonnel;
