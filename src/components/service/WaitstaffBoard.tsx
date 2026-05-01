import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getStaffSession } from '@/lib/session';
import { toast } from 'sonner';
import { UtensilsCrossed, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCurrency } from '@/contexts/CurrencyContext';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  department?: string;
  notes?: string;
}

interface WaitstaffOrder {
  id: string;
  room_name: string;
  status: string;
  kitchen_status: string | null;
  bar_status: string | null;
  items: OrderItem[];
  notes: string | null;
  created_at: string;
  payment_type: string | null;
  scheduled_for: string | null;
}

const statusColor: Record<string, string> = {
  New: 'bg-gold/20 text-gold border-gold/30',
  Preparing: 'bg-orange-500/20 text-orange-400 border-orange-400/30',
  Ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30',
  Served: 'bg-muted/40 text-muted-foreground border-border',
};

const elapsed = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const WaitstaffBoard = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { formatPrice } = useCurrency();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const session = useMemo(() => getStaffSession(), []);

  // Audio unlock
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);

  const playChime = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, now);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.5);
  }, []);

  const start = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const { data: orders = [] } = useQuery<WaitstaffOrder[]>({
    queryKey: ['waitstaff-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, room_name, status, kitchen_status, bar_status, items, notes, created_at, payment_type, scheduled_for')
        .in('status', ['New', 'Preparing', 'Ready', 'Served'])
        .gte('created_at', start)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data || []) as WaitstaffOrder[];
    },
    refetchInterval: 15000,
  });

  // Realtime subscription
  useEffect(() => {
    const prevCount = orders.filter(o => o.status !== 'Served').length;
    const channel = supabase
      .channel('waitstaff-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        qc.invalidateQueries({ queryKey: ['waitstaff-orders'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const activeOrders = useMemo(
    () => orders.filter(o => o.status !== 'Served'),
    [orders],
  );
  const servedOrders = useMemo(
    () => orders.filter(o => o.status === 'Served').slice(-20).reverse(),
    [orders],
  );

  const getReadyStatus = (o: WaitstaffOrder) => {
    const items = (o.items as OrderItem[]) || [];
    const hasFood = items.some(i => !i.department || i.department === 'kitchen' || i.department === 'both');
    const hasDrinks = items.some(i => i.department === 'bar' || i.department === 'both');
    const kitchenReady = !hasFood || o.kitchen_status === 'ready';
    const barReady = !hasDrinks || o.bar_status === 'ready';
    return { kitchenReady, barReady, allReady: kitchenReady && barReady };
  };

  const markServed = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Served', updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['waitstaff-orders'] });
      toast.success('Marked as served');
    } catch {
      toast.error('Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const orderTotal = (items: OrderItem[]) =>
    items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
      {activeOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="font-display text-lg tracking-wider text-foreground">All clear</p>
          <p className="font-body text-sm text-muted-foreground">No active orders — great job!</p>
        </div>
      )}

      {activeOrders.map(order => {
        const { kitchenReady, barReady, allReady } = getReadyStatus(order);
        const isUpdating = updatingId === order.id;

        return (
          <div
            key={order.id}
            className={`rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden transition-all ${
              allReady ? 'border-emerald-500/50 shadow-[0_0_20px_-5px_hsl(152,60%,45%,0.3)]' : 'border-border/60'
            }`}
          >
            {/* Header bar */}
            <div className={`h-1 ${allReady ? 'bg-emerald-500' : 'bg-gold'}`} />

            <div className="p-4 space-y-3">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg tracking-wider text-foreground">{order.room_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="font-body text-xs text-muted-foreground">{elapsed(order.created_at)}</span>
                    {order.scheduled_for && (
                      <Badge variant="outline" className="text-xs h-5 font-body border-gold/40 text-gold">
                        Scheduled
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {(kitchenReady) && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-400/30 text-xs h-6 font-body">
                      Kitchen ✓
                    </Badge>
                  )}
                  {(barReady) && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-400/30 text-xs h-6 font-body">
                      Bar ✓
                    </Badge>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1">
                {(order.items as OrderItem[]).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-body text-sm text-foreground">
                        {item.quantity > 1 && (
                          <span className="text-gold font-semibold mr-1">{item.quantity}×</span>
                        )}
                        {item.name}
                      </span>
                    </div>
                    <span className="font-body text-sm text-muted-foreground tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <p className="font-body text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2">
                  📝 {order.notes}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-display text-sm tracking-wider text-foreground">
                  {formatPrice(orderTotal(order.items as OrderItem[]))}
                </span>
                {allReady && (
                  <Button
                    size="sm"
                    onClick={() => markServed(order.id)}
                    disabled={isUpdating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 font-display text-xs tracking-wider gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isUpdating ? 'Updating…' : 'Mark Served'}
                  </Button>
                )}
                {!allReady && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="font-body text-xs">Preparing…</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Completed */}
      {servedOrders.length > 0 && (
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between h-9 font-body text-xs text-muted-foreground hover:text-foreground"
            >
              <span>Served today ({servedOrders.length})</span>
              {completedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-1">
            {servedOrders.map(order => (
              <div key={order.id} className="rounded-xl border border-border/40 bg-card/40 p-3 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-foreground">{order.room_name}</span>
                  <Badge className={`${statusColor.Served} text-xs h-5 font-body`}>Served</Badge>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  {(order.items as OrderItem[]).map(i => `${i.quantity}× ${i.name}`).join(', ')}
                </p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default WaitstaffBoard;
