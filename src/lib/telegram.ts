import { supabase } from '@/integrations/supabase/client';

export interface TelegramOrderPayload {
  orderId: string;
  roomName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  notes?: string;
  paymentType?: string;
  staffName?: string;
  scheduledFor?: string | null;
}

export interface TelegramMessagePayload {
  message: string;
  roomName?: string;
  guestName?: string;
  category?: string;
}

export async function notifyOrderViaTelegram(payload: TelegramOrderPayload): Promise<void> {
  try {
    const itemLines = payload.items
      .map(i => `  • ${i.quantity}× ${i.name}`)
      .join('\n');

    let text = `🍽 *New Order — ${payload.roomName}*\n`;
    if (payload.scheduledFor) {
      text += `⏰ Scheduled: ${payload.scheduledFor}\n`;
    }
    text += `\n${itemLines}\n\n`;
    text += `💶 Total: €${payload.total.toFixed(2)}`;
    if (payload.paymentType) text += `\n💳 ${payload.paymentType}`;
    if (payload.notes) text += `\n📝 ${payload.notes}`;
    if (payload.staffName) text += `\n👤 ${payload.staffName}`;

    await supabase.functions.invoke('send-telegram', {
      body: { text, parse_mode: 'Markdown' },
    });
  } catch {
    // non-blocking — Telegram is best-effort
  }
}

export async function notifyGuestRequestViaTelegram(payload: TelegramMessagePayload): Promise<void> {
  try {
    let text = `🔔 *Guest Request*`;
    if (payload.roomName) text += ` — ${payload.roomName}`;
    if (payload.guestName) text += ` (${payload.guestName})`;
    text += '\n';
    if (payload.category) text += `📂 ${payload.category}\n`;
    text += `\n${payload.message}`;

    await supabase.functions.invoke('send-telegram', {
      body: { text, parse_mode: 'Markdown' },
    });
  } catch {
    // non-blocking
  }
}

export async function notifyHousekeepingViaTelegram(roomName: string, task: string, assignedTo?: string): Promise<void> {
  try {
    let text = `🧹 *Housekeeping Task*\n🏠 ${roomName}\n📋 ${task}`;
    if (assignedTo) text += `\n👤 Assigned to: ${assignedTo}`;

    await supabase.functions.invoke('send-telegram', {
      body: { text, parse_mode: 'Markdown' },
    });
  } catch {
    // non-blocking
  }
}
