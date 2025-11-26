# Security Testing Checklist

## 🧪 Test Suite for File Storage Security

### Test 1: Old Public Path is Blocked ❌
**Expected:** Files in old location should NOT be accessible

```bash
# Try to access old invoice directly
curl http://localhost:3000/imports/1763645025506-FACTURE-0001.pdf
# Expected: 404 Not Found
```

**Status:** ⏳ Pending - USER TEST REQUIRED

---

### Test 2: Unauthenticated Access Blocked 🔒
**Expected:** Files cannot be accessed without login

```bash
# Try to access file via secure API without auth
curl http://localhost:3000/api/files/imports/1763645025506-FACTURE-0001.pdf
# Expected: 401 Unauthorized
```

**Status:** ⏳ Pending - USER TEST REQUIRED

---

### Test 3: Authenticated Access Works ✅
**Expected:** Logged-in users CAN access files

```
1. Log in as admin
2. Navigate to page that shows invoices/documents
3. Verify files load correctly
```

**Status:** ⏳ Pending - USER TEST REQUIRED

---

### Test 4: New Uploads Use Private Storage 📁
**Expected:** New uploads go to private-storage

```
1. Log in as admin
2. Upload a test file (e.g., invoice, document)
3. Check server logs for upload path
4. Verify file is in /private-storage/imports/
5. Verify file is NOT in /public/
```

**Status:** ⏳ Pending - USER TEST REQUIRED

---

### Test 5: Logo Upload Works ✅
**Expected:** Logo uploads go to uploads-public

```
1. Log in as admin
2. Go to /roles/admin/settings
3. Upload a company logo
4. Check server logs for upload path
5. Verify file is in /public/uploads-public/
6. Verify logo shows in welcome page
7. Verify logo shows in all sidebars
```

**Status:** ⏳ Pending - USER TEST REQUIRED

---

### Test 6: Welcome Page Logo Display 🎨
**Expected:** Welcome page shows logo or placeholder

```
1. Log out (or use incognito)
2. Go to http://localhost:3000/welcome
3. With logo uploaded: Should show company logo
4. Without logo: Should show "Logo non téléchargé"
5. Old /imports/ logos: Should NOT show
```

**Status:** ⏳ Pending - USER TEST REQUIRED

---

### Test 7: Sidebar Logos (Authenticated) 🖼️
**Expected:** Sidebars show logo for logged-in users

```
1. Upload logo to /uploads-public/
2. Log in as admin → Check admin sidebar
3. Log in as employee → Check employee sidebar
4. Log in as doctor → Check doctor sidebar
```

**Status:** ⏳ Pending - USER TEST REQUIRED

---

### Test 8: Middleware Protection 🛡️
**Expected:** All APIs protected except specific public ones

```bash
# These should work WITHOUT auth:
curl http://localhost:3000/api/settings/general
curl http://localhost:3000/api/auth/session

# These should REQUIRE auth:
curl http://localhost:3000/api/upload
curl http://localhost:3000/api/files/imports/test.pdf
curl http://localhost:3000/api/patients
curl http://localhost:3000/api/sales
```

**Status:** ⏳ Pending - USER TEST REQUIRED

---

## 📊 Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Old public path blocked | ⏳ Pending | |
| 2. Unauthenticated access blocked | ⏳ Pending | |
| 3. Authenticated access works | ⏳ Pending | |
| 4. New uploads use private storage | ⏳ Pending | |
| 5. Logo upload works | ⏳ Pending | |
| 6. Welcome page logo display | ⏳ Pending | |
| 7. Sidebar logos | ⏳ Pending | |
| 8. Middleware protection | ⏳ Pending | |

---

## 🚀 How to Run Tests

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Open browser console (F12)** to see logs

3. **Run each test** following the steps above

4. **Mark each test:** ✅ Pass | ❌ Fail | ⚠️ Partial

5. **Report any failures** immediately

---

## ⚠️ What to Watch For

- 🔴 **CRITICAL:** If old `/imports/` URLs still work → FILES ARE PUBLIC!
- 🟡 **WARNING:** If logged-in users can't access files → Permission issue
- 🟢 **GOOD:** If unauthenticated users get 401 errors → Security working!

---

## 🐛 Known Issues to Fix

- [ ] File serving API needs permission checks (users should only access their own files)
- [ ] Database may have old `/imports/` paths that need migration
- [ ] Need to add audit logging for file access

---

**NEXT STEP:** Run these tests NOW and report results!
