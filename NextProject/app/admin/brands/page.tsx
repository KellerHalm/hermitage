'use client';

import { useEffect, useState } from 'react';
import { Store } from '@/lib/store';

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', country: '' });
  const [loading, setLoading] = useState(true);

  const loadBrands = async () => {
    setLoading(true);
    await Store.syncPublicData();
    setBrands(Store.getBrands());
    setCountries(Store.getCountries());
    setLoading(false);
  };

  useEffect(() => {
    void loadBrands();
  }, []);

  const filteredBrands = brands.filter((brand) => brand.name.toLowerCase().includes(search.toLowerCase()) || (brand.country || '').toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    if (editingBrand) {
      await Store.updateBrand(editingBrand.id, formData);
    } else {
      await Store.createBrand(formData);
    }

    await loadBrands();
    setShowModal(false);
    setEditingBrand(null);
    setFormData({ name: '', country: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить бренд?')) return;
    await Store.deleteBrand(id);
    await loadBrands();
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка брендов...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', margin: 0 }}>Бренды</h1>
        <button onClick={() => { setShowModal(true); setEditingBrand(null); setFormData({ name: '', country: '' }); }} style={{ padding: '12px 24px', background: '#b89968', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Добавить бренд</button>
      </div>

      <input type="text" placeholder="Поиск брендов..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '24px', fontSize: '14px', boxSizing: 'border-box' }} />

      <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Название</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Страна</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: '#666', textTransform: 'uppercase', whiteSpace: 'nowrap', width: '1%' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.map((brand) => (
                <tr key={brand.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500 }}>{brand.name}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{brand.country || '—'}</td>
                  <td style={{ padding: '16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => { setEditingBrand(brand); setFormData({ name: brand.name, country: brand.country || '' }); setShowModal(true); }} style={{ padding: '6px 12px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '8px' }}>Редактировать</button>
                    <button onClick={() => void handleDelete(String(brand.id))} style={{ padding: '6px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', marginBottom: '24px' }}>{editingBrand ? 'Редактировать бренд' : 'Добавить бренд'}</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Название</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Страна</label>
              <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="">Выберите страну</option>
                {countries.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => void handleSave()} style={{ flex: 1, padding: '12px', background: '#b89968', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Сохранить</button>
              <button onClick={() => { setShowModal(false); setEditingBrand(null); }} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

