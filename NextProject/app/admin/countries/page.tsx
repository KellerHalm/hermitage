'use client';

import { useEffect, useMemo, useState } from 'react';
import { Store } from '@/lib/store';

type Country = {
  id: string;
  name: string;
  image: string;
  slug: string;
};

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    await Store.syncPublicData();
    setCountries(Store.getCountries());
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries.filter((c) => c.name.toLowerCase().includes(q));
  }, [countries, search]);

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    const payload: { name: string; image?: string | null; file?: File | null } = {
      name: formData.name,
    };

    if (imageFile) {
      payload.file = imageFile;
    }

    if (editingCountry) {
      await Store.updateCountry(editingCountry.id, payload);
    } else {
      await Store.createCountry(payload);
    }

    await loadData();
    setShowModal(false);
    setEditingCountry(null);
    setFormData({ name: '' });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить страну?')) return;
    await Store.deleteCountry(id);
    await loadData();
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка стран...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', margin: 0 }}>Страны</h1>
        <button onClick={() => { setShowModal(true); setEditingCountry(null); setFormData({ name: '' }); setImageFile(null); setImagePreview(null); }} style={{ padding: '12px 24px', background: '#b89968', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Добавить страну</button>
      </div>

      <input type="text" placeholder="Поиск стран..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '24px', fontSize: '14px', boxSizing: 'border-box' }} />

      <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Название</th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Изображение</th>
              <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: '#666', textTransform: 'uppercase', whiteSpace: 'nowrap', width: '1%' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredCountries.map((country) => (
              <tr key={country.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500 }}>{country.name}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  {country.image ? (
                    <img src={country.image} alt={country.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <span style={{ color: '#999', fontSize: '12px' }}>Нет</span>
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick={() => { setEditingCountry(country); setFormData({ name: country.name }); setImageFile(null); setImagePreview(country.image || null); setShowModal(true); }} style={{ padding: '6px 12px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '8px' }}>Редактировать</button>
                  <button onClick={() => void handleDelete(country.id)} style={{ padding: '6px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', marginBottom: '24px' }}>{editingCountry ? 'Редактировать страну' : 'Добавить страну'}</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Название</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Изображение</label>
              {(imagePreview || editingCountry?.image) && (
                <div style={{ marginBottom: '8px' }}>
                  <img src={imagePreview || editingCountry?.image} alt="" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '4px' }} />
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
                if (file) {
                  setImagePreview(URL.createObjectURL(file));
                } else {
                  setImagePreview(editingCountry?.image || null);
                }
              }} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => void handleSave()} style={{ flex: 1, padding: '12px', background: '#b89968', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Сохранить</button>
              <button onClick={() => { setShowModal(false); setEditingCountry(null); setImageFile(null); setImagePreview(null); }} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
