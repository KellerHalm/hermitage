'use client';

import { useEffect, useState } from 'react';
import { Store } from '@/lib/store';
import { showToast } from '@/lib/toast';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Администратор' },
  { value: 'MANAGER', label: 'Менеджер' },
  { value: 'CUSTOMER', label: 'Покупатель' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortField, setSortField] = useState<'role' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CUSTOMER',
  });

  const currentUser = Store.user();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await Store.loadUsers();
      setUsers(result);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = users
    .filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        user.email?.toLowerCase().includes(q) ||
        user.firstName?.toLowerCase().includes(q) ||
        user.lastName?.toLowerCase().includes(q) ||
        user.phone?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortField === 'role') {
        const order = sortOrder === 'asc' ? 1 : -1;
        return a.role.localeCompare(b.role) * order;
      }
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });

  const handleCreate = async () => {
    if (!formData.email.trim()) {
      showToast('Введите email', 'error');
      return;
    }
    if (!formData.password.trim()) {
      showToast('Введите пароль', 'error');
      return;
    }

    try {
      await Store.createUser(formData);
      await loadUsers();
      setShowModal(false);
      setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'CUSTOMER' });
      showToast('Пользователь создан', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Не удалось создать пользователя', 'error');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await Store.updateUser(userId, { role: newRole });
      await loadUsers();
      showToast('Роль обновлена', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Не удалось обновить роль', 'error');
    }
  };

  const handleDelete = async (userId: string) => {
    if (currentUser?.id === userId) {
      showToast('Нельзя удалить свой аккаунт', 'error');
      return;
    }
    if (!confirm('Удалить пользователя?')) return;

    try {
      await Store.deleteUser(userId);
      await loadUsers();
      showToast('Пользователь удалён', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Не удалось удалить пользователя', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка пользователей...</div>;
  }

  return (
    <div>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', margin: 0 }}>Пользователи ({filteredUsers.length})</h1>
          <p style={{ marginTop: '6px', color: '#666', fontSize: '14px' }}>Показано {filteredUsers.length} из {users.length} пользователей</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', background: '#b89968', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Добавить пользователя</button>
      </div>

      <input type="text" placeholder="Поиск по email, имени, телефону..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '24px', fontSize: '14px', boxSizing: 'border-box' }} />

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff', cursor: 'pointer' }}
        >
          <option value="">Все роли</option>
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={`${sortField}:${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split(':');
            setSortField(field as 'role' | 'createdAt');
            setSortOrder(order as 'asc' | 'desc');
          }}
          style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff', cursor: 'pointer' }}
        >
          <option value="createdAt:desc">Дата (новые)</option>
          <option value="createdAt:asc">Дата (старые)</option>
          <option value="role:asc">Роль (А→Я)</option>
          <option value="role:desc">Роль (Я→А)</option>
        </select>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '24px' }}>
        <div style={{ minWidth: '900px', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Имя</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Телефон</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Роль</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Дата</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500 }}>{user.email}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{user.firstName || '—'} {user.lastName || ''}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{user.phone || '—'}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <select
                      value={user.role}
                      onChange={(e) => void handleRoleChange(user.id, e.target.value)}
                      disabled={currentUser?.id === user.id}
                      style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', background: '#fff', cursor: currentUser?.id === user.id ? 'not-allowed' : 'pointer' }}
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => void handleDelete(user.id)}
                      disabled={currentUser?.id === user.id}
                      style={{
                        padding: '6px 12px',
                        background: currentUser?.id === user.id ? '#f5f5f5' : '#ffebee',
                        color: currentUser?.id === user.id ? '#999' : '#c62828',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentUser?.id === user.id ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        opacity: currentUser?.id === user.id ? 0.5 : 1,
                      }}
                    >
                      Удалить
                    </button>
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
            <h2 className="admin-modal-title">Добавить пользователя</h2>

            <div className="admin-field"><label>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="admin-field"><label>Пароль</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} /></div>
            <div className="admin-field"><label>Имя</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} /></div>
            <div className="admin-field"><label>Фамилия</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></div>
            <div className="admin-field"><label>Телефон</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div className="admin-field"><label>Роль</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="admin-modal-actions">
              <button onClick={() => void handleCreate()} className="admin-btn-save">Создать</button>
              <button onClick={() => { setShowModal(false); setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'CUSTOMER' }); }} className="admin-btn-cancel">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
