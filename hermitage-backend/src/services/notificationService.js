import prisma from '../config/prisma.js';
import { sendNotificationEmail } from '../utils/email.js';

const STATUS_LABELS = {
  PENDING: 'Ожидает обработки',
  PROCESSING: 'В обработке',
  SHIPPED: 'Передан в доставку',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
};

const ORDER_NOTIFICATION_TYPES = {
  ORDER_CREATED: {
    title: 'Заказ оформлен',
    getMessage: (orderId) => `Ваш заказ #${orderId.slice(0, 8)} успешно оформлен и ожидает обработки.`,
  },
  PENDING: {
    title: 'Заказ принят',
    getMessage: (orderId) => `Заказ #${orderId.slice(0, 8)} принят и ожидает обработки.`,
  },
  PROCESSING: {
    title: 'Заказ в обработке',
    getMessage: (orderId) => `Заказ #${orderId.slice(0, 8)} сейчас обрабатывается.`,
  },
  SHIPPED: {
    title: 'Заказ передан в доставку',
    getMessage: (orderId) => `Заказ #${orderId.slice(0, 8)} передан в доставку. Ожидайте курьера.`,
  },
  DELIVERED: {
    title: 'Заказ доставлен',
    getMessage: (orderId) => `Заказ #${orderId.slice(0, 8)} успешно доставлен. Спасибо за покупку!`,
  },
  CANCELLED: {
    title: 'Заказ отменён',
    getMessage: (orderId) => `Заказ #${orderId.slice(0, 8)} был отменён.`,
  },
};

export const createNotification = async (userId, { type = 'SYSTEM', title, message, orderId = null }) => {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, orderId },
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
  if (user?.email) {
    sendNotificationEmail({ to: user.email, firstName: user.firstName, title, message })
      .catch((err) => console.error('[notification] Failed to send email:', err.message));
  }

  return notification;
};

export const createOrderNotification = async (userId, orderId, status) => {
  const template = ORDER_NOTIFICATION_TYPES[status];
  if (!template) {
    console.warn(`[notification] Unknown status "${status}" for order ${orderId}`);
    return null;
  }

  if (!orderId) {
    console.warn(`[notification] No orderId provided for user ${userId}`);
    return null;
  }

  return createNotification(userId, {
    type: status === 'ORDER_CREATED' ? 'ORDER_CREATED' : 'ORDER_STATUS',
    title: template.title,
    message: template.getMessage(orderId),
    orderId,
  });
};

export const getUserNotifications = async (userId) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const getUnreadCount = async (userId) => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};

export const markAsRead = async (userId, notificationId) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};
