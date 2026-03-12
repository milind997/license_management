import frappe
from frappe.model.document import Document


class LicenseRenewal(Document):
	def validate(self):
		if self.new_expiry_date and self.renewal_date:
			if self.new_expiry_date <= self.renewal_date:
				frappe.throw("New Expiry Date must be after Renewal Date")

	def on_update(self):
		if self.approval_status == "Approved" and self.license and self.new_expiry_date:
			frappe.db.set_value("License", self.license, "expiry_date", self.new_expiry_date)
