'use client';
import { useEffect, useMemo, useState } from 'react';
import { Store } from '@/lib/store';
import { showToast } from '@/lib/toast';

const AVAILABILITY_OPTIONS = [
  { value: 'IN_STOCK', label: 'В наличии' },
  { value: 'ON_ORDER', label: 'Под заказ' },
  { value: 'OUT_OF_STOCK', label: 'Нет в наличии' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({
    name: '',
    price: '',
    oldPrice: '',
    category: '',
    brandId: '',
    country: '',
    stockStatus: 'IN_STOCK',
    stockQuantity: '',
    popular: false,
    isNew: false,
    isSale: false,
    description: '',
    sku: '',
    sizes: '',
    material: '',
    color: '',
    files: [] as File[],
    characteristics: [] as Array<{ name: string; value: string }>,
  });

  const loadData = async () => {
    setLoading(true);
    await Store.syncPublicData();
    setProducts(Store.getProducts());
    setCategories(Store.getCategories());
    setBrands(Store.getBrands());
    setCountries(Store.getCountries());
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || String(product.category) === String(categoryFilter);
    const matchesBrand = !brandFilter || String(product.brandId || '') === String(brandFilter);
    return matchesSearch && matchesCategory && matchesBrand;
  }), [products, search, categoryFilter, brandFilter]);

  const resetForm = () => setFormData({
    name: '',
    price: '',
    oldPrice: '',
    category: '',
    brandId: '',
    country: '',
    stockStatus: 'IN_STOCK',
    stockQuantity: '',
    popular: false,
    isNew: false,
    isSale: false,
    description: '',
    sku: '',
    sizes: '',
    material: '',
    color: '',
    files: [],
    characteristics: [],
  });

  const openCreate = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : '',
      category: product.category,
      brandId: product.brandId || '',
      country: product.country || '',
      stockStatus: product.inStock === 'preorder' ? 'ON_ORDER' : product.inStock === false ? 'OUT_OF_STOCK' : 'IN_STOCK',
      stockQuantity: product.stockQuantity ?? '',
      popular: Boolean(product.popular),
      isNew: Boolean(product.isNew),
      isSale: Boolean(product.isSale),
      description: product.description || '',
      sku: product.sku || '',
      sizes: product.sizes || '',
      material: product.material || '',
      color: product.color || '',
      files: [],
      characteristics: Array.isArray(product.characteristics) ? product.characteristics.map((c: any) => ({ name: c.name || '', value: c.value || '' })) : [],
    });
    setShowModal(true);
  };

  const handleBrandChange = (brandId: string) => {
    const selectedBrand = brands.find((brand) => String(brand.id) === String(brandId));
    setFormData({ ...formData, brandId, country: selectedBrand?.country || formData.country || '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Введите название товара', 'error');
      return;
    }
    if (!formData.category) {
      showToast('Выберите категорию', 'error');
      return;
    }
    if (!formData.brandId) {
      showToast('Выберите бренд', 'error');
      return;
    }
    if (Number(formData.price) <= 0) {
      showToast('Цена должна быть больше 0', 'error');
      return;
    }

    try {
      if (editingProduct) {
        await Store.updateProduct(String(editingProduct.id), formData);
      } else {
        await Store.createProduct(formData);
      }
      await loadData();
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Не удалось сохранить товар', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар?')) return;
    try {
      await Store.deleteProduct(id);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Не удалось удалить товар', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка товаров...</div>;
  }

  return (
    <div>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', margin: 0 }}>Товары ({filteredProducts.length})</h1>
          <p style={{ marginTop: '6px', color: '#666', fontSize: '14px' }}>Показано {filteredProducts.length} из {products.length} товаров</p>
        </div>
        <button onClick={openCreate} style={{ padding: '12px 24px', background: '#b89968', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Добавить товар</button>
      </div>

      <input type="text" placeholder="Поиск товаров..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '24px', fontSize: '14px', boxSizing: 'border-box' }} />

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', minWidth: '200px' }}>
          <option value="">Все категории</option>
          {categories.map((category) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
        </select>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', minWidth: '200px' }}>
          <option value="">Все бренды</option>
          {brands.map((brand) => <option key={brand.id} value={String(brand.id)}>{brand.name}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setCategoryFilter(''); setBrandFilter(''); }} style={{ padding: '10px 16px', border: 'none', borderRadius: '6px', background: '#444', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>Сбросить</button>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '24px' }}>
        <div style={{ minWidth: '1100px', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Название</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Категория</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Бренд</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Цена</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Наличие</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500 }}>{product.name}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{categories.find((category) => String(category.id) === String(product.category))?.name || product.categoryName || '—'}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{product.factory || '—'}</td>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500 }}>{Number(product.price).toLocaleString('ru-RU')} ?</td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{product.inStock === 'preorder' ? 'Под заказ' : product.inStock === false ? 'Нет в наличии' : 'В наличии'}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => openEdit(product)} style={{ padding: '6px 12px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '8px' }}>Редактировать</button>
                    <button onClick={() => void handleDelete(String(product.id))} style={{ padding: '6px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <h2 className="admin-modal-title">{editingProduct ? 'Редактировать товар' : 'Добавить товар'}</h2>

            <div className="admin-field"><label>Название</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="admin-field"><label>Цена</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></div>
            <div className="admin-field"><label>Старая цена (если скидка)</label><input type="number" value={formData.oldPrice} onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })} placeholder="Оставьте пустым, если нет скидки" /></div>
            <div className="admin-field"><label>Категория</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}><option value="">Выберите категорию</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
            <div className="admin-field"><label>Бренд</label><select value={formData.brandId} onChange={(e) => handleBrandChange(e.target.value)}><option value="">Выберите бренд</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
            <div className="admin-field"><label>Страна</label><select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}><option value="">Выберите страну</option>{countries.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
            <div className="admin-field"><label>Артикул</label><input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} /></div>
            <div className="admin-field"><label>Размеры</label><input type="text" value={formData.sizes} onChange={(e) => setFormData({ ...formData, sizes: e.target.value })} /></div>
            <div className="admin-field"><label>Материал</label><input type="text" value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} /></div>
            <div className="admin-field"><label>Цвет</label><input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} /></div>
            <div className="admin-field"><label>Наличие</label><select value={formData.stockStatus} onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value })}>{AVAILABILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
            <div className="admin-field"><label>Количество</label><input type="number" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })} /></div>
            <div className="admin-field"><label>Описание</label><textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="admin-field"><label>Изображения</label><input type="file" accept="image/*" multiple onChange={(e) => setFormData({ ...formData, files: Array.from(e.target.files || []) })} /></div>
            <div className="admin-field">
              <label>Характеристики</label>
              {formData.characteristics.map((ch: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input type="text" placeholder="Название" value={ch.name} onChange={(e) => { const next = [...formData.characteristics]; next[idx] = { ...next[idx], name: e.target.value }; setFormData({ ...formData, characteristics: next }); }} style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                  <input type="text" placeholder="Значение" value={ch.value} onChange={(e) => { const next = [...formData.characteristics]; next[idx] = { ...next[idx], value: e.target.value }; setFormData({ ...formData, characteristics: next }); }} style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                  <button type="button" onClick={() => { const next = formData.characteristics.filter((_: any, i: number) => i !== idx); setFormData({ ...formData, characteristics: next }); }} style={{ padding: '4px 10px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>&times;</button>
                </div>
              ))}
              <button type="button" onClick={() => setFormData({ ...formData, characteristics: [...formData.characteristics, { name: '', value: '' }] })} style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px dashed #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginTop: 4 }}>+ Добавить характеристику</button>
            </div>
            <div className="admin-field admin-field-row"><label><input type="checkbox" checked={formData.popular} onChange={(e) => setFormData({ ...formData, popular: e.target.checked })} /> Популярный товар</label></div>
            <div className="admin-field admin-field-row"><label><input type="checkbox" checked={formData.isNew} onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })} /> Новинка</label></div>
            <div className="admin-field admin-field-row"><label><input type="checkbox" checked={formData.isSale} onChange={(e) => setFormData({ ...formData, isSale: e.target.checked })} /> Акция</label></div>

            <div className="admin-modal-actions">
              <button onClick={() => void handleSave()} className="admin-btn-save">Сохранить</button>
              <button onClick={() => { setShowModal(false); setEditingProduct(null); }} className="admin-btn-cancel">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

