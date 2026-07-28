export const validate = {
  email(value: string): string | null {
    if (!value.trim()) return 'Введите email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Некорректный формат email';
    if (value.length > 255) return 'Email слишком длинный';
    return null;
  },

  password(value: string): string | null {
    if (!value) return 'Введите пароль';
    if (value.length < 8) return 'Пароль должен содержать минимум 8 символов';
    if (value.length > 128) return 'Пароль слишком длинный';
    return null;
  },

  required(value: string, label: string): string | null {
    if (!value || !value.trim()) return `Введите ${label.toLowerCase()}`;
    return null;
  },

  maxLength(value: string, max: number, label: string): string | null {
    if (value.length > max) return `${label}: максимум ${max} символов`;
    return null;
  },

  phone(value: string): string | null {
    if (!value.trim()) return 'Введите телефон';
    if (value.length > 20) return 'Телефон слишком длинный';
    return null;
  },

  name(value: string, label: string): string | null {
    if (!value.trim()) return `Введите ${label.toLowerCase()}`;
    if (value.length > 100) return `${label}: максимум 100 символов`;
    return null;
  },

  price(value: string | number): string | null {
    const num = Number(value);
    if (!num || num <= 0) return 'Цена должна быть больше 0';
    if (num > 99999999) return 'Цена слишком большая';
    return null;
  },

  positiveInt(value: string | number): string | null {
    const num = Number(value);
    if (value !== '' && value !== null && (isNaN(num) || num < 0 || !Number.isInteger(num))) {
      return 'Значение должно быть целым числом >= 0';
    }
    return null;
  },
};
