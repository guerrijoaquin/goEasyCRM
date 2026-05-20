export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.businessId) redirect('/select-business');

  const [business, lowStockProducts] = await Promise.all([
    queryOne<{ id: string; name: string; slug: string; plan: string }>(
      `SELECT id, name, slug, plan FROM businesses WHERE id=$1`, [session.businessId],
    ),
    query<{ stock: number; min_stock: number }>(
      `SELECT stock, min_stock FROM products WHERE business_id=$1 AND active=true`, [session.businessId],
    ),
  ]);

  const alertCount = lowStockProducts.filter(p => p.stock <= p.min_stock).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0d14',
      display: 'flex',
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      color: '#e2e8f0',
    }}>
      <Sidebar business={business} stockAlerts={alertCount} userType={session.userType} />
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar businessName={business?.name} />
        <div style={{ padding: '24px 28px', flex: 1 }} className="animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}

