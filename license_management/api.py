import frappe
from frappe.utils import getdate, today


@frappe.whitelist()
def get_license_list(search="", limit=50, start=0):
	"""Get list of licenses with optional search."""
	filters = {}
	or_filters = {}

	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"store_name_jp": ["like", f"%{search}%"],
			"store_name_en": ["like", f"%{search}%"],
			"license_type": ["like", f"%{search}%"],
			"license_number": ["like", f"%{search}%"],
		}

	licenses = frappe.get_list(
		"License",
		fields=[
			"name", "store_name_jp", "store_name_en", "license_type",
			"license_status", "expiry_date", "license_number",
			"store_type", "prefecture",
		],
		filters=filters,
		or_filters=or_filters if search else None,
		limit_page_length=int(limit),
		limit_start=int(start),
		order_by="modified desc",
	)
	if search:
		total = frappe.db.sql(
			"""SELECT COUNT(*) FROM `tabLicense`
			WHERE name LIKE %(s)s OR store_name_jp LIKE %(s)s
			OR store_name_en LIKE %(s)s OR license_type LIKE %(s)s
			OR license_number LIKE %(s)s""",
			{"s": f"%{search}%"},
		)[0][0]
	else:
		total = frappe.db.count("License")
	return {"data": licenses, "total": total}


@frappe.whitelist()
def get_license(name):
	"""Get a single license with all child tables."""
	doc = frappe.get_doc("License", name)
	return doc.as_dict()


@frappe.whitelist()
def save_license(data):
	"""Create or update a license."""
	import json
	if isinstance(data, str):
		data = json.loads(data)

	if data.get("name") and frappe.db.exists("License", data["name"]):
		doc = frappe.get_doc("License", data["name"])
		doc.update(data)
		doc.save()
	else:
		data.pop("name", None)
		doc = frappe.get_doc({"doctype": "License", **data})
		doc.insert()

	return doc.as_dict()


@frappe.whitelist()
def delete_license(name):
	"""Delete a license."""
	frappe.delete_doc("License", name)
	return {"message": "ok"}


@frappe.whitelist()
def get_license_stats():
	"""Get license statistics for the dashboard."""
	now = getdate(today())

	total = frappe.db.count("License")
	active = frappe.db.count("License", {"license_status": "Active"})
	expiring = frappe.db.count("License", {"license_status": "Expiring"})
	expired = frappe.db.count("License", {"license_status": "Expired"})

	renewal_count = frappe.db.count("License Renewal", {"approval_status": ["not in", ["Approved", "Rejected"]]})

	return {
		"total": total,
		"active": active,
		"expiring": expiring,
		"expired": expired,
		"renewal_pending": renewal_count,
	}


@frappe.whitelist()
def get_renewal_list(search="", limit=50, start=0):
	"""Get list of license renewals."""
	filters = {}
	or_filters = {}

	if search:
		or_filters = {
			"name": ["like", f"%{search}%"],
			"prev_license_ref": ["like", f"%{search}%"],
			"license_store_name": ["like", f"%{search}%"],
		}

	renewals = frappe.get_list(
		"License Renewal",
		fields=[
			"name", "license", "license_store_name", "prev_license_ref",
			"renewal_date", "new_expiry_date", "inspection_required",
			"approval_status", "workflow_state",
		],
		filters=filters,
		or_filters=or_filters if search else None,
		limit_page_length=int(limit),
		limit_start=int(start),
		order_by="modified desc",
	)

	# add checklist count
	for r in renewals:
		r["checklist_count"] = frappe.db.count(
			"License Renewal Checklist",
			{"parent": r["name"], "parenttype": "License Renewal"},
		)

	if search:
		total = frappe.db.sql(
			"""SELECT COUNT(*) FROM `tabLicense Renewal`
			WHERE name LIKE %(s)s OR prev_license_ref LIKE %(s)s
			OR license_store_name LIKE %(s)s""",
			{"s": f"%{search}%"},
		)[0][0]
	else:
		total = frappe.db.count("License Renewal")
	return {"data": renewals, "total": total}


@frappe.whitelist()
def get_renewal(name):
	"""Get a single renewal with all child tables."""
	doc = frappe.get_doc("License Renewal", name)
	return doc.as_dict()


@frappe.whitelist()
def save_renewal(data):
	"""Create or update a license renewal."""
	import json
	if isinstance(data, str):
		data = json.loads(data)

	if data.get("name") and frappe.db.exists("License Renewal", data["name"]):
		doc = frappe.get_doc("License Renewal", data["name"])
		doc.update(data)
		doc.save()
	else:
		data.pop("name", None)
		doc = frappe.get_doc({"doctype": "License Renewal", **data})
		doc.insert()

	return doc.as_dict()


@frappe.whitelist()
def advance_renewal_workflow(name, action="advance"):
	"""Advance or reject the renewal workflow."""
	doc = frappe.get_doc("License Renewal", name)

	workflow_order = ["Draft", "Submitted", "Under Review", "Inspection", "Approved"]
	current_idx = workflow_order.index(doc.workflow_state) if doc.workflow_state in workflow_order else 0

	if action == "reject":
		doc.workflow_state = "Rejected"
		doc.approval_status = "Rejected"
	elif action == "advance" and current_idx < len(workflow_order) - 1:
		next_state = workflow_order[current_idx + 1]
		doc.workflow_state = next_state
		doc.approval_status = next_state

	doc.save()
	return doc.as_dict()


@frappe.whitelist()
def get_employees_for_license():
	"""Get employees list for personnel selection."""
	employees = frappe.get_list(
		"Employee",
		fields=[
			"name", "employee_name", "company_email",
			"employment_type", "date_of_joining", "relieving_date",
		],
		filters={"status": "Active"},
		limit_page_length=200,
		order_by="employee_name asc",
	)
	return employees
