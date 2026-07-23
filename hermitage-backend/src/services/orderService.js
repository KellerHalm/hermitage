import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

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

  if (!items || items.length === 0) {
    throw new AppError('No order items provided', 400);
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
    },
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
  const { page = 1, limit = 50, status } = query;
  const pageNumber = Number.parseInt(page, 10) || 1;
  const take = Number.parseInt(limit, 10) || 50;
  const skip = (pageNumber - 1) * take;

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
                images: { where: { isMain: true } },
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

export const updateOrderStatus = async (id, status) => prisma.order.update({
  where: { id },
  data: { status },
  include: {
    items: {
      include: {
        product: true,
      },
    },
    user: {
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
    },
  },
});

