import { Request, Response } from 'express';
import prisma from '../db';

// @desc    Create a new product
// @route   POST /api/products
// @access  Private
export const createProduct = async (req: Request, res: Response) => {
  const { name, description, price, type, contestIds } = req.body;

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        type,
        sellerId: req.user!.id,
        contests: contestIds ? { connect: contestIds.map((id: string) => ({ id })) } : undefined,
      },
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Failed to create product', error });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({ include: { seller: { select: { name: true } } } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// @desc    Get a single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ 
      where: { id: req.params.id },
      include: { seller: { select: { name: true, avatar: true } } }
    });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerId !== req.user!.id) {
      return res.status(403).json({ message: 'User not authorized to update this product' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update product', error });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerId !== req.user!.id) {
      return res.status(403).json({ message: 'User not authorized to delete this product' });
    }

    await prisma.product.delete({ where: { id: req.params.id } });

    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
};
