

# Multi-Language Support Implementation Plan

## Summary
Add full i18n (EN/DE/IT/FR) using `react-i18next` across all ~60+ files. No hardcoded strings. Language persists via localStorage. Date/time uses `Intl.DateTimeFormat` with active locale.

## Implementation Steps

### Step 1: Infrastructure
- Install `react-i18next`, `i18next`, `i18next-browser-languagedetector`
- Create `src/i18n/index.ts` — init with localStorage detector (`app_language` key), fallback `en`
- Create `src/i18n/en.json`, `de.json`, `it.json`, `fr.json`
- Import i18n in `main.tsx` before `createRoot`

### Step 2: LanguageSwitcher + Date Utility
- Create `src/components/LanguageSwitcher.tsx` — compact EN/DE/IT/FR dropdown
- Create `src/lib/dateFormat.ts` — helpers using `Intl.DateTimeFormat` with locale map from `i18n.language`

### Step 3: Add LanguageSwitcher to all headers
- `Index.tsx`, `ServiceHeader.tsx`, `StaffNavBar.tsx`, `AdminPage.tsx`, `GuestPortal.tsx`, `MenuPage.tsx`, `ServiceModePage.tsx`

### Step 4–11: Replace hardcoded strings across all screens
Work through every file listed in the prompt, replacing text with `t()` calls and building out `en.json` with namespaced keys (`common`, `kitchen`, `bar`, `cashier`, `reception`, `menu`, `guest`, `staff`, `admin`, `invoice`, etc.).

This covers:
- **Core screens**: Login, Service Mode, Kitchen/Bar boards, Cashier, Reception
- **Staff screens**: Dashboard, Clock In/Out (including toast messages), Tasks, Schedule, Timesheet, Payroll
- **Admin screens**: All Setup configs, People, Audit, Archive, Reports, Inventory, Morning Briefing, Vibe Check
- **Guest screens**: Menu (staff+guest), Guest Portal full flow, Cart
- **Modals**: All ~15+ modal components
- **Toasts/Alerts**: Every `toast()` call and AlertDialog across the app
- **Print/PDF**: `generateInvoicePdf.ts` (uses `i18n.t()` directly), `PrintBill.tsx`, `TabInvoice.tsx`, `CashierReceipt.tsx`
- **Date formatting**: Replace all `date-fns format()` and hardcoded `.toLocaleString('en-...')` with `dateFormat.ts` helpers

### Step 12: Generate DE/IT/FR translations
- Populate `de.json`, `it.json`, `fr.json` with all ~600+ keys translated

### Step 13: Admin default language
- Add `default_language` column to `resort_profile` table (migration)
- Add language selector in Resort Profile setup form
- Use as fallback when no localStorage preference exists

## Key Technical Notes
- Menu item names/descriptions remain user-entered (not translated)
- Toast: `toast({ title: t('common.saved') })`
- PDF: `import i18n from '@/i18n'; i18n.t('invoice.thankYou')`
- Currency formatting stays as-is (PHP); only date/time formatting changes locale
- ~600+ translation keys, ~60+ files modified, 6 new files created

## Due to the scale, implementation will proceed in batches:
1. **Batch 1**: Infrastructure + LanguageSwitcher + Login + Service Mode + Kitchen/Bar + Cashier
2. **Batch 2**: Reception + Menu + Guest Portal + Staff Dashboard + Clock/Tasks/Schedule
3. **Batch 3**: Admin screens (Setup, People, Audit, Archive, Reports, Inventory)
4. **Batch 4**: All modals + toasts/alerts + print/PDF + date formatting
5. **Batch 5**: DE/IT/FR translation files + admin default language setting

