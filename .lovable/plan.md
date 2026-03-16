

# Multi-Currency Support Plan

## Overview
Add EUR/USD currency switching across the entire app. All prices currently use hardcoded `₱` (Philippine Peso). We will create a currency system that allows real-time switching between EUR (default) and USD, with an admin-configurable exchange rate.

## Scope
**39 files** currently contain `₱` symbols that need updating.

---

## Architecture

### 1. Database Migration
Add two columns to `resort_profile`:
- `base_currency TEXT DEFAULT 'EUR'`
- `usd_exchange_rate NUMERIC DEFAULT 1.08`

### 2. Currency Context (`src/contexts/CurrencyContext.tsx`)
- React context + provider wrapping `<App />`
- Reads `base_currency` and `usd_exchange_rate` from `resort_profile`
- Stores selected currency in `localStorage`
- Exposes:
  - `currency: 'EUR' | 'USD'`
  - `setCurrency(c)`
  - `formatPrice(amountInEur: number): string` — converts and formats with correct symbol (€ / $)
  - `exchangeRate: number`

### 3. CurrencySwitcher Component (`src/components/CurrencySwitcher.tsx`)
- Small dropdown (like LanguageSwitcher) showing `€ EUR` / `$ USD`
- Added to all headers: `ServiceHeader`, `StaffNavBar`, login page, `GuestPortal`, Admin header, `MenuPage`

### 4. Admin Exchange Rate Setting
- Add EUR/USD rate input field in `ResortProfileForm.tsx` under a "Currency" section
- Saves to `resort_profile.usd_exchange_rate`

### 5. Replace All ₱ Occurrences
Create a `formatPrice` helper and replace every `₱${value.toLocaleString()}` pattern with `formatPrice(value)` across all 39 files. Key files grouped:

**Guest-facing**: `GuestPortal.tsx`, `MenuPage.tsx`, `CartDrawer.tsx`
**Cashier/Service**: `CashierBoard.tsx`, `CashierReceipt.tsx`, `ServiceOrderDetail.tsx`, `ServiceOrderCard.tsx`
**Reception/Rooms**: `ReceptionPage.tsx`, `RoomBillingTab.tsx`, `PrintBill.tsx`, `CheckoutModal.tsx`, `AddPaymentModal.tsx`, `AdjustmentModal.tsx`, `GuestActivityTimeline.tsx`
**Admin**: `RoomSetup.tsx`, `ReportsDashboard.tsx`, `PayrollDashboard.tsx`, `TimesheetDashboard.tsx`, `InventoryDashboard.tsx`, `RecipeEditor.tsx`, `OrderArchive.tsx`, `ExpenseReportsModal.tsx`, `ExpenseBulkImportModal.tsx`, `AccountingExport.tsx`, `TabInvoice.tsx`
**Staff**: `StaffOrderHome.tsx`, `StaffOrdersView.tsx`, `EmployeePortal.tsx`, `ExperiencesPage.tsx`, `ManagerPage.tsx`
**PDF/Print**: `generateInvoicePdf.ts` (already has `formatCurrency` — swap to use context-aware version), `PrintBill.tsx`

### 6. `generateInvoicePdf.ts` Special Handling
This file generates PDFs outside React context. Pass `currency` and `exchangeRate` as parameters to the function, and update its internal `formatCurrency` helper.

---

## Implementation Order

1. **DB migration**: Add `usd_exchange_rate` column to `resort_profile`
2. **CurrencyContext + formatPrice hook**: Core infrastructure
3. **CurrencySwitcher component**: UI toggle
4. **Wire switcher into headers**: ServiceHeader, StaffNavBar, GuestPortal, MenuPage, Admin
5. **Admin config**: Exchange rate field in ResortProfileForm
6. **Bulk replace ₱ in all 39 files**: Use `formatPrice()` from context hook
7. **Update PDF/print utilities**: Pass currency params

---

## Technical Details

```text
CurrencyProvider (wraps App)
  ├── reads resort_profile.usd_exchange_rate
  ├── localStorage: selected currency
  └── provides: { currency, setCurrency, formatPrice, exchangeRate }

formatPrice(amountEur):
  if currency === 'USD':
    return `$${(amountEur * exchangeRate).toLocaleString(...)}`
  else:
    return `€${amountEur.toLocaleString(...)}`

CurrencySwitcher:
  DropdownMenu with EUR/USD options (like LanguageSwitcher)
```

All prices in the database remain stored in EUR. Conversion is display-only.

