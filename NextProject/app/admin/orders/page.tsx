'use client';
import { useEffect, useMemo, useState } from 'react';
import { Store } from '@/lib/store';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Новый',
  PROCESSING: 'В обработке',
  SHIPPED: 'В доставке',
  DELIVERED: 'Завершён',
  CANCELLED: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#1976d2',
  PROCESSING: '#f57c00',
  SHIPPED: '#00838f',
  DELIVERED: '#2e7d32',
  CANCELLED: '#c62828',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    const nextOrders = await Store.loadAdminOrders();
    setOrders(nextOrders);
    setLoading(false);
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesStatus = filterStatus === 'all' ? true : order.status === filterStatus;
    const text = search.toLowerCase();
    const matchesSearch = `${order.firstName} ${order.lastName}`.toLowerCase().includes(text) || String(order.phone || '').toLowerCase().includes(text);
    return matchesStatus && matchesSearch;
  }), [orders, filterStatus, search]);

  const updateStatus = async (id: string, status: string) => {
    const order = await Store.updateOrderStatus(id, status as any);
    setOrders((prev) => prev.map((entry) => entry.id === order.id ? order : entry));
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка заказов...</div>;
  }

  return (
    <div>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', margin: 0 }}>Заказы ({orders.length})</h1>
      </div>

      <input type="text" placeholder="Поиск по имени или телефону..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }} />

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button onClick={() => setFilterStatus('all')} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: filterStatus === 'all' ? '#111' : '#eee', color: filterStatus === 'all' ? '#fff' : '#111' }}>Все</button>
        {Object.keys(STATUS_LABELS).map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: filterStatus === status ? STATUS_COLORS[status] : '#eee', color: filterStatus === status ? '#fff' : '#111' }}>{STATUS_LABELS[status]}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredOrders.map((order) => (
          <div key={order.id} style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>Заказ №{order.id.slice(0, 8)}</h3>
                  <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#fff', background: STATUS_COLORS[order.status] }}>{STATUS_LABELS[order.status]}</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{new Date(order.date).toLocaleString('ru-RU')}</p>
              </div>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Клиент:</strong> {order.firstName} {order.lastName}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Телефон:</strong> {order.phone || '—'}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Email:</strong> {order.email || '—'}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Получение:</strong> {order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}</p>
              {order.address && <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Адрес:</strong> {order.address}</p>}
            </div>

            {order.comment && <div style={{ marginBottom: '16px', padding: '12px', background: '#fff8e1', borderRadius: '8px', border: '1px solid #ffe082' }}><strong>Комментарий клиента:</strong><div style={{ marginTop: '6px' }}>{order.comment}</div></div>}

            <div style={{ marginBottom: '16px', padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase' }}>Статус заказа</p>
              <select value={order.status} onChange={(e) => void updateStatus(order.id, e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                {Object.keys(STATUS_LABELS).map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
              </select>
            </div>

            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase' }}>Товары:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.items.map((item: any, index: number) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f9f9f9', borderRadius: '4px', fontSize: '14px' }}>
                    <span>{item.name} {item.qty > 1 ? `(?${item.qty})` : ''}</span>
                    {item.price ? <span style={{ fontWeight: 500 }}>{(item.price * item.qty).toLocaleString('ru-RU')} ?</span> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

