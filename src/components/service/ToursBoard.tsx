import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Clock, Users, MapPin, CheckCircle2, Circle, ChevronDown, ChevronUp, Palmtree } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

interface TourBooking {
  id: string;
  experience_id: string;
  room_id: string | null;
  booking_date: string;
  booking_time: string | null;
  party_size: number;
  total_price: number;
  status: string;
  notes: string | null;
  created_at: string;
  guest_name?: string;
  experience?: {
    id: string;
    name: string;
    duration_minutes: number | null;
    location: string | null;
    category: string | null;
  };
  room?: {
    name: string;
  };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gold/20 text-gold border-gold/30' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
  completed: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-400/30' },
};

const formatDate = (iso: string) => {
  const d = parseISO(iso);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE d MMM');
};

const ToursBoard = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { formatPrice } = useCurrency();
  const [completedOpen, setCompletedOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }, []);

  const { data: bookings = [], isLoading } = useQuery<TourBooking[]>({
    queryKey: ['tours-board'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experience_bookings')
        .select(`
          id, experience_id, room_id, booking_date, booking_time, party_size,
          total_price, status, notes, created_at, guest_name,
          experience:experiences(id, name, duration_minutes, location, category),
          room:rooms(name)
        `)
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as TourBooking[];
    },
    refetchInterval: 30000,
  });

  const activeBookings = useMemo(
    () => bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled'),
    [bookings],
  );
  const completedBookings = useMemo(
    () => bookings.filter(b => b.status === 'completed' || b.status === 'cancelled'),
    [bookings],
  );

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('experience_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['tours-board'] });
      toast.success(`Booking marked as ${status}`);
    } catch {
      toast.error('Failed to update booking');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
      {activeBookings.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
            <Palmtree className="w-8 h-8 text-gold" />
          </div>
          <p className="font-display text-lg tracking-wider text-foreground">No upcoming tours</p>
          <p className="font-body text-sm text-muted-foreground">New bookings will appear here</p>
        </div>
      )}

      {activeBookings.map(booking => {
        const sc = statusConfig[booking.status] || statusConfig.pending;
        const isUpdating = updatingId === booking.id;
        const guestLabel = booking.guest_name || booking.room?.name || '—';

        return (
          <div
            key={booking.id}
            className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-gold to-amber-500" />

            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base tracking-wider text-foreground truncate">
                    {booking.experience?.name || 'Experience'}
                  </p>
                  <p className="font-body text-sm text-muted-foreground mt-0.5">{guestLabel}</p>
                </div>
                <Badge className={`${sc.color} text-xs h-6 font-body flex-shrink-0`}>
                  {sc.label}
                </Badge>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="font-body text-sm text-foreground">
                    {formatDate(booking.booking_date)}
                  </span>
                </div>
                {booking.booking_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-body text-sm text-foreground">
                      {booking.booking_time.slice(0, 5)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="font-body text-sm text-foreground">
                    {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
                  </span>
                </div>
                {booking.experience?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-body text-sm text-muted-foreground truncate">
                      {booking.experience.location}
                    </span>
                  </div>
                )}
              </div>

              {booking.experience?.duration_minutes && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="font-body text-xs text-muted-foreground">
                    {booking.experience.duration_minutes} min
                  </span>
                </div>
              )}

              {booking.notes && (
                <p className="font-body text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2">
                  📝 {booking.notes}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-display text-sm tracking-wider text-foreground">
                  {formatPrice(booking.total_price)}
                </span>
                <div className="flex items-center gap-2">
                  {booking.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(booking.id, 'confirmed')}
                      disabled={isUpdating}
                      className="h-8 font-body text-xs border-blue-400/40 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Circle className="w-3 h-3 mr-1" />
                      Confirm
                    </Button>
                  )}
                  {(booking.status === 'confirmed' || booking.status === 'pending') && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(booking.id, 'completed')}
                      disabled={isUpdating}
                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-body text-xs gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {isUpdating ? 'Updating…' : 'Complete'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Completed/cancelled */}
      {completedBookings.length > 0 && (
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between h-9 font-body text-xs text-muted-foreground hover:text-foreground"
            >
              <span>Past ({completedBookings.length})</span>
              {completedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-1">
            {completedBookings.map(b => {
              const sc = statusConfig[b.status] || statusConfig.completed;
              return (
                <div key={b.id} className="rounded-xl border border-border/40 bg-card/40 p-3 opacity-60">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-body text-sm text-foreground">{b.experience?.name}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        {b.guest_name || b.room?.name} · {formatDate(b.booking_date)}
                      </p>
                    </div>
                    <Badge className={`${sc.color} text-xs h-5 font-body`}>{sc.label}</Badge>
                  </div>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default ToursBoard;
