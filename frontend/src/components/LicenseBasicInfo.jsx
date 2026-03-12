import { useT } from "../context/LanguageContext";

const PREFECTURES = [
  "Hokkaido","Aomori","Iwate","Miyagi","Akita","Yamagata","Fukushima",
  "Ibaraki","Tochigi","Gunma","Saitama","Chiba","Tokyo","Kanagawa",
  "Niigata","Toyama","Ishikawa","Fukui","Yamanashi","Nagano",
  "Shizuoka","Aichi","Mie","Shiga","Kyoto","Osaka","Hyogo",
  "Nara","Wakayama","Tottori","Shimane","Okayama","Hiroshima","Yamaguchi",
  "Tokushima","Kagawa","Ehime","Kochi","Fukuoka","Saga","Nagasaki",
  "Kumamoto","Oita","Miyazaki","Kagoshima","Okinawa"
];

const STORE_TYPES = ["Pharmacy","Drugstore","Online Retail","Wholesaler"];

function FormField({ label, required, children }) {
  return (
    <div className="lms-field">
      <label className="lms-label">
        {label} {required && <span className="lms-required">*</span>}
      </label>
      {children}
    </div>
  );
}

function LicenseBasicInfo({ formData, updateFormData }) {
  const t = useT();
  const val = (key) => formData[key] || "";

  const handleChange = (e) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  return (
    <div className="lms-page">
      <div className="card">
        <h3 className="lms-section-title">{t("basicInfo.title")}</h3>
        <div className="lms-grid-2">
          <FormField label={t("basicInfo.storeNameJp")} required>
            <input name="store_name_jp" className="lms-input" placeholder={t("basicInfo.storeNameJpPlaceholder")} value={val("store_name_jp")} onChange={handleChange} />
          </FormField>
          <FormField label={t("basicInfo.storeNameEn")}>
            <input name="store_name_en" className="lms-input" placeholder={t("basicInfo.storeNameEnPlaceholder")} value={val("store_name_en")} onChange={handleChange} />
          </FormField>
          <FormField label={t("basicInfo.storeType")} required>
            <select name="store_type" className="lms-input" value={val("store_type")} onChange={handleChange}>
              <option value="">{t("basicInfo.selectType")}</option>
              {STORE_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          </FormField>
          <FormField label={t("basicInfo.corpRegNo")} required>
            <input name="corp_reg_no" className="lms-input" placeholder={t("basicInfo.corpRegNoPlaceholder")} value={val("corp_reg_no")} onChange={handleChange} />
          </FormField>
          <FormField label={t("basicInfo.ownerName")} required>
            <input name="owner_name" className="lms-input" placeholder={t("basicInfo.ownerNamePlaceholder")} value={val("owner_name")} onChange={handleChange} />
          </FormField>
          <FormField label={t("basicInfo.businessHours")} required>
            <input name="business_hours" className="lms-input" placeholder={t("basicInfo.businessHoursPlaceholder")} value={val("business_hours")} onChange={handleChange} />
          </FormField>
        </div>

        <h3 className="lms-section-subtitle">{t("basicInfo.addressSection")}</h3>
        <div className="lms-grid-3">
          <FormField label={t("basicInfo.prefecture")} required>
            <select name="prefecture" className="lms-input" value={val("prefecture")} onChange={handleChange}>
              <option value="">{t("basicInfo.selectPrefecture")}</option>
              {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>
          <FormField label={t("basicInfo.city")} required>
            <input name="city" className="lms-input" placeholder={t("basicInfo.cityPlaceholder")} value={val("city")} onChange={handleChange} />
          </FormField>
          <FormField label={t("basicInfo.postalCode")} required>
            <input name="postal_code" className="lms-input" placeholder={t("basicInfo.postalCodePlaceholder")} value={val("postal_code")} onChange={handleChange} />
          </FormField>
        </div>

        <h3 className="lms-section-subtitle">{t("basicInfo.contactSection")}</h3>
        <div className="lms-grid-3">
          <FormField label={t("common.phone")} required>
            <input name="phone" type="tel" className="lms-input" placeholder={t("basicInfo.phonePlaceholder")} value={val("phone")} onChange={handleChange} />
          </FormField>
          <FormField label={t("common.email")} required>
            <input name="email" type="email" className="lms-input" placeholder={t("basicInfo.emailPlaceholder")} value={val("email")} onChange={handleChange} />
          </FormField>
        </div>
      </div>
    </div>
  );
}

export default LicenseBasicInfo;
