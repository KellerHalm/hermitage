import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const transporter = nodemailer.createTransport({
  host: config.emailHost,
  port: config.emailPort,
  secure: config.emailSecure,
  auth: config.emailUser
    ? { user: config.emailUser, pass: config.emailPass }
    : undefined,
});

const FROM = config.emailFrom || 'HERMITAGE DECOR <noreply@hermitage-decor.ru>';

const formatPrice = (n) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

const STATUS_LABELS = {
  PENDING: 'Новый',
  PROCESSING: 'В обработке',
  SHIPPED: 'В пути',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
};

const STATUS_EMAILS = {
  PENDING: (order) => ({
    subject: `Заявка #${order.id.slice(0, 8)} принята`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#b89a6b;">Спасибо за вашу заявку!</h2>
        <p>Ваша заявка <strong>#${escapeHtml(order.id.slice(0, 8))}</strong> успешно создана и передана на обработку.</p>
        <p>Наш менеджер свяжется с вами в ближайшее время для подтверждения деталей заказа и оформления оплаты.</p>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;" />
        <h3 style="color:#333;">Детали заказа</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${order.items.map((item) => `
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #eee;">
                <strong>${escapeHtml(item.product?.title || item.product?.name || 'Товар')}</strong><br/>
                <span style="color:#666;font-size:13px;">Кол-во: ${escapeHtml(item.quantity)}</span>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;">
                ${formatPrice(Number(item.price) * item.quantity)}
              </td>
            </tr>
          `).join('')}
        </table>
        <p style="font-size:18px;font-weight:600;margin-top:16px;text-align:right;color:#b89a6b;">
          Итого: ${formatPrice(Number(order.totalAmount))}
        </p>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;" />
        <p style="color:#666;font-size:13px;">
          ${order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
          ${order.shippingAddress ? ` — ${escapeHtml(order.shippingAddress)}` : ''}
        </p>
        <p style="color:#666;font-size:13px;">
          Телефон: ${escapeHtml(order.customerPhone) || 'не указан'}
        </p>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;" />
        <p style="color:#999;font-size:12px;text-align:center;">HERMITAGE DECOR — мебель и предметы интерьера премиального качества</p>
      </div>
    `,
  }),
  PROCESSING: (order) => ({
    subject: `Заявка #${order.id.slice(0, 8)} — обрабатывается`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#b89a6b;">Ваш заказ обрабатывается</h2>
        <p>Заявка <strong>#${escapeHtml(order.id.slice(0, 8))}</strong> принята в работу.</p>
        <p>Наш менеджер уточнит детали доставки и свяжется с вами для завершения оформления.</p>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;" />
        <p style="color:#999;font-size:12px;text-align:center;">HERMITAGE DECOR — мебель и предметы интерьера премиального качества</p>
      </div>
    `,
  }),
  SHIPPED: (order) => ({
    subject: `Заявка #${order.id.slice(0, 8)} — в пути`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#b89a6b;">Ваш заказ в пути</h2>
        <p>Заявка <strong>#${escapeHtml(order.id.slice(0, 8))}</strong> отправлена и находится в пути.</p>
        <p>Ожидайте доставки в ближайшее время.</p>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;" />
        <p style="color:#999;font-size:12px;text-align:center;">HERMITAGE DECOR — мебель и предметы интерьера премиального качества</p>
      </div>
    `,
  }),
  DELIVERED: (order) => ({
    subject: `Заявка #${order.id.slice(0, 8)} — доставлена`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#b89a6b;">Ваш заказ доставлен</h2>
        <p>Заявка <strong>#${escapeHtml(order.id.slice(0, 8))}</strong> успешно доставлена.</p>
        <p>Спасибо за покупку! Будем рады видеть вас снова.</p>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;" />
        <p style="color:#999;font-size:12px;text-align:center;">HERMITAGE DECOR — мебель и предметы интерьера премиального качества</p>
      </div>
    `,
  }),
  CANCELLED: (order) => ({
    subject: `Заявка #${order.id.slice(0, 8)} — отменена`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#c62828;">Заказ отменён</h2>
        <p>Заявка <strong>#${escapeHtml(order.id.slice(0, 8))}</strong> была отменена.</p>
        <p>Если у вас есть вопросы, свяжитесь с нами.</p>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;" />
        <p style="color:#999;font-size:12px;text-align:center;">HERMITAGE DECOR — мебель и предметы интерьера премиального качества</p>
      </div>
    `,
  }),
};

export const sendOrderCreatedEmail = async (order) => {
  const to = order.customerEmail || order.user?.email;
  if (!to) return;

  const template = STATUS_EMAILS.PENDING(order);

  try {
    await transporter.sendMail({ from: FROM, to, subject: template.subject, html: template.html });
  } catch (err) {
    console.error('Failed to send order created email:', err.message);
  }
};

export const sendOrderStatusEmail = async (order, newStatus) => {
  const to = order.customerEmail || order.user?.email;
  if (!to) return;

  const templateFn = STATUS_EMAILS[newStatus];
  if (!templateFn) return;

  const template = templateFn(order);

  try {
    await transporter.sendMail({ from: FROM, to, subject: template.subject, html: template.html });
  } catch (err) {
    console.error(`Failed to send order status email (${newStatus}):`, err.message);
  }
};

export const sendWelcomeEmail = async ({ email, firstName }) => {
  if (!email) return;

  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Добро пожаловать в HERMITAGE DECOR!',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#b89a6b;">Добро пожаловать, ${escapeHtml(firstName) || 'клиент'}!</h2>
          <p>Спасибо за регистрацию в <strong>HERMITAGE DECOR</strong>.</p>
          <p>Теперь вы можете оформлять заказы, отслеживать их статус и сохранять избранные товары.</p>
          <p>Если у вас есть вопросы — свяжитесь с нами по телефону или электронной почте.</p>
          <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;" />
          <p style="color:#999;font-size:12px;text-align:center;">HERMITAGE DECOR — мебель и предметы интерьера премиального качества</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err.message);
  }
};

export const sendNotificationEmail = async ({ to, firstName, title, message }) => {
  if (!to) return;

  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `[HERMITAGE] ${escapeHtml(title)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#b89a6b;">${escapeHtml(title)}</h2>
          <p style="font-size:15px;color:#333;">Здравствуйте${escapeHtml(firstName) ? ', ' + escapeHtml(firstName) : ''}!</p>
          <p style="font-size:15px;color:#333;">${escapeHtml(message)}</p>
          <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;" />
          <p style="color:#666;font-size:13px;">Вы можете отслеживать статус ваших заказов в личном кабинете на сайте.</p>
          <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;" />
          <p style="color:#999;font-size:12px;text-align:center;">HERMITAGE DECOR — мебель и предметы интерьера премиального качества</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send notification email:', err.message);
  }
};
