import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          images: true,
          category: true,
          brand: true,
        },
      },
    },
  },
};

const resolveCartOwner = (req) => {
  if (req.user?.id) {
    return { userId: req.user.id };
  }
  if (req.guestId) {
    return { guestId: req.guestId };
  }
  throw new AppError('Guest ID or authorization required', 401);
};

const getOrCreateCart = async (owner) => {
  const where = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId };
  let cart = await prisma.cart.findUnique({ where, include: cartInclude });

  if (!cart) {
    cart = await prisma.cart.create({
      data: owner,
      include: cartInclude,
    });
  }

  return cart;
};

export const getCart = async (req) => {
  const owner = resolveCartOwner(req);
  return getOrCreateCart(owner);
};

export const addCartItem = async (req, productId, quantity = 1) => {
  const owner = resolveCartOwner(req);
  const cart = await getOrCreateCart(owner);
  const qty = Math.max(1, Number.parseInt(quantity, 10) || 1);

  const existing = cart.items.find((item) => item.productId === productId);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + qty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: qty,
      },
    });
  }

  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude,
  });
};

export const updateCartItem = async (req, productId, quantity) => {
  const owner = resolveCartOwner(req);
  const cart = await getOrCreateCart(owner);
  const qty = Number.parseInt(quantity, 10);

  const existing = cart.items.find((item) => item.productId === productId);
  if (!existing) {
    throw new AppError('Item not found in cart', 404);
  }

  if (!qty || qty <= 0) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: qty },
    });
  }

  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude,
  });
};

export const removeCartItem = async (req, productId) => {
  const owner = resolveCartOwner(req);
  const cart = await getOrCreateCart(owner);

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      productId,
    },
  });

  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude,
  });
};

export const clearCart = async (req) => {
  const owner = resolveCartOwner(req);
  const cart = await getOrCreateCart(owner);

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude,
  });
};

export const mergeGuestCart = async (userId, guestId) => {
  if (!guestId) return null;

  const guestCart = await prisma.cart.findUnique({
    where: { guestId },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) {
    return null;
  }

  let userCart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!userCart) {
    userCart = await prisma.cart.create({
      data: { userId },
      include: { items: true },
    });
  }

  for (const item of guestCart.items) {
    const existing = userCart.items.find((entry) => entry.productId === item.productId);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          quantity: item.quantity,
        },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });

  return prisma.cart.findUnique({
    where: { id: userCart.id },
    include: cartInclude,
  });
};
