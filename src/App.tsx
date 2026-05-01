import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import OrderType from "./pages/OrderType";
import MenuPage from "./pages/MenuPage";
import EmployeePortal from "./pages/EmployeePortal";
import KitchenPage from "./pages/KitchenPage";
import BarPage from "./pages/BarPage";
import NotFound from "./pages/NotFound";
import HousekeeperPage from "./pages/HousekeeperPage";
import GuestPortalPage from "./pages/GuestPortal";
import ReceptionPage from "./pages/ReceptionPage";
import ExperiencesPage from "./pages/ExperiencesPage";
import StaffShell from "./pages/StaffShell";
import RequireAuth from "./components/RequireAuth";
import ServiceModePage from "./pages/ServiceModePage";
import ServiceKitchenPage from "./pages/ServiceKitchenPage";
import ServiceBarPage from "./pages/ServiceBarPage";
import ServiceReceptionPage from "./pages/ServiceReceptionPage";
import ServiceCashierPage from "./pages/ServiceCashierPage";

// Heavy pages — loaded only when first visited
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ManagerPage = lazy(() => import('./pages/ManagerPage'));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-navy-texture flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/guest-portal" element={<GuestPortalPage />} />

                  {/* Service Mode — live operational boards */}
                  <Route path="/service" element={<RequireAuth><ServiceModePage /></RequireAuth>} />
                  <Route path="/service/kitchen" element={<RequireAuth requiredPermission={['kitchen', 'orders']}><ServiceKitchenPage /></RequireAuth>} />
                  <Route path="/service/bar" element={<RequireAuth requiredPermission={['bar', 'orders']}><ServiceBarPage /></RequireAuth>} />
                  <Route path="/service/reception" element={<RequireAuth requiredPermission={['reception_display', 'reception', 'orders']}><ServiceReceptionPage /></RequireAuth>} />
                  <Route path="/service/cashier" element={<RequireAuth requiredPermission={['cashier', 'orders']}><ServiceCashierPage /></RequireAuth>} />

                  {/* Staff Shell — role-aware action console */}
                  <Route path="/staff" element={<RequireAuth><StaffShell /></RequireAuth>} />

                  {/* Admin Shell — control tower (lazy loaded) */}
                  <Route path="/admin" element={<RequireAuth adminOnly><AdminPage /></RequireAuth>} />
                  <Route path="/manager" element={<RequireAuth><ManagerPage /></RequireAuth>} />

                  {/* Shared operational routes */}
                  <Route path="/order-type" element={<RequireAuth requiredPermission="orders"><OrderType /></RequireAuth>} />
                  <Route path="/employee-portal" element={<RequireAuth><EmployeePortal /></RequireAuth>} />

                  {/* Legacy direct routes — redirect to service equivalents */}
                  <Route path="/employee" element={<Navigate to="/employee-portal" replace />} />
                  <Route path="/kitchen" element={<Navigate to="/service/kitchen" replace />} />
                  <Route path="/bar" element={<Navigate to="/service/bar" replace />} />
                  <Route path="/housekeeper" element={<RequireAuth requiredPermission="housekeeping"><HousekeeperPage /></RequireAuth>} />
                  <Route path="/reception" element={<RequireAuth requiredPermission="reception"><ReceptionPage /></RequireAuth>} />
                  <Route path="/experiences" element={<RequireAuth requiredPermission={['experiences', 'reception']}><ExperiencesPage /></RequireAuth>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
