import React, { useState, useEffect } from "react";
import { useT } from "../context/LanguageContext";

const empty = {
  training_name: "",
  description: "",
  duration: "",
  mandatory: false,
  passing_score: "",
  validity: "",
};

function TrainingForm({ selected, onSave, onCancel }) {
  const t = useT();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(selected ? { ...selected } : empty);
  }, [selected]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="lms-field">
        <label className="lms-label">{t("training.name")} <span className="lms-required">*</span></label>
        <input name="training_name" className="lms-input" placeholder={t("training.namePlaceholder")}
          value={form.training_name} onChange={handleChange} />
      </div>

      <div className="lms-field">
        <label className="lms-label">{t("training.description")}</label>
        <textarea name="description" className="lms-input lms-textarea" placeholder={t("training.description")}
          value={form.description} onChange={handleChange} />
      </div>

      <div className="lms-grid-2">
        <div className="lms-field">
          <label className="lms-label">{t("training.duration")}</label>
          <input type="number" name="duration" className="lms-input" placeholder={t("training.durationPlaceholder")}
            value={form.duration} onChange={handleChange} />
        </div>
        <div className="lms-field">
          <label className="lms-label">{t("training.passingScore")}</label>
          <input type="number" name="passing_score" className="lms-input" placeholder={t("training.passingScorePlaceholder")}
            value={form.passing_score} onChange={handleChange} />
        </div>
      </div>

      <div className="lms-field">
        <label className="lms-label">{t("training.validityDate")}</label>
        <input type="date" name="validity" className="lms-input"
          value={form.validity} onChange={handleChange} />
      </div>

      <div className="lms-field">
        <label className="lms-checkbox-label">
          <input type="checkbox" name="mandatory" checked={form.mandatory} onChange={handleChange} />
          {t("training.mandatory")}
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
        {onCancel && (
          <button className="lms-btn lms-btn-secondary" onClick={onCancel}>{t("common.cancel")}</button>
        )}
        <button className="lms-btn lms-btn-primary" onClick={() => onSave(form)}>
          {selected ? t("common.update") : t("common.create")}
        </button>
      </div>
    </div>
  );
}

export default TrainingForm;
