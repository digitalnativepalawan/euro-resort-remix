import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed } from 'lucide-react';

const StaffOrderHome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-sm tracking-wider text-foreground">{t('staff.orders')}</h2>
      <button
        onClick={() => navigate('/order-type?mode=staff')}
        className="w-full bg-card border border-border rounded-lg p-6 flex items-center gap-4 hover:bg-secondary transition-colors"
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <UtensilsCrossed className="w-6 h-6 text-primary" />
        </div>
        <div className="text-left">
          <p className="font-display text-base text-foreground">{t('staff.newOrder')}</p>
          <p className="font-body text-xs text-muted-foreground">{t('staff.newOrderSub')}</p>
        </div>
      </button>
    </div>
  );
};

export default StaffOrderHome;