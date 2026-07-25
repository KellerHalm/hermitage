import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { parsePagination } from '../utils/pagination.js';
import { sendOrderCreatedEmail, sendOrderStatusEmail } from '../utils/email.js';

const VALID_ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

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

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  let totalAmount = 0;
  const orderItemsData = items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);

    if (!product) {
      throw new AppError(`Product with ID ${item.productId} not found`, 404);
    }

    if (product.stockStatus === 'OUT_OF_STOCK') {
      throw new AppError(`Product "${product.title}" is out of stock`, 400);
    }

    if (product.stockQuantity !== null && product.stockQuantity < item.quantity) {
      throw new AppError(`Not enough stock for "${product.title}" (available: ${product.stockQuantity})`, 400);
    }

    const price = Number(product.price);
    totalAmount += price * item.quantity;

    return {
      productId: item.productId,
      quantity: item.quantity,
      price,
    };
  });

  return prisma.order.create({
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
  }).then(async (order) => {
    void sendOrderCreatedEmail(order).catch(() => {});
    return order;
  });
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

  return order;
};

