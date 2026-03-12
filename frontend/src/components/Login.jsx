import React, { useState } from "react";
import { loginUser } from "../services/erpService";
import { useT } from "../context/LanguageContext";

function Login({ onLogin }) {
  const t = useT();
  const [form, setForm] = useState({ usr: "", pwd: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.usr.trim()) newErrors.usr = t("login.usernameRequired");
    if (!form.pwd) newErrors.pwd = t("login.passwordRequired");
    else if (form.pwd.length < 4) newErrors.pwd = t("login.passwordMinLength");
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
    if (apiError) setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser(form.usr, form.pwd);
      const userData = {
        full_name: res.data.full_name || form.usr,
        usr: form.usr,
      };
      localStorage.setItem("erp_user", JSON.stringify(userData));
      onLogin(userData);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.exc_type ||
        t("login.invalidCredentials");
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Brand */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <img src="/sogo-logo.svg" alt="Sogo Medical Group" className="sidebar-logo-full" />
          </div>
          <h2 className="login-title">SOGO MEDICAL</h2>
          <div className="login-title-sub">GROUP</div>
          <p className="login-subtitle">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {apiError && (
            <div className="login-error-banner">
              <span className="error-icon">&#9888;</span> {apiError}
            </div>
          )}

          {/* Username */}
          <div className="login-field">
            <label className="login-label" htmlFor="usr">{t("login.usernameLabel")}</label>
            <input
              id="usr"
              name="usr"
              type="text"
              className={`login-input ${errors.usr ? "input-error" : ""}`}
              placeholder={t("login.usernamePlaceholder")}
              value={form.usr}
              onChange={handleChange}
              autoComplete="username"
            />
            {errors.usr && <span className="field-error">{errors.usr}</span>}
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label" htmlFor="pwd">{t("login.passwordLabel")}</label>
            <div style={{ position: "relative" }}>
              <input
                id="pwd"
                name="pwd"
                type={showPwd ? "text" : "password"}
                className={`login-input ${errors.pwd ? "input-error" : ""}`}
                placeholder={t("login.passwordPlaceholder")}
                value={form.pwd}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingRight: 56 }}
              />
              <span
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#8BA3CB",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                {showPwd ? t("login.hide") : t("login.show")}
              </span>
            </div>
            {errors.pwd && <span className="field-error">{errors.pwd}</span>}
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? t("login.signingIn") : t("login.signIn")}
          </button>
        </form>

        <p className="login-footer">{t("login.poweredBy")} <strong>Fidel Softech</strong></p>
      </div>
    </div>
  );
}

export default Login;
