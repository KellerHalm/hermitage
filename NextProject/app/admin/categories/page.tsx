'use client';

import { useEffect, useMemo, useState } from 'react';
import { Store } from '@/lib/store';

type FlatCategory = {
  id: string;
  name: string;
  image: string;
  slug: string;
  parentId: string | null;
  level: number;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', image: '', parentId: '' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    await Store.syncPublicData();
    setCategories(Store.getCategories());
    setProducts(Store.getProducts());
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const flattenCategories = (list: any[], level = 0): FlatCategory[] => {
    const result: FlatCategory[] = [];
    list.forEach((cat) => {
      result.push({
        id: cat.id,
        name: cat.name,
        image: cat.image || '',
        slug: cat.slug || '',
        parentId: cat.parentId || null,
        level,
      });
      if (Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
        result.push(...flattenCategories(cat.subcategories, level + 1));
      }
    });
    return result;
  };

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const filteredCategories = useMemo(() => {
    if (!search) return flatCategories;
    const q = search.toLowerCase();
    return flatCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [flatCategories, search]);

  const rootCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);

  const productsCount = products.reduce((acc: Record<string, number>, product: any) => {
    const categoryId = String(product.category);
    acc[categoryId] = (acc[categoryId] || 0) + 1;
    return acc;
  }, {});

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    const payload: { name: string; image?: string | null; parentId?: string | null } = {
      name: formData.name,
      image: formData.image || null,
      parentId: formData.parentId || null,
    };

    if (editingCategory) {
      await Store.updateCategory(editingCategory.id, payload);
    } else {
      await Store.createCategory(payload);
    }

    await loadData();
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', image: '', parentId: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    await Store.deleteCategory(id);
    await loadData();
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка категорий...</div>;
  }

  return (
    <div>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', margin: 0 }}>Категории</h1>
        <button onClick={() => { setShowModal(true); setEditingCategory(null); setFormData({ name: '', image: '', parentId: '' }); }} style={{ padding: '12px 24px', background: '#b89968', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Добавить категорию</button>
      </div>

      <input type="text" placeholder="Поиск категорий..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '24px', fontSize: '14px', boxSizing: 'border-box' }} />

      <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Название</th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Товаров</th>
              <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((category) => (
              <tr key={category.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500, paddingLeft: `${16 + category.level * 24}px` }}>
                  {category.level > 0 && <span style={{ color: '#999', marginRight: 6 }}>&#8627;</span>}
                  {category.name}
                </td>
                <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>{productsCount[category.id] || 0}</td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button onClick={() => { setEditingCategory(category); setFormData({ name: category.name, image: category.image || '', parentId: category.parentId || '' }); setShowModal(true); }} style={{ padding: '6px 12px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '8px' }}>Редактировать</button>
                  <button onClick={() => void handleDelete(category.id)} style={{ padding: '6px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', marginBottom: '24px' }}>{editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Название</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Изображение</label>
              <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="/images/p1.jpg или https://..." style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Родительская категория</label>
              <select value={formData.parentId} onChange={(e) => setFormData({ ...formData, parentId: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="">— Нет —</option>
                {rootCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => void handleSave()} style={{ flex: 1, padding: '12px', background: '#b89968', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Сохранить</button>
              <button onClick={() => { setShowModal(false); setEditingCategory(null); }} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
