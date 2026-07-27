# Privacy Disclosures & Data Retention Policy

**Last Updated:** 2026-07-28  
**Platform:** Ketab-Yar (کتاب‌یار)

---

## 1. Information Collection & Usage

Ketab-Yar processes reading data locally and via secure cloud servers to provide a seamless reading environment.

- **Guest Sessions**: Anonymous visitors receive an HMAC-signed `ky_guest` cookie. This cookie enables anonymous progress tracking, vocabulary bookmarks, and collection management without requiring account registration.
- **Account Profiles**: Registered users store profile attributes (name, email, language level preferences) directly in PostgreSQL.
- **Telemetry & Error Logging**: Sentry is utilized strictly for error monitoring and performance diagnostics (Web Vitals). Personal identifiable information (emails, IP addresses) is automatically redacted prior to submission.

---

## 2. Data Retention Schedule

| Data Category | Storage Location | Retention Period | Deletion Trigger |
|---|---|---|---|
| **Reading History** | PostgreSQL / IndexedDB | 24 Months | User account deletion or manual clear |
| **Review Votes** | PostgreSQL | Duration of Review | Deleted if associated review is removed |
| **Vocabulary Cards** | PostgreSQL / IndexedDB | Indefinite | User deletion or vocabulary reset |
| **Sentry Diagnostics** | Sentry Cloud | 90 Days | Automatic TTL purge |

---

## 3. GDPR & Subject Access Requests (SAR)

Under General Data Protection Regulation (GDPR) and privacy standards, users have the right to request a complete copy of their personal data.

- **Data Export Endpoint**: `GET /api/account/export`
- **Data Deletion**: Users may delete their account and associated data directly via account settings or support tickets.
