import axios from "axios";

// Use Frappe session-based auth — no hardcoded API keys needed.
// CSRF token is injected by the server into window.csrf_token.
const api = axios.create({
  baseURL: "",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach CSRF token to every mutating request
api.interceptors.request.use((config) => {
  const csrfToken = window.csrf_token;
  if (csrfToken) {
    config.headers["X-Frappe-CSRF-Token"] = csrfToken;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginUser = (usr, pwd) => {
  return api.post("/api/method/login", { usr, pwd });
};

export const getLoggedUser = () => {
  return api.get("/api/method/frappe.auth.get_logged_user");
};

// ── Training Program ──────────────────────────────────────────────────────────
export const getTrainings = (search = "", limit = 5, start = 0) => {
  return api.get(
    `/api/resource/Training Program?fields=["name","training_name","description","duration","mandatory","passing_score","validity"]&limit_page_length=${limit}&limit_start=${start}&filters=[["training_name","like","%${search}%"]]`
  );
};

export const createTraining = (data) => {
  return api.post("/api/resource/Training Program", data);
};

export const updateTraining = (name, data) => {
  return api.put(`/api/resource/Training Program/${name}`, data);
};

export const deleteTraining = (name) => {
  return api.delete(`/api/resource/Training Program/${name}`);
};

// ── Quotation ──────────────────────────────────────────────────────────────────
const QUOT_URL = "/api/resource/Quotation";

export const getQuotations = (limit = 50, start = 0) => {
  const fields = encodeURIComponent(
    '["name","customer_name","transaction_date","valid_till","currency","grand_total","status"]'
  );
  return api.get(
    `${QUOT_URL}?fields=${fields}&limit_page_length=${limit}&limit_start=${start}&order_by=creation%20desc`
  );
};

export const getQuotation = (name) => {
  return api.get(`${QUOT_URL}/${encodeURIComponent(name)}`);
};

export const createQuotation = (data) => {
  return api.post(QUOT_URL, data);
};

export const updateQuotation = (name, data) => {
  return api.put(`${QUOT_URL}/${encodeURIComponent(name)}`, data);
};

export const deleteQuotation = (name) => {
  return api.delete(`${QUOT_URL}/${encodeURIComponent(name)}`);
};

export const getQuotationStats = () => {
  const fields = encodeURIComponent('["name","status"]');
  return api.get(
    `${QUOT_URL}?fields=${fields}&limit_page_length=500`
  );
};

// ── License Management ────────────────────────────────────────────────────────
const LM_API = "/api/method/license_management.api";

export const getLicenseList = (search = "", limit = 50, start = 0) => {
  return api.get(`${LM_API}.get_license_list`, { params: { search, limit, start } });
};

export const getLicense = (name) => {
  return api.get(`${LM_API}.get_license`, { params: { name } });
};

export const saveLicense = (data) => {
  return api.post(`${LM_API}.save_license`, { data: JSON.stringify(data) });
};

export const deleteLicense = (name) => {
  return api.post(`${LM_API}.delete_license`, { name });
};

export const getLicenseStats = () => {
  return api.get(`${LM_API}.get_license_stats`);
};

// ── License Renewal ───────────────────────────────────────────────────────────
export const getRenewalList = (search = "", limit = 50, start = 0) => {
  return api.get(`${LM_API}.get_renewal_list`, { params: { search, limit, start } });
};

export const getRenewal = (name) => {
  return api.get(`${LM_API}.get_renewal`, { params: { name } });
};

export const saveRenewal = (data) => {
  return api.post(`${LM_API}.save_renewal`, { data: JSON.stringify(data) });
};

export const advanceRenewalWorkflow = (name, action = "advance") => {
  return api.post(`${LM_API}.advance_renewal_workflow`, { name, action });
};

// ── Employees (for personnel tab) ────────────────────────────────────────────
export const getEmployeesForLicense = () => {
  return api.get(`${LM_API}.get_employees_for_license`);
};

// ── Customer & Address ─────────────────────────────────────────────────────────
export const getCustomers = (search = "") => {
  const fields = encodeURIComponent('["name","customer_name","default_currency","tax_id"]');
  const filters = search
    ? `&filters=${encodeURIComponent(`[["customer_name","like","%${search}%"]]`)}`
    : "";
  return api.get(
    `/api/resource/Customer?fields=${fields}&limit_page_length=200${filters}`
  );
};

export const getAddresses = (customerName) => {
  const fields = encodeURIComponent('["name","address_title","address_line1","address_line2","city","state","pincode","country"]');
  const filters = encodeURIComponent(
    `[["Dynamic Link","link_doctype","=","Customer"],["Dynamic Link","link_name","=","${customerName}"]]`
  );
  return api.get(
    `/api/resource/Address?fields=${fields}&filters=${filters}&limit_page_length=50`
  );
};
