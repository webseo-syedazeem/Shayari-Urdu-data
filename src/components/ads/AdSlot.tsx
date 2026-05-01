import { useEffect, useState } from 'react';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

interface AdSlotProps {
  placement: string;
  pageScope: string;
  index?: number;
}

interface AdSlotData {
  id: string;
  key: string;
  title: string;
  placement: string;
  page_scope: string;
  priority: number;
  frequency: number;
  html_snippet: string | null;
  is_active: boolean;
}

const adSlotCache = new Map<string, { data: AdSlotData | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchAdSlot(placement: string, pageScope: string): Promise<AdSlotData | null> {
  const cacheKey = `${placement}:${pageScope}`;
  const cached = adSlotCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;

  try {
    const qs = new URLSearchParams({ activeOnly: 'true', placement, pageScope }).toString();
    const res = await fetch(`${BASE_URL}/api/ad-slots?${qs}`);
    if (!res.ok) return null;
    const data = await res.json();
    adSlotCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('Error fetching ad slot:', error);
    return null;
  }
}

export function AdSlot({ placement, pageScope, index }: AdSlotProps) {
  const [adSlot, setAdSlot] = useState<AdSlotData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdSlot() {
      setLoading(true);
      const slot = await fetchAdSlot(placement, pageScope);
      setAdSlot(slot);
      setLoading(false);
    }
    loadAdSlot();
  }, [placement, pageScope]);

  useEffect(() => {
    if (adSlot?.html_snippet && typeof window !== 'undefined') {
      try {
        if ((window as any).adsbygoogle && Array.isArray((window as any).adsbygoogle)) {
          (window as any).adsbygoogle.push({});
        }
      } catch (error) {
        console.error('Error initializing AdSense:', error);
      }
    }
  }, [adSlot]);

  if (loading) return null;
  if (!adSlot || !adSlot.html_snippet || adSlot.html_snippet.trim() === '') return null;

  if (placement === 'between_shayari_cards' && typeof index === 'number') {
    const frequency = adSlot.frequency || 6;
    if ((index + 1) % frequency !== 0) return null;
  }

  return (
    <div className="ad-slot-container my-4" data-ad-key={adSlot.key} data-ad-placement={placement}>
      <div className="ad-slot-content" dangerouslySetInnerHTML={{ __html: adSlot.html_snippet }} />
    </div>
  );
}

export function clearAdSlotCache() {
  adSlotCache.clear();
}
