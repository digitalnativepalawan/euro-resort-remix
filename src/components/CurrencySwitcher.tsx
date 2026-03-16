import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Coins } from 'lucide-react';

const CURRENCIES = [
  { code: 'EUR' as const, symbol: '€', label: 'EUR' },
  { code: 'USD' as const, symbol: '$', label: 'USD' },
];

const CurrencySwitcher = () => {
  const { currency, setCurrency } = useCurrency();
  const current = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 px-2 h-8 font-body text-xs text-muted-foreground hover:text-foreground">
          <Coins className="w-3.5 h-3.5" />
          <span>{current.symbol} {current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[100px]">
        {CURRENCIES.map(c => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className={`font-body text-sm gap-2 cursor-pointer ${currency === c.code ? 'bg-accent' : ''}`}
          >
            <span>{c.symbol}</span>
            <span>{c.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySwitcher;
