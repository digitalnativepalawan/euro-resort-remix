import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useResortProfile } from '@/hooks/useResortProfile';

export interface GuestSession {
  booking_id: string;
  room_id: string;
  room_name: string;
  guest_name: string;
  check_out: string;
  expires: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

interface HermesChatWidgetProps {
  guestSession?: GuestSession | null;
}

const HermesChatWidget = ({ guestSession }: HermesChatWidgetProps) => {
  const { data: profile } = useResortProfile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (messages.length === 0) {
        const guestName = guestSession?.guest_name || 'there';
        const resortName = profile?.resort_name || 'the resort';
        setMessages([{
          role: 'assistant',
          content: `Hello ${guestName}! I'm Hermes, your AI concierge at ${resortName}. How can I assist you today?`,
          ts: Date.now(),
        }]);
      }
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('hermes-chat', {
        body: {
          message: text,
          history,
          context: guestSession
            ? {
                guest_name: guestSession.guest_name,
                room_name: guestSession.room_name,
                check_out: guestSession.check_out,
                booking_id: guestSession.booking_id,
              }
            : null,
        },
      });

      if (error || !data?.reply) {
        throw new Error(error?.message || 'No reply');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, ts: Date.now() }]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I'm having trouble connecting right now. Please try again or contact reception for assistance.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gold shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Open Hermes chat"
      >
        <MessageSquare className="w-6 h-6 text-background" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-5rem))] flex flex-col rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gold/20 to-gold/5 border-b border-border/40 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm tracking-wider text-foreground">Hermes</p>
              <p className="font-body text-xs text-emerald-500">AI Concierge · Online</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="w-8 h-8 text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                      <AvatarFallback className="bg-gold/20 text-gold text-xs font-display">H</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 font-body text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gold text-background rounded-tr-sm'
                        : 'bg-secondary text-foreground rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarFallback className="bg-gold/20 text-gold text-xs font-display">H</AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                    <span className="font-body text-xs text-muted-foreground">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-border/40 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(); }}
                placeholder="Ask anything…"
                className="h-10 font-body text-sm bg-secondary border-border/60 flex-1"
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-gold hover:bg-gold/90 text-background flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HermesChatWidget;
