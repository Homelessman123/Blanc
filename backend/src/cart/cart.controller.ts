import { Request, Response } from 'express';
import prisma from '../db';

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req: Request, res: Response) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            product: true
          },
          orderBy: {
            product: {
              name: 'asc'
            }
          }
        }
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user!.id },
        include: {
          items: {
            include: {
              product: true
            },
            orderBy: {
              product: {
                name: 'asc'
              }
            }
          }
        },
      });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Couldn't fetch cart", error });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
export const addItemToCart = async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ message: 'Product ID and a valid quantity are required' });
  }

  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } })
      || await prisma.cart.create({ data: { userId: req.user!.id } });

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });

    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: "Couldn't add item to cart", error });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
export const removeItemFromCart = async (req: Request, res: Response) => {
  const { itemId } = req.params;

  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });

    if (!cart || !cartItem || cartItem.cartId !== cart.id) {
      return res.status(403).json({ message: 'Not authorized to perform this action' });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });

    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: "Couldn't remove item from cart", error });
  }
};
