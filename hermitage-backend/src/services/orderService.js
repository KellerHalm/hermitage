import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { parsePagination } from '../utils/pagination.js';
import { sendOrderCreatedEmail, sendOrderStatusEmail } from '../utils/email.js';
import { createOrderNotification } from './notificationService.js';

const VALID_ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const normalizeItems = (items) => {
  const merged = new Map();

  for (const item of items) {
    const existing = merged.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.set(item.productId, { productId: item.productId, quantity: item.quantity });
    }
  }

  return [...merged.values()];
};

export const createOrder = async (userId, data) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    deliveryType,
    comment,
    customerFirstName,
    customerLastName,
    customerPhone,
    customerEmail,
  } = data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('No order items provided', 400);
  }

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity < 1) {
      throw new AppError('Each item must have a valid productId and quantity >= 1', 400);
    }
  }

  const normalizedItems = normalizeItems(items);

  const order = await prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of normalizedItems) {
      // Re-read each product inside the transaction so stock checks and
      // decrements are based on current data under concurrent load.
      // eslint-disable-next-line no-await-in-loop
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, title: true, price: true, stockStatus: true, stockQuantity: true },
      });

      if (!product) {
        throw new AppError(`Product with ID ${item.productId} not found`, 404);
      }

      if (product.stockStatus === 'OUT_OF_STOCK') {
        throw new AppError(`Product "${product.title}" is out of stock`, 400);
      }

      if (product.stockQuantity !== null) {
        // Atomic conditional decrement prevents overselling if two orders race.
        // eslint-disable-next-line no-await-in-loop
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockStatus: { not: 'OUT_OF_STOCK' },
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        if (result.count === 0) {
          throw new AppError(`Not enough stock for "${product.title}"`, 400);
        }

        // eslint-disable-next-line no-await-in-loop
        const updatedProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true, stockStatus: true },
        });

        if (updatedProduct?.stockQuantity !== null && updatedProduct.stockQuantity <= 0 && updatedProduct.stockStatus === 'IN_STOCK') {
          // eslint-disable-next-line no-await-in-loop
          await tx.product.update({
            where: { id: item.productId },
            data: { stockStatus: 'OUT_OF_STOCK' },
          });
        }
      }

      const price = Number(product.price);
      totalAmount += price * item.quantity;
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
      });
    }

    const createdOrder = await tx.order.create({
      data: {
        userId,
        totalAmount,
        shippingAddress: shippingAddress || null,
        paymentMethod: paymentMethod || null,
        deliveryType: deliveryType || null,
        comment: comment || null,
        customerFirstName: customerFirstName || null,
        customerLastName: customerLastName || null,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isMain: true } },
              },
            },
          },
        },
        user: {
          select: { email: true },
        },
      },
    });

    return createdOrder;
  });

  void sendOrderCreatedEmail(order).catch(() => {});
  createOrderNotification(order.userId, order.id, 'ORDER_CREATED')
    .catch((err) => console.error('[orderService] Failed to create notification:', err));

  return order;
};

export const getUserOrders = async (userId) => prisma.order.findMany({
  where: { userId },
  include: {
    items: {
      include: {
        product: {
          include: {
            images: { where: { isMain: true } },
          },
        },
      },
    },
  },
  orderBy: { createdAt: 'desc' },
});

export const getAllOrders = async (query) => {
  const { status } = query;
  const { pageNumber, take, skip } = parsePagination(query, { defaultLimit: 50 });

  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
        },
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: { select: { name: true, slug: true } },
                brand: { select: { name: true, slug: true } },
                characteristics: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / take),
  };
};

export const updateOrderStatus = async (id, status) => {
  if (!VALID_ORDER_STATUSES.includes(status)) {
    throw new AppError(`Invalid order status: ${status}. Valid statuses: ${VALID_ORDER_STATUSES.join(', ')}`, 400);
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
              category: { select: { name: true, slug: true } },
              brand: { select: { name: true, slug: true } },
              characteristics: true,
            },
          },
        },
      },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
      },
    },
  });

  void sendOrderStatusEmail(order, status).catch(() => {});
  createOrderNotification(order.userId, order.id, status)
    .catch((err) => console.error('[orderService] Failed to create notification:', err));

  return order;
};

