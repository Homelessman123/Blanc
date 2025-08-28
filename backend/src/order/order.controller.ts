import { Request, Response } from 'express';
import prisma from '../db';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req: Request, res: Response) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

    // Use a transaction to ensure all operations succeed or none do.
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const order = await tx.order.create({
        data: {
          userId: req.user!.id,
          totalPrice,
          status: 'COMPLETED', // Assume payment is instant for now
        },
        include: { items: true },
      });

      // 2. Create order items and group revenue by seller
      const sellerRevenueMap = new Map<string, number>();
      const orderItemsData = cart.items.map((item) => {
        const revenue = item.quantity * item.product.price;
        const currentSellerRevenue = sellerRevenueMap.get(item.product.sellerId) || 0;
        sellerRevenueMap.set(item.product.sellerId, currentSellerRevenue + revenue);

        return {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          name: item.product.name, // Snapshot of name
          price: item.product.price, // Snapshot of price
        };
      });

      await tx.orderItem.createMany({ data: orderItemsData });

      // 3. Process revenue for each seller
      for (const [sellerId, totalSale] of sellerRevenueMap.entries()) {
        const revenueAfterCommission = totalSale * 0.95; // 5% commission

        // Add to seller's balance
        await tx.user.update({
          where: { id: sellerId },
          data: { balance: { increment: revenueAfterCommission } },
        });

        // Create a transaction record
        await tx.transaction.create({
          data: {
            userId: sellerId,
            orderId: order.id,
            amount: revenueAfterCommission,
            type: 'SALE',
          },
        });
      }

      // 4. Clear the user's cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });

    // Refetch the full order to include the newly created items
    const fullOrderDetails = await prisma.order.findUnique({
        where: { id: newOrder.id },
        include: { items: true }
    });

    res.status(201).json(fullOrderDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Couldn't create order", error });
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Couldn't fetch orders", error });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Ensure only the user who owns the order or an admin can view it
    if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Couldn't fetch order", error });
  }
};
