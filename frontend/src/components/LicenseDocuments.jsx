import { useRef } from "react";
import { useT } from "../context/LanguageContext";

const FILE_TYPES = [
  "Pharmacy License", "Retail Drug License", "Pharmacist Certificate",
  "Insurance Certificate", "Building Permit", "Other",
];

function LicenseDocuments({ formData, updateFormData }) {
  const t = useT();
  const fileRef = useRef();
  const documents = formData.documents || [];

  const addRow = () => {
    updateFormData({
      documents: [...documents, {
        file_type: "", file_name: "", description: "",
        file_attachment: "", upload_date: new Date().toISOString().split("T")[0],
      }],
    });
  };

  const updateRow = (idx, field, value) => {
    const updated = [...documents];
    updated[idx] = { ...updated[idx], [field]: value };
    updateFormData({ documents: updated });
  };

  const removeRow = (idx) => {
    updateFormData({ documents: documents.filter((_, i) => i !== idx) });
  };

  return (
    <div className="lms-page">
      <div className="card">
        <h3 className="lms-section-title">{t("documents.uploadTitle")}</h3>

        <button className="lms-btn lms-btn-primary" style={{ marginBottom: 16 }} onClick={addRow}>
          + {t("documents.addDocument") || "Add Document"}
        </button>

        {documents.length === 0 ? (
          <div className="lms-empty-state">
            <span>&#128193;</span>
            <p>{t("documents.noDocuments")}</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F5F7FA", borderBottom: "2px solid #F2F4F7" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#8BA3CB" }}>{t("documents.fileType")}</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#8BA3CB" }}>{t("documents.fileName")}</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#8BA3CB" }}>{t("documents.descNotes")}</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#8BA3CB" }}>{t("documents.uploadDate")}</th>
                <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#8BA3CB" }}>{t("common.action")}</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F2F4F7" }}>
                  <td style={{ padding: "6px 12px" }}>
                    <select className="lms-input" style={{ fontSize: 12 }} value={doc.file_type || ""} onChange={(e) => updateRow(idx, "file_type", e.target.value)}>
                      <option value="">—</option>
                      {FILE_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <input className="lms-input" style={{ fontSize: 12 }} value={doc.file_name || ""} onChange={(e) => updateRow(idx, "file_name", e.target.value)} />
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <input className="lms-input" style={{ fontSize: 12 }} value={doc.description || ""} onChange={(e) => updateRow(idx, "description", e.target.value)} />
                  </td>
                  <td style={{ padding: "6px 12px", fontSize: 12, color: "#8BA3CB" }}>{doc.upload_date || "—"}</td>
                  <td style={{ padding: "6px 12px", textAlign: "center" }}>
                    <button className="lms-btn lms-btn-danger lms-btn-sm" onClick={() => removeRow(idx)}>
                      {t("common.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default LicenseDocuments;
