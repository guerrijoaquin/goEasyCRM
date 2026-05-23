'use client';
export const dynamic = 'force-dynamic';
import IntegrationProductsView from '@/components/IntegrationProductsView';

export default function MercadoLibrePage() {
  return (
    <IntegrationProductsView
      provider="mercadolibre"
      providerName="Mercado Libre"
      accentColor="#ffe600"
      icon="🛒"
    />
  );
}
