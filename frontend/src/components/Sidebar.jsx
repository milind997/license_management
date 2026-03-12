import { useState } from "react";
import { useT } from "../context/LanguageContext";

function Sidebar({ activeMenu, onMenuClick, user, onLogout, isOpen = true }) {
  const t = useT();
  const [expanded, setExpanded] = useState({ transactions: true, license: true });
  const [expandedSg, setExpandedSg] = useState({ sales: true });

  const modules = [
    {
      key: "transactions",
      labelKey: "nav.transactions",
      icon: "&#128179;",
      color: "#f0ad4e",
      subgroups: [
        {
          key: "sales",
          labelKey: "nav.sales",
          items: [
            { key: "quotations", labelKey: "nav.quotations" },
          ],
        },
      ],
    },
    {
      key: "license",
      labelKey: "nav.licenseModule",
      icon: "&#128196;",
      color: "#26c281",
      items: [
        { key: "license-management", labelKey: "nav.licenseManagement" },
        { key: "license-renewal",    labelKey: "nav.licenseRenewal" },
      ],
    },
  ];

  const toggleModule = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));
  const toggleSg = (key) => setExpandedSg((p) => ({ ...p, [key]: !p[key] }));

  const renderItems = (items) =>
    items.map((item) => (
      <div
        key={item.key}
        className={`sidebar-subitem ${activeMenu === item.key ? "sidebar-subitem-active" : ""}`}
        onClick={() => onMenuClick(item.key)}
      >
        <span className="sidebar-subitem-dot" />
        <span>{t(item.labelKey)}</span>
      </div>
    ));

  return (
    <aside className={`sidebar${isOpen ? "" : " sidebar-collapsed"}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand-row">
          <div className="sidebar-logo-mark">
            <img src="/sogo-logo.svg" alt="Sogo Medical Group" className="sidebar-logo-full" />
          </div>
          <div className="sidebar-brand-text">
            <div className="sidebar-app-name">SOGO MEDICAL</div>
            <div className="sidebar-app-sub">GROUP</div>
          </div>
        </div>
        <div className="sidebar-username">{user?.full_name || user?.usr}</div>
      </div>

      <div className="sidebar-search">
        <span className="sidebar-search-icon">&#128269;</span>
        <span className="sidebar-search-text">{t("nav.search")}</span>
        <span className="sidebar-search-shortcut">{t("nav.searchShortcut")}</span>
      </div>

      <nav className="sidebar-nav">
        {/* Dashboard */}
        <div
          className={`sidebar-item ${activeMenu === "dashboard" ? "sidebar-item-active" : ""}`}
          onClick={() => onMenuClick("dashboard")}
        >
          <span className="sidebar-item-icon">&#9732;</span>
          <span className="sidebar-item-label">{t("nav.dashboard")}</span>
        </div>

        {/* Module groups */}
        {modules.map((mod) => (
          <div key={mod.key} className="sidebar-module-group">
            <div
              className="sidebar-module-header"
              onClick={() => toggleModule(mod.key)}
              style={{ borderLeft: `3px solid ${mod.color}` }}
            >
              <span
                className="sidebar-module-icon"
                dangerouslySetInnerHTML={{ __html: mod.icon }}
                style={{ color: mod.color }}
              />
              <span className="sidebar-module-label">{t(mod.labelKey)}</span>
              <span className={`sidebar-chevron ${expanded[mod.key] ? "chevron-open" : ""}`}>
                &#9662;
              </span>
            </div>

            {expanded[mod.key] && (
              <div className="sidebar-submenu">
                {/* Direct items */}
                {mod.items && renderItems(mod.items)}

                {/* Sub-groups (e.g. Sales under Transactions) */}
                {mod.subgroups?.map((sg) => (
                  <div key={sg.key}>
                    <div
                      className="sidebar-subgroup-header"
                      onClick={() => toggleSg(sg.key)}
                    >
                      <span className="sidebar-subgroup-label">{t(sg.labelKey)}</span>
                      <span className={`sidebar-chevron-sm ${expandedSg[sg.key] ? "chevron-open" : ""}`}>
                        &#9662;
                      </span>
                    </div>
                    {expandedSg[sg.key] && (
                      <div className="sidebar-subgroup-items">
                        {renderItems(sg.items)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Reports */}
        <div
          className={`sidebar-item ${activeMenu === "reports" ? "sidebar-item-active" : ""}`}
          onClick={() => onMenuClick("reports")}
        >
          <span className="sidebar-item-icon">&#128202;</span>
          <span className="sidebar-item-label">{t("nav.reports")}</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          &#x2B9E; {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
