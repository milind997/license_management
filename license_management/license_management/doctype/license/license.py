import frappe
from frappe.model.document import Document
from frappe.utils import getdate, today


class License(Document):
	def validate(self):
		self.update_license_status()

	def update_license_status(self):
		if not self.issue_date or not self.expiry_date:
			self.license_status = "Draft"
			return

		now = getdate(today())
		expiry = getdate(self.expiry_date)
		issue = getdate(self.issue_date)

		if issue > now:
			self.license_status = "Draft"
		elif expiry < now:
			self.license_status = "Expired"
		elif (expiry - now).days <= 90:
			self.license_status = "Expiring"
		else:
			self.license_status = "Active"
