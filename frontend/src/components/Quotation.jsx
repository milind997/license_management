import { useState, useEffect } from "react";
import { useT } from "../context/LanguageContext";
import {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  getCustomers,
  getAddresses,
} from "../services/erpService";

// ── ERPNext defaults (update to match your ERPNext setup) ─────────────────────
const ERP_COMPANY   = "FidelTech";
const ERP_WAREHOUSE = "Stores - F";
const ERP_PRICE_LIST = "Standard Selling";

// ── Local dropdown master data (form helpers) ─────────────────────────────────
// Customers and addresses are fetched from ERPNext dynamically

const TERMS_CODES   = ["NET30", "NET60", "NET90", "IMMEDIATE", "COD", "LC"];
const STATUSES      = ["Draft", "Submitted", "Approved", "Rejected"];
const REASONS_WON   = ["Price", "Quality", "Relationship", "Delivery", "Other"];
const REASONS_LOSS  = ["Price", "Competition", "Timing", "Quality", "Other"];

const CURRENCIES = [
  { code: "INR", desc: "Indian Rupee",       rate: 1 },
  { code: "JPY", desc: "Japanese Yen",       rate: 1 },
  { code: "USD", desc: "US Dollar",          rate: 83.5 },
  { code: "EUR", desc: "Euro",               rate: 90.2 },
  { code: "SGD", desc: "Singapore Dollar",   rate: 62.1 },
];

const TAX_CODES = [
  { code: "TAX10", desc: "消費税 10%", rate: 10 },
  { code: "TAX08", desc: "消費税 8%",  rate: 8 },
  { code: "EXEMPT", desc: "非課税",    rate: 0 },
];

const ITEMS = [
  { code: "JP-MED-001", desc: "Amoxicillin 500mg Capsules" },
  { code: "JP-MED-002", desc: "Ibuprofen 400mg Tablets" },
  { code: "ITEM-001",   desc: "Amoxicillin 500mg Capsules" },
  { code: "ITEM-002",   desc: "Ibuprofen 400mg Tablets" },
  { code: "ITEM-003",   desc: "Vitamin C 1000mg" },
  { code: "ITEM-004",   desc: "Omeprazole 20mg" },
  { code: "ITEM-005",   desc: "Metformin 500mg" },
  { code: "ITEM-006",   desc: "Atorvastatin 10mg" },
  { code: "ITEM-007",   desc: "Paracetamol 500mg" },
  { code: "ITEM-008",   desc: "Cetirizine 10mg" },
];

