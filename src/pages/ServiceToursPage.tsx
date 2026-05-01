import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, LogOut, Palmtree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import { getStaffSession, clearStaffSession } from '@/lib/session';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import ToursBoard from '@/components/service/ToursBoard';

const ServiceToursPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const staffName = useMemo(() => getStaffSession()?.name || '', []);

  return (
    <div className="h-screen flex flex-col bg-navy-texture overflow-hidden">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 flex-shrink-0">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/service')}
              className="w-9 h-9 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-[hsl(40,85%,55%)] to-[hsl(30,80%,45%)] text-white rounded-lg px-3 py-1.5">
              <Palmtree className="w-4 h-4" />
              <span className="font-display text-xs tracking-[0.15em] uppercase">Tours & Experiences</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <CurrencySwitcher />
            <ThemeToggle />
            {staffName && (
              <span className="font-body text-xs text-muted-foreground hidden sm:inline truncate max-w-[140px]">
                {staffName}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { clearStaffSession(); navigate('/'); }}
              className="gap-1.5 text-muted-foreground hover:text-foreground h-9"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-body text-xs">{t('common.exit')}</span>
            </Button>
          </div>
        </div>
        <div className="h-[2px] bg-gradient-to-r from-[hsl(40,85%,55%)] to-[hsl(30,80%,45%)] opacity-60" />
      </header>

      <ToursBoard />
    </div>
  );
};

export default ServiceToursPage;
