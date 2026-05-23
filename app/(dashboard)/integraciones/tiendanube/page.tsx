'use client';
export const dynamic = 'force-dynamic';
import IntegrationProductsView from '@/components/IntegrationProductsView';

export default function TiendaNubePage() {
  return (
    <IntegrationProductsView
      provider="tiendanube"
      providerName="Tienda Nube"
      accentColor="#00b1e1"
      icon="☁️"
    />
  );
}
