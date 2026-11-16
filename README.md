# KirayaSetu (किराया सेतु) - Comprehensive Rent & Tenancy Tracking System

A full-stack web application tailored for the Indian rental ecosystem. It bridges property owners (Landlords/Admins) and Tenants with digital rental agreements, simulated UPI rent payments, HRA receipts, damage reporting with repair invoice attachments, and government-allotted meter & utility tracking.

---

## 🌟 Key Features Built

### 1. Dual Account Personas (Admin & Individual Tenants)
- **Admin / Landlord Console (`Rajesh Sharma`)**:
  - Full visibility into residential properties (e.g., *Palm Heights Apartments*, *Shanti Niwas*), occupied/vacant units, and rental yields.
  - Oversees rent collection, payment receipts, and tenant accounts.
  - Sends rent due notifications and payment reminders.
  - Reviews damage claims and authorizes repair reimbursements.
  - Drafts and executes legal Indian rental agreements.
- **Tenant Resident Account (`Priya Verma`, `Amit Patel`)**:
  - Personalized resident dashboard showing current lease, rent due countdown, and quick pay options.
  - Digital signature capability via Aadhaar e-Sign OTP simulation.
  - Access to downloadable Section 10(13A) compliant HRA rent receipts with Landlord PAN.
  - Direct access to utility meter readings and bill payments.
- **1-Click Persona Switcher**: Seamlessly switch between Landlord and Tenant views in the navigation bar to test all perspectives.

---

### 2. Damage Reporting & Repair Invoices
- **Tenant Submission Workflow**:
  - Report damage with category (*Plumbing, Electrical, Appliances, Carpentry, Glass, Painting*).
  - Severity level (*Low, Medium, High, Emergency*) and incident date.
  - Detailed description of fault/breakage.
  - Exact **Cost of Repairing** (in ₹).
  - **Invoice & Bill Attachment**: Vendor name (e.g. *QuickFix Plumbing, Urban Company*), Invoice Number, Vendor GSTIN, Invoice Date, and file upload (PDF / scanned image).
  - Preference selector: Request Landlord Reimbursement vs Tenant-Paid vs 50-50 Split.
- **Admin Review & Settlement**:
  - Admin inspects the damage photos, description, and attached invoice.
  - Can choose:
    - **Approve for Full Reimbursement** (credits funds via UPI with transaction reference).
    - **Deduct from Security Deposit** (for tenant-inflicted damages).
    - **Reject Claim** with explanatory notes.
  - Sends real-time notification back to the tenant's account.

---

### 3. Monthly Rent Payments & In-App Notifications
- **Monthly Rent Schedule & Invoices**:
  - Clear breakdown: Base Rent + Society Maintenance + Surcharges.
  - Due date tracking with payment countdown.
- **Instant Simulated Indian Payment Gateways**:
  - **UPI Gateway**: Dynamic QR code with copyable Landlord VPA (`rajesh.landlord@okhdfcbank`), quick-pay triggers for Google Pay, PhonePe, Paytm, and BHIM UPI.
  - **Net Banking**: HDFC, SBI, ICICI, Axis, Kotak Mahindra Bank.
  - **Debit / Credit Cards**: RuPay, Visa, Mastercard.
  - Instant payment confirmation with celebratory confetti animation.
- **Automatic & Manual Notifications**:
  - Unpaid rent triggers automatic notifications to the tenant's account.
  - Admin has a **"Send Rent Reminders"** button that broadcasts notifications to all active tenants with pending balances.
  - Notification center with unread badges, timestamps, and direct action buttons (*"Pay Rent"*, *"Review Claim"*, *"Sign Agreement"*).
- **HRA Rent Receipts (Section 10(13A))**:
  - Compliant with Indian Income Tax Act 1961 for corporate HRA claims.
  - Contains Landlord PAN, Landlord Signature across a ₹1 Indian Revenue Stamp, Property Address, Tenant Name, and Period.
  - One-click print/export to PDF.

---

