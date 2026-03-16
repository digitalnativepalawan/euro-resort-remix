import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResortProfile } from '@/hooks/useResortProfile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Upload, Facebook, Instagram, Globe, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ResortProfileForm = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: profile } = useResortProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    resort_name: '', tagline: '', address: '', phone: '', contact_name: '',
    contact_number: '', email: '', google_map_embed: '', google_map_url: '',
    facebook_url: '', instagram_url: '', tiktok_url: '', website_url: '',
    logo_url: '', logo_size: 128, usd_exchange_rate: '1.08',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        resort_name: profile.resort_name || '', tagline: profile.tagline || '',
        address: profile.address || '', phone: profile.phone || '',
        contact_name: profile.contact_name || '', contact_number: profile.contact_number || '',
        email: profile.email || '', google_map_embed: profile.google_map_embed || '',
        google_map_url: profile.google_map_url || '', facebook_url: profile.facebook_url || '',
        instagram_url: profile.instagram_url || '', tiktok_url: profile.tiktok_url || '',
        website_url: profile.website_url || '', logo_url: profile.logo_url || '',
        logo_size: profile.logo_size || 128,
        usd_exchange_rate: String(profile.usd_exchange_rate ?? 1.08),
      });
    }
  }, [profile]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
      setForm(f => ({ ...f, logo_url: urlData.publicUrl }));
      toast.success(t('resort.logoUploaded'));
    } catch {
      toast.error(t('resort.logoUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, usd_exchange_rate: parseFloat(form.usd_exchange_rate) || 1.08 };
      if (profile?.id) {
        const { error } = await supabase.from('resort_profile').update(payload).eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('resort_profile').insert(payload);
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ['resort-profile'] });
      toast.success(t('resort.profileSaved'));
    } catch (err: any) {
      toast.error(t('resort.profileSaveFailed', { error: err?.message || 'Unknown error' }));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "bg-secondary border-border text-foreground font-body mt-1";

  return (
    <section className="space-y-4">
      <h3 className="font-display text-sm tracking-wider text-foreground">{t('resort.resortProfile')}</h3>

      <div className="flex flex-col items-center gap-3">
        <button onClick={() => fileRef.current?.click()}
          className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gold/50 transition-colors overflow-hidden">
          {form.logo_url ? (
            <img src={form.logo_url} alt="Resort logo" className="w-full h-full object-contain p-2" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-cream-dim" />
              <span className="font-body text-xs text-cream-dim">{t('resort.uploadLogo')}</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/webp" className="hidden" onChange={handleLogoUpload} />
        <p className="font-body text-[10px] text-cream-dim">{t('resort.logoHint')}</p>
        {uploading && <p className="font-body text-xs text-cream-dim">{t('resort.uploading')}</p>}
        {form.logo_url && (
          <Button variant="destructive" size="sm" onClick={() => setForm(f => ({ ...f, logo_url: '' }))} className="font-body text-xs">
            {t('resort.deleteLogo')}
          </Button>
        )}
      </div>

      <div>
        <label className="font-body text-xs text-cream-dim">{t('resort.logoSize', { size: form.logo_size })}</label>
        <Slider value={[form.logo_size]} onValueChange={([v]) => setForm(f => ({ ...f, logo_size: v }))} min={64} max={256} step={8} className="mt-2" />
      </div>

      <div>
        <label className="font-body text-xs text-cream-dim">{t('resort.resortName')}</label>
        <Input value={form.resort_name} onChange={set('resort_name')} placeholder="e.g. Baia Palawan" className={inputClass} />
      </div>
      <div>
        <label className="font-body text-xs text-cream-dim">{t('resort.tagline')}</label>
        <Input value={form.tagline} onChange={set('tagline')} className={inputClass} />
      </div>

      <div>
        <label className="font-body text-xs text-cream-dim">{t('resort.address')}</label>
        <Textarea value={form.address} onChange={set('address')} className={`${inputClass} min-h-[60px]`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-body text-xs text-cream-dim">{t('resort.phone')}</label>
          <Input value={form.phone} onChange={set('phone')} className={inputClass} />
        </div>
        <div>
          <label className="font-body text-xs text-cream-dim">{t('resort.email')}</label>
          <Input value={form.email} onChange={set('email')} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-body text-xs text-cream-dim">{t('resort.contactPerson')}</label>
          <Input value={form.contact_name} onChange={set('contact_name')} className={inputClass} />
        </div>
        <div>
          <label className="font-body text-xs text-cream-dim">{t('resort.contactNumber')}</label>
          <Input value={form.contact_number} onChange={set('contact_number')} className={inputClass} />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-display text-xs tracking-wider text-cream-dim flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> {t('resort.googleMaps')}
        </h4>
        <div>
          <label className="font-body text-xs text-cream-dim">{t('resort.mapUrl')}</label>
          <Input value={form.google_map_url} onChange={set('google_map_url')} placeholder="https://maps.google.com/..." className={inputClass} />
        </div>
        <div>
          <label className="font-body text-xs text-cream-dim">{t('resort.embedCode')}</label>
          <Textarea value={form.google_map_embed} onChange={set('google_map_embed')} placeholder="<iframe src=..." className={`${inputClass} min-h-[60px]`} />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-display text-xs tracking-wider text-cream-dim">{t('resort.socialMedia')}</h4>
        <div className="flex items-center gap-2">
          <Facebook className="w-4 h-4 text-cream-dim shrink-0" />
          <Input value={form.facebook_url} onChange={set('facebook_url')} placeholder="Facebook URL" className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <Instagram className="w-4 h-4 text-cream-dim shrink-0" />
          <Input value={form.instagram_url} onChange={set('instagram_url')} placeholder="Instagram URL" className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-cream-dim shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.89a8.28 8.28 0 004.76 1.5V6.94a4.85 4.85 0 01-1-.25z" />
          </svg>
          <Input value={form.tiktok_url} onChange={set('tiktok_url')} placeholder="TikTok URL" className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cream-dim shrink-0" />
          <Input value={form.website_url} onChange={set('website_url')} placeholder="Website URL" className={inputClass} />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-display text-xs tracking-wider text-cream-dim flex items-center gap-1.5">
          💱 {t('resort.currency')}
        </h4>
        <div>
          <label className="font-body text-xs text-cream-dim">{t('resort.usdExchangeRate')}</label>
          <Input value={form.usd_exchange_rate} onChange={e => setForm(f => ({ ...f, usd_exchange_rate: e.target.value }))}
            type="number" step="0.01" placeholder="1.08" className={inputClass} />
          <p className="font-body text-[10px] text-cream-dim mt-1">{t('resort.exchangeRateHint')}</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="font-display tracking-wider w-full">
        {saving ? t('common.saving') : t('resort.saveResortProfile')}
      </Button>
    </section>
  );
};

export default ResortProfileForm;