const UOM_OPTIONS   = ["pcs", "box", "kg", "L", "set", "lot", "strip", "Nos"];
const PACK_SIZES    = ["10", "20", "30", "50", "100"];
const PACK_TYPES    = ["Blister", "Bottle", "Box", "Sachet", "Vial"];
const CUST_ITEMS    = ["CI-001", "CI-002", "CI-003", "CI-004"];
const LINE_STATUSES = ["Open", "Confirmed", "Cancelled"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const emptyHeader = {
  quotationNo: "",
  customerCode: "",
  customerName: "",
  shipToCode: "",
  shipToName: "",
  termsCode: "",
  contact: "",
  status: "Draft",
  quotationDate: new Date().toISOString().split("T")[0],
  expirationDate: "",
  reasonWon: "",
  reasonLoss: "",
  quotationPrice: 0,
  quotationCost: 0,
  customerAddress: "",
  shipToAddress: "",
  currencyCode: "INR",
  currencyDesc: "Indian Rupee",
  exchangeRate: 1,
  taxCode: "TAX10",
};

const emptyLine = {
  itemCode: "",
  itemDesc: "",
  status: "Open",
  uom: "pcs",
  dueDate: "",
  quoteQty: 1,
  packSize: "",
  customerItem: "",
  packType: "",
  unitPrice: 0,
  salesDisc: 0,
  netAmount: 0,
  extendedAmount: 0,
  taxCode: "TAX10",
  taxDesc: "消費税 10%",
  totalAmount: 0,
};

function calcLineAmounts(line) {
  const net      = Number(line.quoteQty) * Number(line.unitPrice);
  const extended = net * (1 - Number(line.salesDisc) / 100);
  const taxRate  = (TAX_CODES.find((tc) => tc.code === line.taxCode)?.rate || 0) / 100;
  const total    = extended * (1 + taxRate);
  return { netAmount: net, extendedAmount: extended, totalAmount: total };
}

function fmt(n) {
  return new Intl.NumberFormat("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
}

const STATUS_COLORS = {
  Draft: "#8BA3CB", Submitted: "#f0ad4e", Approved: "#26c281", Rejected: "#e74c3c",
  Open: "#8BA3CB",  Confirmed: "#26c281", Cancelled: "#e74c3c",
};

// Map ERPNext single-doc response → form header
function erpDocToHeader(doc) {
  const cur = CURRENCIES.find((c) => c.code === doc.currency);
  return {
    quotationNo:     doc.name                   || "",
    customerCode:    doc.customer               || "",
    customerName:    doc.customer               || "",
    shipToCode:      doc.shipping_address_name  || "",
    shipToName:      doc.shipping_address_display || doc.shipping_address || "",
    termsCode:       doc.payment_terms_template || "",
    contact:         doc.contact_person         || "",
    status:          doc.status                 || "Draft",
    quotationDate:   doc.transaction_date       || "",
    expirationDate:  doc.valid_till             || "",
    reasonWon:       "",
    reasonLoss:      doc.order_lost_reason      || "",
    quotationPrice:  doc.grand_total            || 0,
    quotationCost:   0,
    customerAddress: doc.customer_address       || "",
    shipToAddress:   doc.shipping_address_display || "",
    currencyCode:    doc.currency               || "INR",
    currencyDesc:    cur?.desc                  || "",
    exchangeRate:    doc.conversion_rate        || 1,
    taxCode:         "TAX10",
  };
}

// Map ERPNext item row → local line
function erpItemToLine(item) {
  const localItem = ITEMS.find((i) => i.code === item.item_code);
  return {
    itemCode:       item.item_code              || "",
    itemDesc:       item.item_name || localItem?.desc || item.description || "",
    status:         "Open",
    uom:            item.uom                    || "pcs",
    dueDate:        item.delivery_date          || "",
    quoteQty:       item.qty                    || 1,
    packSize:       "",
    customerItem:   item.customer_item_code     || "",
    packType:       "",
    unitPrice:      item.rate                   || 0,
    salesDisc:      item.discount_percentage    || 0,
    netAmount:      item.amount                 || 0,
    extendedAmount: item.net_amount || item.amount || 0,
    taxCode:        "TAX10",
    taxDesc:        "消費税 10%",
    totalAmount:    item.amount                 || 0,
  };
}

// Map form header + lines → ERPNext POST/PUT payload
function buildPayload(header, lines) {
  return {
    doctype:            "Quotation",
    quotation_to:       "Customer",
    customer:           header.customerCode,
    transaction_date:   header.quotationDate,
    ...(header.expirationDate ? { valid_till: header.expirationDate } : {}),
    company:            ERP_COMPANY,
    currency:           header.currencyCode,
    selling_price_list: ERP_PRICE_LIST,
    items: lines.map((ln) => ({
      item_code: ln.itemCode,
      qty:       Number(ln.quoteQty),
      rate:      Number(ln.unitPrice),
      warehouse: ERP_WAREHOUSE,
    })),
  };
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({ label, required, children, readOnly, style }) {
  return (
    <div className="lms-field" style={style}>
      <label className="lms-label">
        {label}{required && <span className="lms-required"> *</span>}
        {readOnly && <span className="lms-auto-badge" style={{ marginLeft: 6 }}>Auto</span>}
      </label>
      {children}
    </div>
  );
}

// ── Quotation Lines sub-page ──────────────────────────────────────────────────
function QuotationLinesPage({ quotation, onBack, onSaveLines, t }) {
  const [lines, setLines]         = useState(quotation.lines || []);
  const [currentLine, setCurrent] = useState({ ...emptyLine });
  const [lineIdx, setLineIdx]     = useState(null);
  const [saved, setSaved]         = useState(false);

  const handleLineChange = (e) => {
    const { name, value } = e.target;
    setCurrent((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "itemCode") {
        const item = ITEMS.find((i) => i.code === value);
        updated.itemDesc = item?.desc || "";
      }
      if (name === "taxCode") {
        const tc = TAX_CODES.find((tc) => tc.code === value);
        updated.taxDesc = tc?.desc || "";
      }
      return { ...updated, ...calcLineAmounts(updated) };
    });
    setSaved(false);
  };

  const handleQtyPriceChange = (e) => {
    const { name, value } = e.target;
    setCurrent((prev) => {
      const updated = { ...prev, [name]: value };
      return { ...updated, ...calcLineAmounts(updated) };
    });
    setSaved(false);
  };

  const handleSaveLine = () => {
    if (lineIdx !== null) {
      setLines((prev) => prev.map((l, i) => (i === lineIdx ? { ...currentLine } : l)));
    } else {
      setLines((prev) => [...prev, { ...currentLine }]);
    }
    setCurrent({ ...emptyLine });
    setLineIdx(null);
    setSaved(true);
  };

  const handleAdd        = () => { setCurrent({ ...emptyLine }); setLineIdx(null); setSaved(false); };
  const handleEditLine   = (idx) => { setCurrent({ ...lines[idx] }); setLineIdx(idx); setSaved(false); };
  const handleDeleteLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleBack = () => { onSaveLines(lines); onBack(); };

  return (
    <div className="lms-page">
      {/* Toolbar */}
      <div className="lms-toolbar">
        <button className="lms-icon-btn btn-primary" data-label={t("common.add")} onClick={handleAdd}>
          <span className="lms-ibtn-icon">&#43;</span>
        </button>
        <button className="lms-icon-btn btn-primary" data-label={t("common.save")} onClick={handleSaveLine}>
          <span className="lms-ibtn-icon">&#128190;</span>
        </button>
        <button className="lms-icon-btn" data-label={t("common.delete")} onClick={() => lineIdx !== null && handleDeleteLine(lineIdx)}>
          <span className="lms-ibtn-icon">&#128465;</span>
        </button>
        <div className="lms-toolbar-sep" />
        <button className="lms-icon-btn" data-label={t("common.filter")}>
          <span className="lms-ibtn-icon">&#9783;</span>
        </button>
        <button className="lms-icon-btn" data-label={t("common.back")} onClick={handleBack}>
          <span className="lms-ibtn-icon">&#9664;</span>
        </button>
        <button className="lms-icon-btn" data-label={t("common.next")}>
          <span className="lms-ibtn-icon">&#9654;</span>
        </button>
        <div className="lms-toolbar-sep" />
        <button className="lms-icon-btn" data-label={t("common.import")}>
          <span className="lms-ibtn-icon">&#128228;</span>
        </button>
        <button className="lms-icon-btn" data-label={t("common.export")}>
          <span className="lms-ibtn-icon">&#128229;</span>
        </button>
        {saved && <span className="lms-saved-badge" style={{ margin: "auto 8px" }}>&#10003; {t("common.saved")}</span>}
      </div>

      {/* Header strip */}
      <div className="quot-lines-header">
        <div className="quot-lines-header-grid">
          <div className="lms-field">
            <label className="lms-label">{t("quotLines.estimateNo")} <span className="lms-auto-badge">Auto</span></label>
            <input className="lms-input lms-input-readonly" readOnly value={quotation.quotationNo} />
          </div>
          <div className="lms-field">
            <label className="lms-label">{t("quotLines.line")} <span className="lms-auto-badge">Auto</span></label>
            <input className="lms-input lms-input-readonly" readOnly value={lineIdx !== null ? lineIdx + 1 : lines.length + 1} />
          </div>
          <div className="lms-field">
            <label className="lms-label">{t("quotation.customerName")} <span className="lms-auto-badge">Auto</span></label>
            <input className="lms-input lms-input-readonly" readOnly value={quotation.customerName} />
          </div>
        </div>
      </div>

      {/* Main Tab form */}
      <div className="card">
        <h3 className="lms-section-title">{t("quotation.mainTab")}</h3>
        <div className="lms-grid-2">
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label={t("quotLines.itemCode")} required>
              <div style={{ display: "flex", gap: 8 }}>
                <select name="itemCode" className="lms-input" value={currentLine.itemCode} onChange={handleLineChange} style={{ flex: "0 1 120px", minWidth: 80 }}>
                  <option value="">--</option>
                  {ITEMS.map((i) => <option key={i.code} value={i.code}>{i.code}</option>)}
                </select>
                <input className="lms-input lms-input-readonly" readOnly value={currentLine.itemDesc} placeholder="Item Description" style={{ flex: 1 }} />
              </div>
            </Field>
            <Field label={t("quotLines.uom")}>
              <select name="uom" className="lms-input" value={currentLine.uom} onChange={handleLineChange}>
                {UOM_OPTIONS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label={t("quotLines.quoteQty")} required>
              <input type="number" name="quoteQty" className="lms-input" min="0" value={currentLine.quoteQty} onChange={handleQtyPriceChange} />
            </Field>
            <Field label={t("quotLines.customerItem")}>
              <select name="customerItem" className="lms-input" value={currentLine.customerItem} onChange={handleLineChange}>
                <option value="">--</option>
                {CUST_ITEMS.map((ci) => <option key={ci}>{ci}</option>)}
              </select>
            </Field>
            <Field label={t("quotLines.unitPrice")} required>
              <input type="number" name="unitPrice" className="lms-input" min="0" value={currentLine.unitPrice} onChange={handleQtyPriceChange} />
            </Field>
            <Field label={t("quotLines.salesDisc")}>
              <input type="number" name="salesDisc" className="lms-input" min="0" max="100" value={currentLine.salesDisc} onChange={handleQtyPriceChange} />
            </Field>
            <Field label={t("quotLines.netAmount")} readOnly>
              <input className="lms-input lms-input-readonly" readOnly value={fmt(currentLine.netAmount)} />
            </Field>
            <Field label={t("quotLines.extendedAmount")} readOnly>
              <input className="lms-input lms-input-readonly" readOnly value={fmt(currentLine.extendedAmount)} />
            </Field>
            <Field label={t("quotation.taxCode")}>
              <div style={{ display: "flex", gap: 8 }}>
                <select name="taxCode" className="lms-input" value={currentLine.taxCode} onChange={handleLineChange} style={{ flex: "0 1 110px", minWidth: 80 }}>
                  {TAX_CODES.map((tc) => <option key={tc.code} value={tc.code}>{tc.code}</option>)}
                </select>
                <input className="lms-input lms-input-readonly" readOnly value={currentLine.taxDesc} style={{ flex: 1 }} />
              </div>
            </Field>
            <Field label={t("quotLines.totalAmount")} readOnly>
              <input className="lms-input lms-input-readonly" readOnly value={fmt(currentLine.totalAmount)} style={{ fontWeight: 700, color: "#1814F3" }} />
            </Field>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label={t("quotLines.status")}>
              <select name="status" className="lms-input" value={currentLine.status} onChange={handleLineChange}>
                {LINE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label={t("quotLines.dueDate")}>
              <input type="date" name="dueDate" className="lms-input" value={currentLine.dueDate} onChange={handleLineChange} />
            </Field>
            <Field label={t("quotLines.packSize")}>
              <select name="packSize" className="lms-input" value={currentLine.packSize} onChange={handleLineChange}>
                <option value="">--</option>
                {PACK_SIZES.map((ps) => <option key={ps}>{ps}</option>)}
              </select>
            </Field>
            <Field label={t("quotLines.packType")}>
              <select name="packType" className="lms-input" value={currentLine.packType} onChange={handleLineChange}>
                <option value="">--</option>
                {PACK_TYPES.map((pt) => <option key={pt}>{pt}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* Added lines table */}
      {lines.length > 0 && (
        <div className="card">
          <h3 className="lms-section-title">{t("quotLines.addedLines")} ({lines.length})</h3>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("quotLines.lineNo")}</th>
                  <th>{t("quotLines.itemCode")}</th>
                  <th>{t("quotLines.itemDesc")}</th>
                  <th>{t("quotLines.quoteQty")}</th>
                  <th>{t("quotLines.unitPrice")}</th>
                  <th>{t("quotLines.salesDisc")}</th>
                  <th>{t("quotLines.extendedAmount")}</th>
                  <th>{t("quotLines.totalAmount")}</th>
                  <th>{t("common.action")}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((ln, idx) => (
                  <tr key={idx} style={{ background: lineIdx === idx ? "#EEF0FF" : "" }}>
                    <td style={{ textAlign: "center" }}>{idx + 1}</td>
                    <td>{ln.itemCode}</td>
                    <td>{ln.itemDesc}</td>
                    <td style={{ textAlign: "right" }}>{ln.quoteQty}</td>
                    <td style={{ textAlign: "right" }}>{fmt(ln.unitPrice)}</td>
                    <td style={{ textAlign: "right" }}>{ln.salesDisc}%</td>
                    <td style={{ textAlign: "right" }}>{fmt(ln.extendedAmount)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(ln.totalAmount)}</td>
                    <td style={{ display: "flex", gap: 4 }}>
                      <button className="lms-btn lms-btn-primary lms-btn-sm" onClick={() => handleEditLine(idx)}>{t("common.edit")}</button>
                      <button className="lms-btn lms-btn-danger lms-btn-sm" onClick={() => handleDeleteLine(idx)}>{t("common.delete")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quotation main page ───────────────────────────────────────────────────────
function Quotation() {
  const t = useT();
  const [view, setView]           = useState("list"); // "list" | "form" | "lines"
  const [quotations, setQuotations] = useState([]);
  const [editingId, setEditingId] = useState(null);   // ERPNext doc name string
  const [header, setHeader]       = useState({ ...emptyHeader });
  const [savedLines, setSavedLines] = useState([]);
  const [activeTab, setActiveTab] = useState("main");
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [customers, setCustomers] = useState([]);
  const [addresses, setAddresses] = useState([]);

  const FORM_TABS = [
    { key: "main",    labelKey: "quotation.mainTab" },
    { key: "address", labelKey: "quotation.addressTab" },
    { key: "amounts", labelKey: "quotation.amountsTab" },
  ];

  // ── API helpers ─────────────────────────────────────────────────────────────
  const loadQuotations = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getQuotations();
      setQuotations(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async (customerName) => {
    if (!customerName) { setAddresses([]); return; }
    try {
      const res = await getAddresses(customerName);
      setAddresses(res.data.data || []);
    } catch {
      setAddresses([]);
    }
  };

  useEffect(() => {
    loadQuotations();
    getCustomers().then((res) => setCustomers(res.data.data || [])).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-populate from ERPNext customer master when customer code changes
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    let update = { [name]: value };

    if (name === "customerCode") {
      const cust = customers.find((c) => c.name === value);
      update.customerName    = cust?.customer_name || value;
      update.currencyCode    = cust?.default_currency || "INR";
      update.customerAddress = "";
      const cur = CURRENCIES.find((c) => c.code === (cust?.default_currency || "INR"));
      update.currencyDesc    = cur?.desc || "";
      update.exchangeRate    = cur?.rate || 1;
      // Reset ship-to and fetch fresh addresses for the new customer
      update.shipToCode    = "";
      update.shipToName    = "";
      update.shipToAddress = "";
      loadAddresses(value);
    }
    if (name === "shipToCode") {
      const addr = addresses.find((a) => a.name === value);
      update.shipToName    = addr?.address_title || value;
      update.shipToAddress = [addr?.address_line1,addr?.address_line2, addr?.city, addr?.state, addr?.pincode, addr?.country]
        .filter(Boolean).join(", ");
    }
    if (name === "currencyCode") {
      const cur = CURRENCIES.find((c) => c.code === value);
      update.currencyDesc = cur?.desc || "";
      update.exchangeRate = cur?.rate || 1;
    }
    if (name === "taxCode") {
      const tc = TAX_CODES.find((tc) => tc.code === value);
      update.taxDesc = tc?.desc || "";
    }
    setHeader((h) => ({ ...h, ...update }));
    setSaved(false);
  };

  const openNew = () => {
    setHeader({ ...emptyHeader });
    setSavedLines([]);
    setEditingId(null);
    setActiveTab("main");
    setSaved(false);
    setError("");
    setView("form");
  };

  // Load full doc from API for editing
  const openEdit = async (q) => {
    setLoading(true);
    setError("");
    try {
      const res = await getQuotation(q.name);
      const doc = res.data.data;
      setHeader(erpDocToHeader(doc));
      setSavedLines((doc.items || []).map(erpItemToLine));
      setEditingId(doc.name);
      loadAddresses(doc.customer);
      setActiveTab("main");
      setSaved(false);
      setView("form");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load quotation");
    } finally {
      setLoading(false);
    }
  };

  // POST (new) or PUT (update) to ERPNext
  const handleSaveQuotation = async () => {
    if (!header.customerCode) { setError("Customer Code is required"); return; }
    if (savedLines.length === 0) { setError("Add at least one line item before saving"); return; }
    setLoading(true);
    setError("");
    try {
      const payload = buildPayload(header, savedLines);
      if (editingId) {
        await updateQuotation(editingId, payload);
        setSaved(true);
      } else {
        const res = await createQuotation(payload);
        const newName = res.data.data?.name || "";
        setHeader((h) => ({ ...h, quotationNo: newName }));
        setEditingId(newName);
        setSaved(true);
      }
      loadQuotations();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save quotation");
    } finally {
      setLoading(false);
    }
  };

  // DELETE from ERPNext
  const handleDelete = async (name) => {
    if (!name) return;
    setLoading(true);
    setError("");
    try {
      await deleteQuotation(name);
      if (view === "form") setView("list");
      loadQuotations();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to delete quotation");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLines    = () => setView("lines");
  const handleBackFromLines = () => setView("form");

  const handleSaveLines = (lines) => {
    setSavedLines(lines);
    const totalPrice = lines.reduce((s, l) => s + (l.totalAmount || 0), 0);
    setHeader((h) => ({ ...h, quotationPrice: totalPrice }));
  };

  const currentQuotation = { quotationNo: header.quotationNo, customerName: header.customerName, lines: savedLines };

  const statusKey = {
    Draft: "quotation.statusDraft", Open: "quotation.statusOpen", 
    Submitted: "quotation.statusSubmitted",Cancelled: "quotation.statusCancelled",  
    Approved: "quotation.statusApproved", Rejected: "quotation.statusRejected",
  };

  // ── LINES VIEW ──────────────────────────────────────────────────────────────
  if (view === "lines") {
    return (
      <QuotationLinesPage
        quotation={currentQuotation}
        onBack={handleBackFromLines}
        onSaveLines={handleSaveLines}
        t={t}
      />
    );
  }

  // Shared error/loading banner
  const StatusBanner = () => (
    <>
      {loading && <div className="lms-saved-badge" style={{ display: "inline-block", marginBottom: 10, background: "#8BA3CB" }}>&#8987; Loading…</div>}
      {error   && <div className="login-error-banner" style={{ marginBottom: 10 }}><span className="error-icon">&#9888;</span>{error}</div>}
    </>
  );

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="lms-page">
        <div className="lms-toolbar">
          <button className="lms-icon-btn btn-primary" data-label={t("common.add")} onClick={openNew}>
            <span className="lms-ibtn-icon">&#43;</span>
          </button>
          <div className="lms-toolbar-sep" />
          <button className="lms-icon-btn" data-label={t("common.filter")}>
            <span className="lms-ibtn-icon">&#9783;</span>
          </button>
          <button className="lms-icon-btn" data-label={t("common.export")}>
            <span className="lms-ibtn-icon">&#128229;</span>
          </button>
          <button className="lms-icon-btn" data-label={t("common.import")}>
            <span className="lms-ibtn-icon">&#128228;</span>
          </button>
        </div>

        <StatusBanner />

        <div className="card">
          <h3 className="lms-section-title">{t("quotation.listTitle")}</h3>
          {quotations.length === 0 && !loading ? (
            <div className="lms-empty-state">
              <span>&#128196;</span>
              <p>{t("quotation.noQuotations")}</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>{t("quotation.colQuotationNo")}</th>
                    <th>{t("quotation.customerCode")}</th>
                    <th>{t("quotation.customerName")}</th>
                    <th>{t("quotation.date")}</th>
                    <th>{t("quotation.expirationDate")}</th>
                    <th>{t("quotation.quotationPrice")}</th>
                    <th>{t("common.status")}</th>
                    <th>{t("common.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q.name}>
                      <td><strong>{q.name}</strong></td>
                      <td>{q.customer_code}</td>
                      <td>{q.customer_name}</td>
                      <td>{q.transaction_date}</td>
                      <td>{q.valid_till || "—"}</td>
                      <td style={{ textAlign: "right" }}>{q.currency} {fmt(q.grand_total)}</td>
                      <td>
                        <span className="lms-status-badge" style={{ background: STATUS_COLORS[q.status] || "#888" }}>
                          {t(statusKey[q.status]) || q.status}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button className="lms-btn lms-btn-primary lms-btn-sm" onClick={() => openEdit(q)}>{t("common.edit")}</button>
                        <button className="lms-btn lms-btn-danger lms-btn-sm" onClick={() => handleDelete(q.name)}>{t("common.delete")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── FORM VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className="lms-page">
      {/* Toolbar */}
      <div className="lms-toolbar">
        <button className="lms-icon-btn btn-primary" data-label={t("common.add")} onClick={openNew}>
          <span className="lms-ibtn-icon">&#43;</span>
        </button>
        <button className="lms-icon-btn btn-primary" data-label={t("common.save")} onClick={handleSaveQuotation} disabled={loading}>
          <span className="lms-ibtn-icon">&#128190;</span>
        </button>
        <button className="lms-icon-btn btn-danger" data-label={t("common.delete")} onClick={() => handleDelete(editingId)}>
          <span className="lms-ibtn-icon">&#128465;</span>
        </button>
        <div className="lms-toolbar-sep" />
        <button className="lms-icon-btn" data-label={t("common.filter")}>
          <span className="lms-ibtn-icon">&#9783;</span>
        </button>
        <button className="lms-icon-btn" data-label={t("common.back")} onClick={() => setView("list")}>
          <span className="lms-ibtn-icon">&#9664;</span>
        </button>
        <button className="lms-icon-btn" data-label={t("common.next")}>
          <span className="lms-ibtn-icon">&#9654;</span>
        </button>
        <div className="lms-toolbar-sep" />
        <button className="lms-icon-btn" data-label={t("common.import")}>
          <span className="lms-ibtn-icon">&#128228;</span>
        </button>
        <button className="lms-icon-btn" data-label={t("common.export")}>
          <span className="lms-ibtn-icon">&#128229;</span>
        </button>
        {saved && <span className="lms-saved-badge" style={{ margin: "auto 8px" }}>&#10003; {t("common.saved")}</span>}
      </div>

      <StatusBanner />

      {/* ── Header Card ─────────────────────────────────────────────────── */}
      <div className="card quot-header-card">
        <div className="quot-header-top-row">
          <div className="quot-header-fields">
            {/* Row 1: Quotation No */}
            <div className="quot-header-row">
              <Field label={t("quotation.quotationNo")} readOnly style={{ flex: "0 1 200px", minWidth: 120 }}>
                <input className="lms-input lms-input-readonly" readOnly value={header.quotationNo || "(Auto)"} />
              </Field>
            </div>

            {/* Row 2: Customer Code + Customer Name */}
            <div className="quot-header-row">
              <Field label={t("quotation.customerCode")} required style={{ flex: "0 1 160px", minWidth: 110 }}>
                <select name="customerCode" className="lms-input" value={header.customerCode} onChange={handleHeaderChange}>
                  <option value="">--</option>
                  {customers.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field label={t("quotation.customerName")} readOnly style={{ flex: 1, minWidth: 100 }}>
                <input className="lms-input lms-input-readonly" readOnly value={header.customerName} />
              </Field>
            </div>

            {/* Row 3: Ship to Code + Ship to Name */}
            <div className="quot-header-row">
              <Field label={t("quotation.shipToCode")} required style={{ flex: "0 1 160px", minWidth: 110 }}>
                <select name="shipToCode" className="lms-input" value={header.shipToCode} onChange={handleHeaderChange}>
                  <option value="">--</option>
                  {addresses.map((a) => <option key={a.name} value={a.name}>{a.address_title || a.name}</option>)}
                </select>
              </Field>
              <Field label={t("quotation.shipToName")} readOnly style={{ flex: 1, minWidth: 100 }}>
                <input className="lms-input lms-input-readonly" readOnly value={header.shipToName} />
              </Field>
            </div>
          </div>

          {/* Right: Quotation Lines button */}
          <div className="quot-header-lines-btn-wrap">
            <button className="quot-lines-btn" onClick={handleOpenLines}>
              &#128203; {t("quotation.linesBtn")}
              {savedLines.length > 0 && (
                <span className="quot-lines-badge">{savedLines.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="lm-tabs">
        {FORM_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`lm-tab ${activeTab === tab.key ? "lm-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="lm-tab-label">{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="lm-tab-content">

        {/* ── MAIN TAB ──────────────────────────────────────────────────── */}
        {activeTab === "main" && (
          <div className="card">
            <div className="lms-grid-2">
              {/* Left */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Field label={t("quotation.termsCode")}>
                  <select name="termsCode" className="lms-input" value={header.termsCode} onChange={handleHeaderChange}>
                    <option value="">--</option>
                    {TERMS_CODES.map((tc) => <option key={tc}>{tc}</option>)}
                  </select>
                </Field>
                <Field label={t("quotation.contact")}>
                  <input name="contact" className="lms-input" value={header.contact} onChange={handleHeaderChange} placeholder={t("quotation.contactPersonPlaceholder")} />
                </Field>
                <Field label={t("quotation.quotationPrice")} readOnly>
                  <input className="lms-input lms-input-readonly" readOnly value={fmt(header.quotationPrice)} style={{ color: "#1814F3", fontWeight: 700 }} />
                </Field>
                <Field label={t("quotation.quotationCost")} readOnly>
                  <input className="lms-input lms-input-readonly" readOnly value={fmt(header.quotationCost)} />
                </Field>
              </div>

              {/* Right */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Field label={t("common.status")} required>
                  <select name="status" className="lms-input" value={header.status} onChange={handleHeaderChange}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label={t("quotation.date")} required>
                  <input type="date" name="quotationDate" className="lms-input" value={header.quotationDate} onChange={handleHeaderChange} />
                </Field>
                <Field label={t("quotation.expirationDate")} required>
                  <input type="date" name="expirationDate" className="lms-input" value={header.expirationDate} onChange={handleHeaderChange} />
                </Field>
                <Field label={t("quotation.reasonWon")}>
                  <select name="reasonWon" className="lms-input" value={header.reasonWon} onChange={handleHeaderChange}>
                    <option value="">--</option>
                    {REASONS_WON.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label={t("quotation.reasonLoss")}>
                  <select name="reasonLoss" className="lms-input" value={header.reasonLoss} onChange={handleHeaderChange}>
                    <option value="">--</option>
                    {REASONS_LOSS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ── ADDRESS TAB ───────────────────────────────────────────────── */}
        {activeTab === "address" && (
          <div className="card">
            <div className="lms-grid-2">
              <Field label={t("quotation.customer")}>
                <textarea
                  name="customerAddress"
                  className="lms-input lms-textarea"
                  rows={5}
                  value={header.customerAddress}
                  onChange={handleHeaderChange}
                  placeholder={t("quotation.customerAddressPlaceholder")}
                />
              </Field>
              <Field label={t("quotation.shipToAddress")}>
                <textarea
                  name="shipToAddress"
                  className="lms-input lms-textarea"
                  rows={5}
                  value={header.shipToAddress}
                  onChange={handleHeaderChange}
                  placeholder={t("quotation.customerAddressPlaceholder")}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── AMOUNTS TAB ───────────────────────────────────────────────── */}
        {activeTab === "amounts" && (
          <div className="card">
            <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label={t("quotation.currencyCode")} required>
                <div style={{ display: "flex", gap: 8 }}>
                  <select name="currencyCode" className="lms-input" style={{ flex: "0 1 90px", minWidth: 70 }} value={header.currencyCode} onChange={handleHeaderChange}>
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                  <input className="lms-input lms-input-readonly" readOnly value={header.currencyDesc} style={{ flex: 1 }} />
                </div>
              </Field>
              <Field label={t("quotation.exchangeRate")}>
                <input type="number" name="exchangeRate" className="lms-input" value={header.exchangeRate} onChange={handleHeaderChange} style={{ maxWidth: 200 }} />
              </Field>
              <Field label={t("quotation.taxCode")}>
                <select name="taxCode" className="lms-input" style={{ maxWidth: 200 }} value={header.taxCode} onChange={handleHeaderChange}>
                  {TAX_CODES.map((tc) => <option key={tc.code} value={tc.code}>{tc.code}</option>)}
                </select>
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quotation;