### 4. Official Indian Government Rental Agreement Maker
- **Compliant with Indian Model Tenancy Act & Stamp Duty Regulations**:
  - **e-Stamp Certificate Header**: State of Karnataka / Government of India e-Stamp header with Certificate Number, Stamp Duty Amount (₹500), First Party (Lessor) and Second Party (Lessee).
  - **Tenant Details**:
    - Full Legal Name & Father's/Husband's Name.
    - **Aadhaar Number** with live 12-digit formatting (`XXXX-XXXX-XXXX`) and verification badge.
    - PAN Card Number, Mobile, Email, and Permanent Hometown Address.
  - **Landlord Details**: Legal Name, Father's Name, Landlord PAN (mandatory), Landlord Aadhaar, and Address.
  - **Schedule of Premises**: Unit number, floor, building name, locality, pincode, inventory of fixtures.
  - **Dedicated Government Meter Numbers**: Integrated into Clause 5 (Electricity Consumer ID / RR Number and Water Meter ID).
  - **Standard Legal Clauses**:
    1. Lease Term (11 Months standard).
    2. Monthly Rent & Due Day (e.g., 5th of each calendar month).
    3. Interest-Free Refundable Security Deposit terms.
    4. Society Maintenance charges.
    5. Direct Government Meter responsibility for Electricity and Water.
    6. Permitted residential use only & strict sub-letting prohibition.
    7. Wear & Tear vs Tenant damage responsibility.
    8. 24-hour inspection notice.
    9. Lock-in Period (3 months) and Notice Period (1 month).
    10. 5% Annual escalation on mutual renewal.
    11. Jurisdiction of local Civil Courts (Bengaluru).
    12. Two Witnesses with names and residential addresses.
  - **Digital Signing**: Tenant can sign digitally using simulated **Aadhaar e-Sign OTP** authentication.
  - **Print / PDF Ready**: Styled for printing on physical stamp paper or saving clean PDF documents.

---

### 5. Government Allotted Meters & Utility Tracking
- **Register Government Meters**:
  - Meter Type: **Electricity** (BESCOM, BSES, TNEB, MSEDCL, etc.) and **Water** (BWSSB, DJB, BMC, etc.).
  - Official Consumer ID / CA Number / RR Number.
  - Meter Serial Number (from physical meter casing).
  - Sanctioned Load (e.g. 3 kW, Domestic 1/2" pipe) and Phase Type (LT-2 Domestic).
  - Initial meter reading.
  - Government sanction document reference.
- **Monthly Meter Readings & Slab Bill Generator**:
  - Record monthly meter reading.
  - Auto-computes **Units Consumed** (`Current Reading - Previous Reading`).
  - Auto-calculates bill amount based on DISCOM tariff slab rates and fixed meter charges.
- **Paid / Unpaid Tracking & History**:
  - Comprehensive historical ledger of all past bills.
  - Instant **"Pay Bill"** action using simulated **Bharat BillPay (BBPS) / UPI** with UTR transaction references.
- **Monthly Cost Consumption Trends**:
  - Interactive multi-month cost visualization comparing electricity vs water expenditures across consecutive months.

---

## 🚀 How to Run the Application

### Option 1: Full-Stack Production Server (Easiest)
Express serves both the REST API and the production React frontend on port `5000`:

```bash
# From workspace root:
npm start
```
Then open your browser at:
👉 **`http://localhost:5000`**

### Option 2: Development Mode (with Hot Reloading)
Run backend and frontend separately:

```bash
# Terminal 1: Start Express Backend (port 5000)
cd server
npm run dev

# Terminal 2: Start Vite Dev Server (port 5173)
cd client
npm run dev
```
Then open:
👉 **`http://localhost:5173`**

---

## 👥 Demo Personas to Test

| Name | Role | Unit | Aadhaar | Test Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Rajesh Sharma** | Landlord / Admin | Palm Heights | `9876-5432-1098` | Draft rental agreements, send rent reminders, review damage claims |
| **Priya Verma** | Tenant | Flat 302 | `5432-8765-9876` | Pay Nov 2026 rent (₹24,500), pay BESCOM bill (₹1,320), report damage |
| **Amit Patel** | Tenant | Flat 104 | `7654-3210-4321` | Sign pending agreement via Aadhaar e-Sign OTP, pay rent |

*(Switch between accounts at any time using the persona selector in the top-right corner of the navigation bar)*
