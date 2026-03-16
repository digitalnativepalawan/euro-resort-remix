import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Briefcase, LogOut, Menu, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { hasAccess } from '@/lib/permissions';
import { getHomeRoute } from '@/lib/getHomeRoute';
import { Badge } from '@/components/ui/badge';
import { getStaffSession, clearStaffSession } from '@/lib/session';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const DEPT_COLORS: Record<string, string> = {
  reception:    'bg-[hsl(210,70%,50%)] text-white',
  kitchen:      'bg-[hsl(25,85%,55%)] text-white',
  bar:          'bg-[hsl(270,60%,55%)] text-white',
  housekeeping: 'bg-[hsl(142,71%,45%)] text-white',
  maintenance:  'bg-[hsl(220,15%,50%)] text-white',
  experiences:  'bg-[hsl(38,60%,55%)] text-white',
  orders:       'bg-[hsl(200,60%,50%)] text-white',
};

const DEPT_LABEL_KEYS: Record<string, string> = {
  reception: 'reception.label',
  kitchen: 'kitchen.label',
  bar: 'bar.label',
  housekeeping: 'staff.housekeeping',
  maintenance: 'staff.maintenance',
  experiences: 'staff.experiences',
  orders: 'staff.orders',
};

interface StaffNavBarProps {
  activeDepartment?: string;
}

const StaffNavBar = ({ activeDepartment }: StaffNavBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const session = getStaffSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) return null;

  const perms: string[] = session.permissions || [];
  const isAdmin = perms.includes('admin');
  const displayName = session.name || t('login.staff');

  let currentDept = activeDepartment || '';
  if (!currentDept) {
    if (location.pathname === '/kitchen') currentDept = 'kitchen';
    else if (location.pathname === '/bar') currentDept = 'bar';
    else if (location.pathname === '/housekeeper') currentDept = 'housekeeping';
    else if (location.pathname === '/reception') currentDept = 'reception';
    else if (location.pathname === '/experiences') currentDept = 'experiences';
    else if (location.pathname === '/employee-portal') currentDept = '';
  }

  const deptLabelKey = DEPT_LABEL_KEYS[currentDept] || '';
  const deptLabel = deptLabelKey ? (deptLabelKey.includes('.') ? t(deptLabelKey) : deptLabelKey) : '';
  const deptColor = DEPT_COLORS[currentDept] || '';

  const handleLogout = () => {
    clearStaffSession();
    navigate('/');
  };

  const goHome = () => {
    const route = getHomeRoute(perms);
    navigate(route);
    setMenuOpen(false);
  };

  const goMyWork = () => {
    navigate('/employee-portal');
    setMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const DeptBadge = () => {
    if (!deptLabel) return null;
    return (
      <Badge className={`font-display text-[10px] tracking-widest uppercase px-2.5 py-0.5 border-0 ${deptColor}`}>
        {deptLabel}
      </Badge>
    );
  };

  const goService = () => {
    navigate('/service');
    setMenuOpen(false);
  };

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Button
        variant={isActive(getHomeRoute(perms)) ? 'default' : 'ghost'}
        size="sm"
        onClick={goHome}
        className={`font-display text-xs tracking-wider gap-1.5 ${mobile ? 'w-full justify-start' : ''}`}
      >
        <Home className="w-4 h-4" />
        {t('common.home')}
      </Button>
      <Button
        variant={isActive('/employee-portal') ? 'default' : 'ghost'}
        size="sm"
        onClick={goMyWork}
        className={`font-display text-xs tracking-wider gap-1.5 ${mobile ? 'w-full justify-start' : ''}`}
      >
        <Briefcase className="w-4 h-4" />
        {t('service.myWork')}
      </Button>
      <Button
        variant={location.pathname.startsWith('/service') ? 'default' : 'ghost'}
        size="sm"
        onClick={goService}
        className={`font-display text-xs tracking-wider gap-1.5 ${mobile ? 'w-full justify-start' : ''}`}
      >
        <Monitor className="w-4 h-4" />
        {t('service.service')}
      </Button>
    </>
  );

  return (
    <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border mb-4">
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-1">
          <NavItems />
          {deptLabel && (
            <>
              <div className="w-px h-5 bg-border mx-2" />
              <DeptBadge />
            </>
          )}
        </div>

        <div className="flex sm:hidden items-center gap-1.5">
          <Button
            variant={isActive(getHomeRoute(perms)) ? 'default' : 'ghost'}
            size="sm"
            onClick={goHome}
            className="font-display text-xs tracking-wider gap-1 px-2"
          >
            <Home className="w-4 h-4" />
          </Button>
          <DeptBadge />
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="font-body text-xs text-muted-foreground">{displayName}</span>
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="font-display text-xs tracking-wider gap-1 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('common.logout')}
          </Button>
        </div>

        <div className="flex sm:hidden items-center">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-background border-border">
              <SheetTitle className="font-display text-sm tracking-wider text-foreground mb-4">
                {displayName}
              </SheetTitle>
              {deptLabel && <div className="mb-3"><DeptBadge /></div>}
              <div className="flex flex-col gap-2">
                <NavItems mobile />
              <div className="flex items-center gap-2 py-1">
                <LanguageSwitcher />
                <ThemeToggle />
                <span className="font-body text-xs text-muted-foreground">{t('common.theme')}</span>
              </div>
              <div className="border-t border-border my-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="font-display text-xs tracking-wider gap-1.5 w-full justify-start text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default StaffNavBar;
