import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { formatTime } from '@/lib/dateFormat';
import { Flame, GlassWater, Truck, CreditCard, Clock, CheckCircle2, Home, Receipt, Info, FileText, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { canEdit, canManage } from '@/lib/permissions';
import { generateInvoicePdf, buildInvoiceWhatsAppText } from '@/lib/generateInvoicePdf';
import type { ResortProfile } from '@/hooks/useResortProfile';

interface ServiceOrderDetailProps {
  order: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: string[];
  department: 'kitchen' | 'bar' | 'reception' | 'cashier';
  onAction: (orderId: string, action: string) => Promise<void>;
  resortProfile?: ResortProfile | null;
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-muted-foreground',
  preparing: 'bg-orange-400',
  ready: 'bg-emerald-400',
};

const ServiceOrderDetail = ({ order, open, onOpenChange, permissions, department, onAction, resortProfile }: ServiceOrderDetailProps) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string | null>(null);

  if (!order) return null;

  const items = (order.items as any[]) || [];
  const foodItems = items.filter((i: any) => { const d = i.department || 'kitchen'; return d === 'kitchen' || d === 'both'; });
  const barItems = items.filter((i: any) => i.department === 'bar' || i.department === 'both');

  const isRoomCharge = order.payment_type === 'Charge to Room';
  const isTab = !!order.tab_id;
  const isAutoPayable = isRoomCharge || isTab;

  const handleAction = async (action: string) => {
    if (busy) return;
    setBusy(action);
    try {
      await onAction(order.id, action);
      onOpenChange(false);
    } finally { setBusy(null); }
  };

  const isViewOnlyDepartment = department === 'cashier';
  const canServe = canEdit(permissions, 'reception') || canEdit(permissions, 'kitchen') || canEdit(permissions, 'bar');

  const actions: { label: string; action: string; icon: React.ReactNode; variant: 'default' | 'outline' }[] = [];

  if (!isViewOnlyDepartment && canEdit(permissions, 'kitchen') && foodItems.length > 0) {
    if (order.kitchen_status === 'pending') {
      actions.push({ label: t('kitchen.startPreparingKitchen'), action: 'kitchen-start', icon: <Flame className="w-5 h-5" />, variant: 'default' });
    } else if (order.kitchen_status === 'preparing') {
      actions.push({ label: t('kitchen.markKitchenReady'), action: 'kitchen-ready', icon: <CheckCircle2 className="w-5 h-5" />, variant: 'default' });
    }
  }

  if (!isViewOnlyDepartment && canEdit(permissions, 'bar') && barItems.length > 0) {
    if (order.bar_status === 'pending') {
      actions.push({ label: t('bar.startMixingBar'), action: 'bar-start', icon: <GlassWater className="w-5 h-5" />, variant: 'default' });
    } else if (order.bar_status === 'preparing') {
      actions.push({ label: t('bar.markBarReady'), action: 'bar-ready', icon: <CheckCircle2 className="w-5 h-5" />, variant: 'default' });
    }
  }

  const canMarkPaid = canEdit(permissions, 'reception') || canManage(permissions, 'orders');

  if (!isViewOnlyDepartment && canServe) {
    if (order.status === 'Ready') {
      actions.push({
        label: isAutoPayable ? t('orderActions.serveAndClose') : t('orderActions.markServed'),
        action: 'mark-served',
        icon: <Truck className="w-5 h-5" />,
        variant: 'default',
      });
    }
  }
  if (!isViewOnlyDepartment && canMarkPaid && order.status === 'Served' && !isAutoPayable) {
    actions.push({ label: t('orderActions.markPaid'), action: 'mark-paid', icon: <CreditCard className="w-5 h-5" />, variant: 'default' });
  }

  const showInvoice = !isAutoPayable && (order.status === 'Served' || order.status === 'Paid');

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="font-display tracking-wider text-foreground">
            {order.order_type === 'Room' ? `${order.location_detail}` :
             order.order_type === 'DineIn' ? `${order.location_detail}` :
             `${order.location_detail || order.order_type}`}
          </DrawerTitle>
          {order.guest_name && (
            <p className="font-body text-sm text-muted-foreground">{order.guest_name}</p>
          )}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(order.created_at)}
            </span>
            <Badge variant="outline" className="font-body text-xs">{order.status}</Badge>
            {isRoomCharge && (
              <Badge variant="outline" className="font-body text-xs gap-1 bg-[hsl(210,70%,50%,0.15)] text-[hsl(210,70%,65%)] border-[hsl(210,70%,50%,0.3)]">
                <Home className="w-3 h-3" /> {t('reception.roomCharge')}
              </Badge>
            )}
            {isTab && !isRoomCharge && (
              <Badge variant="outline" className="font-body text-xs gap-1 bg-[hsl(270,60%,55%,0.15)] text-[hsl(270,60%,70%)] border-[hsl(270,60%,55%,0.3)]">
                <Receipt className="w-3 h-3" /> {t('reception.tab')}
              </Badge>
            )}
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto space-y-4">
          {isAutoPayable && (
            <div className="flex items-start gap-2 bg-[hsl(210,70%,50%,0.1)] border border-[hsl(210,70%,50%,0.2)] rounded-lg px-3 py-2">
              <Info className="w-4 h-4 text-[hsl(210,70%,65%)] flex-shrink-0 mt-0.5" />
              <p className="font-body text-xs text-[hsl(210,70%,65%)]">
                {isRoomCharge
                  ? t('orderDetail.chargedToRoomInfo', { room: order.location_detail || t('reception.room') })
                  : t('orderDetail.onTabInfo')}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {foodItems.length > 0 && (
              <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 flex-1">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[order.kitchen_status] || 'bg-muted-foreground'}`} />
                <Flame className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-body text-sm">{t('orderDetail.kitchen')}: <span className="font-semibold capitalize">{order.kitchen_status}</span></span>
              </div>
            )}
            {barItems.length > 0 && (
              <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 flex-1">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[order.bar_status] || 'bg-muted-foreground'}`} />
                <GlassWater className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-body text-sm">{t('orderDetail.bar')}: <span className="font-semibold capitalize">{order.bar_status}</span></span>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-display text-xs tracking-wider text-muted-foreground uppercase">{t('common.items')}</h4>
            {items.map((item: any, idx: number) => {
              const dept = item.department || 'kitchen';
              return (
                <div key={idx} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    {dept === 'bar' ? <GlassWater className="w-3.5 h-3.5 text-muted-foreground" /> : <Flame className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="font-body text-sm text-foreground">{item.qty}× {item.name}</span>
                  </div>
                  <span className="font-body text-sm text-muted-foreground tabular-nums">₱{(item.price * item.qty).toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-display text-sm tracking-wider text-muted-foreground">{t('common.total').toUpperCase()}</span>
            <span className="font-display text-xl text-gold tabular-nums">₱{order.total.toLocaleString()}</span>
          </div>

          {actions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                {actions.map(a => (
                  <Button
                    key={a.action}
                    onClick={() => handleAction(a.action)}
                    disabled={busy !== null}
                    variant={a.variant}
                    size="lg"
                    className="w-full font-display tracking-wider gap-2 min-h-[52px] rounded-xl"
                  >
                    {busy === a.action ? t('common.updating') : <>{a.icon} {a.label}</>}
                  </Button>
                ))}
              </div>
            </>
          )}

          {actions.length === 0 && !showInvoice && (
            <p className="font-body text-sm text-muted-foreground text-center py-2">
              {isViewOnlyDepartment
                ? t('reception.viewOnlyCashier')
                : isAutoPayable && order.status === 'Served'
                  ? t('reception.orderAutoClosedRoom')
                  : t('common.noActionsAvailable')}
            </p>
          )}

          {showInvoice && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 font-display tracking-wider gap-2 min-h-[52px] rounded-xl"
                  onClick={() => generateInvoicePdf(order, resortProfile || null)}
                >
                  <FileText className="w-5 h-5" /> {t('common.downloadInvoice')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 font-display tracking-wider gap-2 min-h-[52px] rounded-xl"
                  onClick={() => {
                    const text = buildInvoiceWhatsAppText(order, resortProfile || null);
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  <MessageCircle className="w-5 h-5" /> {t('orderActions.whatsapp')}
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ServiceOrderDetail;
