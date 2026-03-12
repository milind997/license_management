import { useEffect, useState } from "react";
import { getQuotationStats, getLicenseStats } from "../services/erpService";
import { useT } from "../context/LanguageContext";

function StatCard({ label, value, color, icon, loading }) {
  return (
    <div className="dashboard-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="dashboard-card-icon" style={{ color, background: `${color}1a` }} dangerouslySetInnerHTML={{ __html: icon }} />
      <div className="dashboard-card-value" style={{ color }}>
        {loading ? <span style={{ fontSize: 22, color: "#8BA3CB" }}>…</span> : value}
      </div>
      <div className="dashboard-card-label">{label}</div>
    </div>
  );
}

function ModuleSection({ title, color, icon, cards, items, onNavigate, loading }) {
  return (
    <div className="dashboard-module-section" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="dashboard-module-heading">
        <div className="dashboard-module-heading-icon" style={{ color, background: `${color}18` }} dangerouslySetInnerHTML={{ __html: icon }} />
        <h3 style={{ color }}>{title}</h3>
      </div>
      <div className="dashboard-cards">
        {cards.map((card) => <StatCard key={card.label} {...card} loading={loading} />)}
      </div>
      <div className="dashboard-module-links">
        {items.map((item) => (
          <span key={item.key} className="dashboard-module-link" style={{ borderColor: color, color }} onClick={() => onNavigate(item.key)}>
            {item.label} &#8250;
          </span>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ user, onNavigate }) {
  const t = useT();

  const [quotStats, setQuotStats] = useState({ total: 0, draft: 0, submitted: 0, approved: 0 });
  const [quotLoading, setQuotLoading] = useState(true);

  const [licStats, setLicStats] = useState({ total: 0, active: 0, expiring: 0, renewal_pending: 0 });
  const [licLoading, setLicLoading] = useState(true);

  useEffect(() => {
    setQuotLoading(true);
    getQuotationStats()
      .then((res) => {
        const data = res.data.data || [];
        setQuotStats({
          total: data.length,
          draft: data.filter((q) => q.status === "Draft").length,
          submitted: data.filter((q) => q.status === "Submitted").length,
          approved: data.filter((q) => q.status === "Approved").length,
        });
      })
      .catch(() => setQuotStats({ total: "—", draft: "—", submitted: "—", approved: "—" }))
      .finally(() => setQuotLoading(false));

    setLicLoading(true);
    getLicenseStats()
      .then((res) => {
        const d = res.data.message || {};
        setLicStats({ total: d.total || 0, active: d.active || 0, expiring: d.expiring || 0, renewal_pending: d.renewal_pending || 0 });
      })
      .catch(() => setLicStats({ total: "—", active: "—", expiring: "—", renewal_pending: "—" }))
      .finally(() => setLicLoading(false));
  }, []);

  const quotationCards = [
    { label: t("dashboard.totalQuotations"), value: quotStats.total, color: "#f0ad4e", icon: "&#128203;" },
    { label: t("dashboard.quotationsDraft"), value: quotStats.draft, color: "#8BA3CB", icon: "&#128394;" },
    { label: t("dashboard.quotationsSubmitted"), value: quotStats.submitted, color: "#5e64ff", icon: "&#128228;" },
    { label: t("dashboard.quotationsApproved"), value: quotStats.approved, color: "#26c281", icon: "&#9989;" },
  ];

  const licenseCards = [
    { label: t("dashboard.licenseRegistered"), value: licStats.total, color: "#e74c3c", icon: "&#127978;" },
    { label: t("dashboard.licenseActive"), value: licStats.active, color: "#26c281", icon: "&#9989;" },
    { label: t("dashboard.licenseExpiring"), value: licStats.expiring, color: "#f0ad4e", icon: "&#9888;" },
    { label: t("dashboard.licenseRenewal"), value: licStats.renewal_pending, color: "#5e64ff", icon: "&#128260;" },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">{t("dashboard.welcome")}, {user?.full_name || "User"}</h2>
        <p className="dashboard-subtitle">{t("dashboard.subtitle")}</p>
      </div>

      <ModuleSection title={t("dashboard.quotationTitle")} color="#f0ad4e" icon="&#128203;" cards={quotationCards} items={[{ key: "quotations", label: t("nav.quotations") }]} onNavigate={onNavigate} loading={quotLoading} />

      <ModuleSection title={t("dashboard.licenseManagementSystem")} color="#26c281" icon="&#128196;" cards={licenseCards} items={[
        { key: "license-management", label: t("nav.licenseManagement") },
        { key: "license-renewal", label: t("nav.licenseRenewal") },
      ]} onNavigate={onNavigate} loading={licLoading} />
    </div>
  );
}

export default Dashboard;
