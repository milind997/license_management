import { useState } from "react";
import { Avatar, Chip, Button, Select, SelectItem } from "@heroui/react";
import { useT } from "../context/LanguageContext";

const LANGUAGES = ["English", "Japanese", "Chinese", "Korean", "French", "German", "Spanish"];
const TIMEZONES = [
  "Asia/Tokyo", "Asia/Kolkata", "Asia/Singapore", "Asia/Seoul",
  "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "UTC",
];
const ROLES = ["System Manager", "License Officer", "Training Coordinator", "HR Manager", "Report Viewer"];

function UserProfile({ user }) {
  const t = useT();

  const PROFILE_TABS = [
    { key: "profile",      label: t("profile.tabDetails") },
    { key: "security",     label: t("profile.tabSecurity") },
    { key: "roles",        label: t("profile.tabRoles") },
    { key: "preferences",  label: t("profile.tabPreferences") },
  ];

  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [userRoles, setUserRoles] = useState(["System Manager", "License Officer"]);
  const [selectedRole, setSelectedRole] = useState(new Set([]));

  const nameParts = (user?.full_name || "").split(" ");
  const [form, setForm] = useState({
    first_name:          nameParts[0] || "",
    middle_name:         nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "",
    last_name:           nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
    email:               user?.usr || "",
    username:            user?.usr || "",
    language:            "English",
    timezone:            "Asia/Tokyo",
    enabled:             true,
    send_welcome_email:  false,
  });

  const [passwords, setPasswords] = useState({ current: "", new_pw: "", confirm: "" });
  const [prefs, setPrefs] = useState({
    theme: "Light",
    date_format: "YYYY-MM-DD",
    notifications_sidebar: true,
    email_notifications: true,
    compact_mode: false,
  });

  const initials = ((form.first_name[0] || "") + (form.last_name[0] || "")).toUpperCase() || (user?.usr?.[0] || "U").toUpperCase();
  const displayName = [form.first_name, form.last_name].filter(Boolean).join(" ") || user?.full_name || "User";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setSaved(false);
  };

  const handlePrefChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrefs(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordSave = () => {
    setPwError("");
    if (!passwords.current) { setPwError(t("profile.pwCurrentRequired")); return; }
    if (passwords.new_pw.length < 8) { setPwError(t("profile.pwMin8Error")); return; }
    if (passwords.new_pw !== passwords.confirm) { setPwError(t("profile.pwMismatch")); return; }
    setPwSaved(true);
    setPasswords({ current: "", new_pw: "", confirm: "" });
    setTimeout(() => setPwSaved(false), 3000);
  };

  const handleAddRole = () => {
    const role = [...selectedRole][0];
    if (role && !userRoles.includes(role)) {
      setUserRoles(r => [...r, role]);
      setSelectedRole(new Set([]));
    }
  };

  const handleRemoveRole = (role) => {
    setUserRoles(r => r.filter(x => x !== role));
  };

  const availableRoles = ROLES.filter(r => !userRoles.includes(r));

  return (
    <div className="lms-page">
      {/* Toolbar */}
      <div className="lms-toolbar">
        {activeTab === "profile" && (
          <button className="lms-icon-btn btn-primary" data-label={t("common.save")} title={t("common.save")} onClick={handleSave}>
            <span className="lms-ibtn-icon">&#128190;</span>
          </button>
        )}
        {activeTab === "security" && (
          <button className="lms-icon-btn btn-primary" data-label={t("common.update")} title={t("profile.changePassword")} onClick={handlePasswordSave}>
            <span className="lms-ibtn-icon">&#128190;</span>
          </button>
        )}
        <div className="lms-toolbar-sep" />
        <button className="lms-icon-btn" data-label={t("profile.createEmail")} title={t("profile.createEmail")}>
          <span className="lms-ibtn-icon">&#9993;</span>
        </button>
        {(saved || pwSaved) && (
          <span className="lms-saved-badge" style={{ margin: "auto 8px" }}>&#10003; {t("common.saved")}</span>
        )}
      </div>

      {/* Profile header card */}
      <div className="card up-header-card">
        <div className="up-profile-header">
          <Avatar
            name={initials}
            className="w-[68px] h-[68px] text-[22px] font-extrabold bg-gradient-to-br from-[#1814F3] to-[#4C49ED] text-white flex-shrink-0"
            style={{ boxShadow: "0 6px 20px rgba(24,20,243,0.28)" }}
          />
          <div className="up-user-info">
            <div className="up-user-name">{displayName}</div>
            <div className="up-user-role">{t("profile.systemUser")}</div>
            <div className="up-user-email">{form.email}</div>
          </div>
          <div className="up-header-actions">
            <Chip
              color={form.enabled ? "success" : "danger"}
              variant="flat"
              size="sm"
              className="font-bold"
            >
              {form.enabled ? "\u2713 " + t("common.enabled") : "\u2715 " + t("common.disabled")}
            </Chip>
          </div>
        </div>
      </div>

      {/* Custom CSS Tabs */}
      <div className="lm-tabs">
        {PROFILE_TABS.map(tab => (
          <button
            key={tab.key}
            className={`lm-tab ${activeTab === tab.key ? "lm-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="lm-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="lm-tab-content">

        {/* USER DETAILS */}
        {activeTab === "profile" && (
          <div className="lms-page">
            <div className="card">
              <h3 className="lms-section-title">{t("profile.basicInfo")}</h3>
              <div style={{ marginBottom: 20 }}>
                <label className="lms-checkbox-label">
                  <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} />
                  {t("profile.enabled")}
                </label>
              </div>
              <div className="lms-grid-3">
                <div className="lms-field">
                  <label className="lms-label">{t("profile.emailLabel")} <span className="lms-required">*</span></label>
                  <input name="email" className="lms-input" value={form.email} onChange={handleChange} placeholder="user@example.com" />
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("profile.usernameLabel")}</label>
                  <input name="username" className="lms-input" value={form.username} onChange={handleChange} placeholder="username" />
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("profile.language")}</label>
                  <select name="language" className="lms-input" value={form.language} onChange={handleChange}>
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("profile.firstName")} <span className="lms-required">*</span></label>
                  <input name="first_name" className="lms-input" value={form.first_name} onChange={handleChange} placeholder={t("profile.firstName")} />
                </div>
                <div className="lms-field" />
                <div className="lms-field">
                  <label className="lms-label">{t("profile.timezone")}</label>
                  <select name="timezone" className="lms-input" value={form.timezone} onChange={handleChange}>
                    {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
                  </select>
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("profile.middleName")}</label>
                  <input name="middle_name" className="lms-input" value={form.middle_name} onChange={handleChange} placeholder={t("profile.middleName")} />
                </div>
                <div className="lms-field" />
                <div className="lms-field" style={{ justifyContent: "flex-end", paddingTop: 24 }}>
                  <label className="lms-checkbox-label">
                    <input type="checkbox" name="send_welcome_email" checked={form.send_welcome_email} onChange={handleChange} />
                    {t("profile.sendWelcomeEmail")}
                  </label>
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("profile.lastName")}</label>
                  <input name="last_name" className="lms-input" value={form.last_name} onChange={handleChange} placeholder={t("profile.lastName")} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY */}
        {activeTab === "security" && (
          <div className="lms-page">
            <div className="card">
              <h3 className="lms-section-title">{t("profile.changePassword")}</h3>
              {pwError && <div className="up-error-banner">{pwError}</div>}
              <div style={{ maxWidth: 440, display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="lms-field">
                  <label className="lms-label">{t("profile.currentPassword")} <span className="lms-required">*</span></label>
                  <input type="password" className={`lms-input ${pwError && !passwords.current ? "input-error" : ""}`}
                    placeholder={t("profile.currentPassword")} value={passwords.current}
                    onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("profile.newPassword")} <span className="lms-required">*</span></label>
                  <input type="password" className="lms-input" placeholder={t("profile.pwMin8")}
                    value={passwords.new_pw} onChange={e => setPasswords(p => ({ ...p, new_pw: e.target.value }))} />
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("profile.confirmPassword")} <span className="lms-required">*</span></label>
                  <input type="password" className="lms-input" placeholder={t("profile.pwRepeat")}
                    value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="lms-section-title">{t("profile.loginSessions")}</h3>
              <div className="up-session-item">
                <div className="up-session-dot up-session-active" />
                <div className="up-session-info">
                  <div className="up-session-device">{t("profile.currentSession")}</div>
                  <div className="up-session-meta">{t("profile.activeNow")} &nbsp;&#8226;&nbsp; {new Date().toLocaleDateString("ja-JP")}</div>
                </div>
                <Chip color="success" variant="flat" size="sm" className="font-bold">{t("profile.active")}</Chip>
              </div>
            </div>
          </div>
        )}

        {/* ROLES & PERMISSIONS */}
        {activeTab === "roles" && (
          <div className="lms-page">
            <div className="card">
              <h3 className="lms-section-title">{t("profile.assignedRoles")}</h3>
              {userRoles.length === 0 ? (
                <div className="lms-empty-state"><span>&#128274;</span><p>{t("profile.noRoles")}</p></div>
              ) : (
                <div className="up-roles-list">
                  {userRoles.map(role => (
                    <div key={role} className="up-role-row">
                      <span className="up-role-badge">&#128737; {role}</span>
                      <Button size="sm" color="danger" variant="flat" onPress={() => handleRemoveRole(role)}>
                        {t("profile.remove")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <h3 className="lms-section-title">{t("profile.addRole")}</h3>
              <div className="up-add-role-row">
                <Select
                  placeholder={t("profile.selectRole")}
                  selectedKeys={selectedRole}
                  onSelectionChange={setSelectedRole}
                  className="max-w-xs"
                  variant="bordered"
                  size="sm"
                  classNames={{
                    trigger: "border-[#E6EFF5] bg-[#F5F7FA] data-[hover=true]:border-[#1814F3]",
                  }}
                >
                  {availableRoles.map(r => <SelectItem key={r}>{r}</SelectItem>)}
                </Select>
                <Button color="primary" size="sm" onPress={handleAddRole} isDisabled={selectedRole.size === 0}>
                  {t("profile.addRole")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PREFERENCES */}
        {activeTab === "preferences" && (
          <div className="lms-page">
            <div className="card">
              <h3 className="lms-section-title">{t("profile.displayPrefs")}</h3>
              <div className="lms-grid-2">
                <div className="lms-field">
                  <label className="lms-label">{t("profile.theme")}</label>
                  <select name="theme" className="lms-input" value={prefs.theme} onChange={handlePrefChange}>
                    <option>Light</option><option>Dark</option><option>System Default</option>
                  </select>
                </div>
                <div className="lms-field">
                  <label className="lms-label">{t("profile.dateFormat")}</label>
                  <select name="date_format" className="lms-input" value={prefs.date_format} onChange={handlePrefChange}>
                    <option>YYYY-MM-DD</option><option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option><option>YYYY/MM/DD</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="lms-section-title">{t("profile.notifications")}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label className="lms-checkbox-label">
                  <input type="checkbox" name="notifications_sidebar" checked={prefs.notifications_sidebar} onChange={handlePrefChange} />
                  {t("profile.notifSidebar")}
                </label>
                <label className="lms-checkbox-label">
                  <input type="checkbox" name="email_notifications" checked={prefs.email_notifications} onChange={handlePrefChange} />
                  {t("profile.notifEmail")}
                </label>
                <label className="lms-checkbox-label">
                  <input type="checkbox" name="compact_mode" checked={prefs.compact_mode} onChange={handlePrefChange} />
                  {t("profile.compactMode")}
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
