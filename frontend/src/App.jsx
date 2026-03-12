import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TrainingForm from "./components/TrainingForm";
import TrainingList from "./components/TrainingList";
import TrainingCertificate from "./components/TrainingCertificate";
import TrainingSchedule from "./components/TrainingSchedule";
import LicenseManagement from "./components/LicenseManagement";
import LicenseBasicInfo from "./components/LicenseBasicInfo";
import LicenseDetails from "./components/LicenseDetails";
import LicensePersonnel from "./components/LicensePersonnel";
import LicenseDocuments from "./components/LicenseDocuments";
import LicenseRenewal from "./components/LicenseRenewal";
import UserProfile from "./components/UserProfile";
import Quotation from "./components/Quotation";
import { LanguageProvider, useLanguage, useT } from "./context/LanguageContext";
import {
  getTrainings,
  createTraining,
  updateTraining,
  deleteTraining,
} from "./services/erpService";
import "./App.css";

const pageInfoKeys = {
  dashboard:             { moduleKey: null,                             subModuleKey: null,         titleKey: "page.dashboard" },
  quotations:            { moduleKey: "nav.transactions",               subModuleKey: "nav.sales",  titleKey: "nav.quotations" },
  "license-management":  { moduleKey: "page.licenseManagementSystem",  subModuleKey: null,         titleKey: "page.licenseManagement" },
  "license-basic-info":  { moduleKey: "page.licenseManagementSystem",  subModuleKey: null,         titleKey: "page.basicInformation" },
  "license-details":     { moduleKey: "page.licenseManagementSystem",  subModuleKey: null,         titleKey: "page.licenseDetails" },
  "license-personnel":   { moduleKey: "page.licenseManagementSystem",  subModuleKey: null,         titleKey: "page.responsiblePersonnel" },
  "license-documents":   { moduleKey: "page.licenseManagementSystem",  subModuleKey: null,         titleKey: "page.attachedDocuments" },
  "license-renewal":     { moduleKey: "page.licenseManagementSystem",  subModuleKey: null,         titleKey: "page.licenseRenewal" },
  reports:               { moduleKey: null,                             subModuleKey: null,         titleKey: "page.reports" },
  "user-profile":        { moduleKey: null,                             subModuleKey: null,         titleKey: "page.userProfile" },
};

function TrainingProgramPage() {
  const t = useT();
  const [trainings, setTrainings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [start, setStart] = useState(0);

  const loadData = async () => {
    const res = await getTrainings(search, 5, start);
    setTrainings(res.data.data);
  };

  useEffect(() => { loadData(); }, [search, start]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => { setSelected(null); setIsOpen(true); };
  const openEdit = (item) => { setSelected(item); setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); setSelected(null); };

  const handleSave = async (form) => {
    const payload = { ...form, mandatory: form.mandatory ? 1 : 0 };
    if (selected) {
      await updateTraining(selected.name, payload);
    } else {
      await createTraining(payload);
    }
    closeModal();
    loadData();
  };

  const handleDelete = async (name) => {
    await deleteTraining(name);
    loadData();
  };

  return (
    <div>
      <div className="lms-toolbar">
        <button className="lms-icon-btn btn-primary" data-label={t("common.new")} title={t("training.modalAdd")} onClick={openAdd}>
          <span className="lms-ibtn-icon">+</span>
        </button>
      </div>

      <TrainingList
        data={trainings}
        onEdit={openEdit}
        onDelete={handleDelete}
        search={search}
        setSearch={setSearch}
        nextPage={() => setStart(start + 5)}
        prevPage={() => setStart(Math.max(0, start - 5))}
      />

      <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) closeModal(); }} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-[#343c6a] font-bold text-[16px] border-b border-[#F2F4F7]">
                {selected ? t("training.modalEdit") : t("training.modalAdd")}
              </ModalHeader>
              <ModalBody className="py-6">
                <TrainingForm selected={selected} onSave={handleSave} onCancel={onClose} />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

function ReportsPage() {
  const t = useT();
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">&#128202;</div>
      <h2>{t("reports.title")}</h2>
      <p>{t("reports.desc")}</p>
      <p className="placeholder-note">{t("reports.soon")}</p>
    </div>
  );
}

function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="lang-selector">
      <button
        className={`lang-btn ${lang === "ja" ? "lang-btn-active" : ""}`}
        onClick={() => setLang("ja")}
        title="日本語"
      >
        JA
      </button>
      <span className="lang-sep">|</span>
      <button
        className={`lang-btn ${lang === "en" ? "lang-btn-active" : ""}`}
        onClick={() => setLang("en")}
        title="English"
      >
        EN
      </button>
    </div>
  );
}

function AppInner() {
  const t = useT();
  // Use boot data from Frappe server (injected via www/license_management.html)
  const bootUser = window.user || null;
  const [user] = useState(bootUser ? {
    usr: bootUser.name,
    full_name: bootUser.full_name,
    user_image: bootUser.image,
  } : null);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    window.location.href = "/api/method/logout";
  };

  if (!user) {
    window.location.href = `/login?redirect-to=${encodeURIComponent("/license-management")}`;
    return null;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":           return <Dashboard user={user} onNavigate={setActiveMenu} />;
      case "quotations":          return <Quotation />;
      // case "training-program":    return <TrainingProgramPage />;
      // case "training-certificate":return <TrainingCertificate />;
      // case "training-schedule":   return <TrainingSchedule />;
      case "license-management":  return <LicenseManagement />;
      case "license-basic-info":  return <LicenseBasicInfo />;
      case "license-details":     return <LicenseDetails />;
      case "license-personnel":   return <LicensePersonnel />;
      case "license-documents":   return <LicenseDocuments />;
      case "license-renewal":     return <LicenseRenewal />;
      case "reports":             return <ReportsPage />;
      case "user-profile":        return <UserProfile user={user} />;
      default:                    return <Dashboard user={user} onNavigate={setActiveMenu} />;
    }
  };

  const { moduleKey, subModuleKey, titleKey } = pageInfoKeys[activeMenu] || { moduleKey: null, subModuleKey: null, titleKey: "" };

  return (
    <div className="app-layout">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={setActiveMenu}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
      />
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-toggle-btn" onClick={() => setSidebarOpen((o) => !o)} title="Toggle sidebar">
              &#9776;
            </button>
          </div>
          <div className="topbar-breadcrumb">
            {moduleKey && (
              <>
                <span className="topbar-module">{t(moduleKey)}</span>
                <span className="topbar-sep">/</span>
              </>
            )}
            {subModuleKey && (
              <>
                <span className="topbar-module">{t(subModuleKey)}</span>
                <span className="topbar-sep">/</span>
              </>
            )}
            <span className="topbar-page">{titleKey ? t(titleKey) : ""}</span>
          </div>
          <div className="topbar-right">
            <LanguageSelector />
            <button
              className="topbar-avatar-btn"
              title={user?.full_name || user?.usr}
              onClick={() => setActiveMenu("user-profile")}
            >
              {((user?.full_name || user?.usr || "U")[0]).toUpperCase()}
            </button>
          </div>
        </header>
        <main className="main-content">{renderContent()}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

export default App;
