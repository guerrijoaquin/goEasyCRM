export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatARS } from '@/lib/types';
import LineChart from '@/components/charts/LineChart';
import DonutChart from '@/components/charts/DonutChart';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.businessId) redirect('/onboarding');
  const bid = session.businessId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfWeek  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today        = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [ordersMonth, ordersToday, ordersWeek, pendingOrders, channels, lowStock] = await Promise.all([
    query(`SELECT total, created_at FROM orders WHERE business_id=$1 AND created_at>=$2`, [bid, startOfMonth]),
    query(`SELECT total FROM orders WHERE business_id=$1 AND created_at>=$2`, [bid, today]),
    query(`SELECT total, created_at FROM orders WHERE business_id=$1 AND created_at>=$2`, [bid, startOfWeek]),
    query(`SELECT o.id, o.order_number, o.status, o.courier, o.city, o.eta, c.name AS client_name
           FROM orders o LEFT JOIN clients c ON c.id=o.client_id
           WHERE o.business_id=$1 AND o.status IN ('pending','shipped')
           ORDER BY o.created_at DESC LIMIT 5`, [bid]),
    query(`SELECT * FROM sales_channels WHERE business_id=$1 AND active=true`, [bid]),
    query(`SELECT name, stock, min_stock FROM products WHERE business_id=$1 AND active=true`, [bid]),
  ]) as [any[], any[], any[], any[], any[], any[]];

  const totalMonth  = ordersMonth.reduce((s, o) => s + Number(o.total), 0);
  const totalToday  = ordersToday.reduce((s, o) => s + Number(o.total), 0);
  const totalWeek   = ordersWeek.reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = pendingOrders.filter(o => o.status === 'pending').length;
  const shippedCount = pendingOrders.filter(o => o.status === 'shipped').length;
  const alertProducts = lowStock.filter((p: any) => p.stock <= p.min_stock);

  // Gráfica semanal: ventas por día en la última semana
  const weeklyData: number[] = Array(7).fill(0);
  const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  ordersWeek.forEach((o: any) => {
    const d = new Date(o.created_at);
    const dayIdx = (d.getDay() + 6) % 7;
    weeklyData[dayIdx] += Number(o.total);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          {
            label: 'Ventas hoy',
            value: formatARS(totalToday),
            sub: 'Período actual',
            subColor: '#60a5fa',
            accent: 'blue',
            icon: '💰',
          },
          {
            label: 'Pedidos activos',
            value: pendingCount + shippedCount,
            sub: `${pendingCount} pendientes · ${shippedCount} en camino`,
            subColor: '#f59e0b',
            accent: 'amber',
            icon: '📦',
          },
          {
            label: 'Ventas del mes',
            value: formatARS(totalMonth),
            sub: new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
            subColor: '#60a5fa',
            accent: 'blue',
            icon: '📅',
          },
          {
            label: 'Ventas semana',
            value: formatARS(totalWeek),
            sub: 'Últimos 7 días',
            subColor: '#c084fc',
            accent: 'purple',
            icon: '📊',
          },
        ].map((kpi, i) => (
          <div key={i} className={`kpi-card ${kpi.accent}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ paddingLeft: 8 }}>
                <div className="metric-label" style={{ marginBottom: 10 }}>{kpi.label}</div>
                <div className="metric-value" style={{ color: '#f1f5f9' }}>{kpi.value}</div>
                <div style={{ fontSize: 12, marginTop: 6, fontWeight: 500, color: kpi.subColor }}>{kpi.sub}</div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 10, fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfica + Canales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div className="section-title" style={{ color: '#f1f5f9' }}>Ventas esta semana</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{formatARS(totalWeek)} total</div>
            </div>
          </div>
          <LineChart values={weeklyData} days={dias} color="#3b82f6" />
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div className="section-title" style={{ marginBottom: 16, color: '#f1f5f9' }}>Canales de venta</div>
          {channels.length === 0 ? (
            <div style={{ color: '#4b5563', fontSize: 13, padding: '20px 0' }}>
              No hay canales configurados.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <DonutChart segments={channels.map((c: any) => ({ value: c.sales, color: c.color }))} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {channels.map((c: any, i: number) => {
                  const pct = totalMonth > 0 ? Math.round((c.sales / totalMonth) * 100) : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block' }}></span>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{pct}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#4b5563', paddingLeft: 15 }}>
                        {formatARS(c.sales)} · {c.orders} pedidos
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alertas + Últimos pedidos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: '#f1f5f9' }}>⚠️ Alertas activas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertProducts.length === 0 && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#14532d55', border: '1px solid #22c55e33', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></span>
                <span style={{ fontSize: 13, color: '#22c55e' }}>Todos los productos tienen stock suficiente</span>
              </div>
            )}
            {alertProducts.length > 0 && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#451a0388', border: '1px solid #f59e0b33', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
                <span style={{ fontSize: 13, color: '#f59e0b' }}>{alertProducts.length} productos con stock bajo</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#1e3a5f55', border: '1px solid #3b82f633', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}></span>
                <span style={{ fontSize: 13, color: '#3b82f6' }}>{pendingCount} pedidos pendientes de despacho</span>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>Últimos pedidos</div>
            <a href="/envios" style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, textDecoration: 'none' }}>
              Ver todos →
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(pendingOrders ?? []).length === 0 && (
              <div style={{ color: '#4b5563', fontSize: 13, padding: '12px 0' }}>No hay pedidos activos.</div>
            )}
            {pendingOrders.map((o: any, i: number) => {
              const st = o.status === 'shipped'
                ? { label: 'En camino', color: '#3b82f6', bg: '#1e3a5f' }
                : { label: 'Pendiente', color: '#f59e0b', bg: '#451a03' };
              return (
                <div key={i} className="row-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📦</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.client_name ?? 'Cliente'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{o.courier ?? '—'} · {o.city ?? '—'}</div>
                  </div>
                  <div>
                    <div className="pill" style={{ background: st.bg + '88', color: st.color, border: `1px solid ${st.color}44` }}>{st.label}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3, textAlign: 'right' }}>{o.eta ?? '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

