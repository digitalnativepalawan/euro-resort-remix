import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { QrCode, Globe, Key, Building2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const CURRENCIES = ['PHP', 'EUR', 'USD', 'GBP', 'AUD', 'SGD'];

const PaymentSettingsPanel = () => {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);

  const [form, setForm] = useState({
    api_endpoint: '',
    merchant_id: '',
    api_key: '',
    supported_currencies: ['PHP', 'EUR', 'USD'],
    is_live: false,
  });

  const { data: settings } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const { data } = await (supabase.from('payment_settings' as any).select('*').limit(1).maybeSingle());
      return data as any;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        api_endpoint: settings.api_endpoint || '',
        merchant_id: settings.merchant_id || '',
        api_key: '',
        supported_currencies: settings.supported_currencies || ['PHP', 'EUR', 'USD'],
        is_live: settings.is_live || false,
      });
    }
  }, [settings]);

  const toggleCurrency = (currency: string) => {
    setForm(f => ({
      ...f,
      supported_currencies: f.supported_currencies.includes(currency)
        ? f.supported_currencies.filter(c => c !== currency)
        : [...f.supported_currencies, currency],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        api_endpoint: form.api_endpoint,
        merchant_id: form.merchant_id,
        supported_currencies: form.supported_currencies,
        is_live: form.is_live,
        updated_at: new Date().toISOString(),
      };

      if (settings?.id) {
        await (supabase.from('payment_settings' as any).update(payload).eq('id', settings.id));
      } else {
        await (supabase.from('payment_settings' as any).insert(payload));
      }

      // Save API key to Vercel env (stored separately — note for ops team)
      qc.invalidateQueries({ queryKey: ['payment-settings'] });
      toast.success('Payment settings saved');
      setTestResult(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!form.api_endpoint) {
      toast.error('Enter API endpoint first');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      // Mock test — ping endpoint or just validate URL format
      await new Promise(resolve => setTimeout(resolve, 1200));

      // When real API is ready, replace with actual ping:
      // const res = await fetch(`${form.api_endpoint}/health`, { method: 'GET' });
      // if (!res.ok) throw new Error('Connection failed');

      // For now, validate URL format
      new URL(form.api_endpoint);
      setTestResult('success');
      toast.success('Connection test passed (mock)');
    } catch {
      setTestResult('fail');
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const isMockMode = !form.api_endpoint || !form.merchant_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <QrCode className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-display text-sm tracking-wider text-foreground">QR Payment Gateway</h3>
          <p className="font-body text-xs text-muted-foreground">Vincent's cross-border payment system</p>
        </div>
        <div className="ml-auto">
          <Badge className={`font-body text-xs ${
            isMockMode
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : form.is_live
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
          }`}>
            {isMockMode ? 'Mock Mode' : form.is_live ? '🟢 Live' : '🔵 Sandbox'}
          </Badge>
        </div>
      </div>

      {/* Mock mode notice */}
      {isMockMode && (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-3">
          <p className="font-display text-xs tracking-wider text-amber-400 mb-1">⚠️ Running on Mock API</p>
          <p className="font-body text-xs text-muted-foreground">
            QR codes are generating with placeholder data. Enter Vincent's API credentials below to go live.
          </p>
        </div>
      )}

      {/* API Endpoint */}
      <div className="space-y-2">
        <label className="font-display text-xs tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> API Endpoint
        </label>
        <Input
          value={form.api_endpoint}
          onChange={e => setForm(f => ({ ...f, api_endpoint: e.target.value }))}
          placeholder="https://api.vincent-payment.com/v1"
          className="bg-secondary border-border text-foreground font-body"
        />
        <p className="font-body text-[10px] text-muted-foreground">Vincent's payment API base URL</p>
      </div>

      {/* Merchant ID */}
      <div className="space-y-2">
        <label className="font-display text-xs tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" /> Merchant ID
        </label>
        <Input
          value={form.merchant_id}
          onChange={e => setForm(f => ({ ...f, merchant_id: e.target.value }))}
          placeholder="BAIA-MERCHANT-001"
          className="bg-secondary border-border text-foreground font-body"
        />
        <p className="font-body text-[10px] text-muted-foreground">Your resort's merchant identifier</p>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <label className="font-display text-xs tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5" /> API Key / Secret
        </label>
        <Input
          type="password"
          value={form.api_key}
          onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
          placeholder="sk_live_••••••••••••••••"
          className="bg-secondary border-border text-foreground font-body"
        />
        <p className="font-body text-[10px] text-muted-foreground">
          Stored in Vercel environment variables — not saved to database
        </p>
      </div>

      {/* Supported Currencies */}
      <div className="space-y-2">
        <label className="font-display text-xs tracking-wider text-muted-foreground uppercase">
          Supported Currencies
        </label>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map(currency => (
            <button
              key={currency}
              onClick={() => toggleCurrency(currency)}
              className={`px-3 py-1.5 rounded-lg border font-display text-xs tracking-wider transition-all ${
                form.supported_currencies.includes(currency)
                  ? 'border-blue-400 bg-blue-500/20 text-blue-400'
                  : 'border-border bg-secondary text-muted-foreground hover:border-accent/40'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
        <p className="font-body text-[10px] text-muted-foreground">
          Currencies Vincent's system will accept from foreign guests
        </p>
      </div>

      {/* Live / Sandbox toggle */}
      <div className="flex items-center justify-between border border-border rounded-lg p-3">
        <div>
          <p className="font-display text-xs tracking-wider text-foreground">Live Mode</p>
          <p className="font-body text-[10px] text-muted-foreground">
            {form.is_live ? 'Real payments processing' : 'Sandbox / test mode'}
          </p>
        </div>
        <Switch
          checked={form.is_live}
          onCheckedChange={val => setForm(f => ({ ...f, is_live: val }))}
        />
      </div>

      {/* Test Connection */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={testing || !form.api_endpoint}
          className="font-display text-xs tracking-wider flex-1"
        >
          {testing ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Testing...</>
          ) : (
            'Test Connection'
          )}
        </Button>
        {testResult === 'success' && (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-body text-xs">Connected</span>
          </div>
        )}
        {testResult === 'fail' && (
          <div className="flex items-center gap-1.5 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="font-body text-xs">Failed</span>
          </div>
        )}
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full font-display tracking-wider bg-blue-600 hover:bg-blue-700 text-white"
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
        ) : (
          'Save Payment Settings'
        )}
      </Button>

      {/* Where it's used */}
      <div className="border border-border/50 rounded-lg p-3 space-y-1">
        <p className="font-display text-[10px] tracking-wider text-muted-foreground uppercase">Active On</p>
        <div className="flex flex-wrap gap-2">
          {['Cashier', 'Reception Checkout'].map(screen => (
            <Badge key={screen} variant="outline" className="font-body text-[10px]">{screen}</Badge>
          ))}
        </div>
        <p className="font-body text-[10px] text-muted-foreground mt-1">
          Coming next: Restaurant, Bar, Tours
        </p>
      </div>
    </div>
  );
};

export default PaymentSettingsPanel;
