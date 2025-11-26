# CRITICAL SECURITY MIGRATION - File Storage

## 🚨 What Changed

**Date:** November 24, 2024

### The Problem
Previously, ALL uploaded files (patient documents, invoices, diagnostic reports) were stored in `public/imports/`, making them **publicly accessible** to anyone on the internet without authentication.

This was a **CRITICAL SECURITY VULNERABILITY** - anyone could access sensitive patient data by guessing or discovering file URLs.

### The Solution

#### 1. **Secure Private Storage**
- Created `/private-storage/imports/` directory (NOT web-accessible)
- Moved all sensitive files from `public/imports/` to `private-storage/imports/`
- Old directory renamed to `public/imports.OLD-INSECURE-DO-NOT-USE` (delete after confirming migration)

#### 2. **Secure File Serving API**
- Created `/api/files/[...path]` endpoint
- **Requires authentication** to access any file
- TODO: Add permission checks (users can only access their own files)
- Serves files from private storage with appropriate headers

#### 3. **Separate Public Storage**
- Created `/public/uploads-public/` for **logos only**
- Separate upload API `/api/upload-public` (admin only, images only, 5MB limit)
- Welcome page ONLY uses logos from `/uploads-public/` (never requires auth)

## 📁 New Folder Structure

```
project/
├── public/
│   ├── uploads-public/          ← Public logos (web-accessible)
│   └── imports.OLD-INSECURE-DO-NOT-USE/  ← DELETE AFTER MIGRATION
│
└── private-storage/
    └── imports/                  ← Sensitive files (NOT web-accessible)
        ├── patient-reports/
        ├── invoices/
        └── diagnostic-results/
```

## 🔒 API Security Model

| Endpoint | Access | Purpose | Storage |
|----------|--------|---------|---------|
| `/api/upload` | 🔐 Authenticated | Patient docs, invoices | `/private-storage/imports/` |
| `/api/upload-public` | 🔐 Admin only | Company logos | `/public/uploads-public/` |
| `/api/files/[...path]` | 🔐 Authenticated | Serve private files | `/private-storage/imports/` |
| `/api/settings/general` GET | 🌍 Public | View company info | Database |
| `/api/settings/general` PUT | 🔐 Admin only | Update settings | Database |

## ✅ What's Protected Now

- ✅ Patient diagnostic reports
- ✅ Invoice PDFs
- ✅ Prescription documents
- ✅ Medical records
- ✅ Any uploaded sensitive data

## 🌍 What's Public

- ✅ Company logo (from `/uploads-public/` only)
- ✅ Company name, address, phone (from database)
- ✅ Static assets (CSS, JS, images in `/public/`)

## 🔧 Migration Checklist

- [x] Create `/private-storage/imports/` directory
- [x] Copy all files from `public/imports/` to `private-storage/imports/`
- [x] Create secure file serving API `/api/files/[...path]`
- [x] Update upload API to use private storage
- [x] Create separate `/api/upload-public` for logos
- [x] Update welcome page to only use `/uploads-public/` logos
- [x] Update middleware to protect APIs (except specific public ones)
- [ ] **TODO: Test file access with different user roles**
- [ ] **TODO: Add permission checks (users can only access relevant files)**
- [ ] **TODO: Update database if any old `/imports/` paths exist**
- [ ] **TODO: Delete `public/imports.OLD-INSECURE-DO-NOT-USE/` after confirming migration**

## 🎯 Next Steps

1. **Test immediately:**
   - Try accessing `http://localhost:3000/imports/invoice.pdf` → Should return 404
   - Try accessing `/api/files/imports/invoice.pdf` without login → Should return 401
   - Try accessing `/api/files/imports/invoice.pdf` with login → Should return file
   - Upload new file → Should save to `/private-storage/imports/`
   - Upload new logo → Should save to `/public/uploads-public/`

2. **Add permission checks:**
   - Patients can only access their own files
   - Doctors can only access their patients' files
   - Admins can access all files

3. **Database migration:**
   - Check for any records with `/imports/` paths
   - Update to use `/api/files/imports/` paths

4. **Clean up:**
   - After confirming everything works, delete `public/imports.OLD-INSECURE-DO-NOT-USE/`

## ⚠️ IMPORTANT

**DO NOT** put the `imports.OLD-INSECURE-DO-NOT-USE` folder back into `public/`!

If you need to restore files, they are now in `/private-storage/imports/` and are properly secured.
