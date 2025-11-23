import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import type { ProductType } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // CREATE product
    if (req.method === 'POST') {
      const { name, model, brand, serialNumber, type, purchasePrice, sellingPrice, stockLocationId, quantity = 1, productCode } = req.body;

      if (!name || !model || !brand || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const product = await prisma.product.create({
        data: {
          name,
          model,
          brand,
          serialNumber,
          productCode,
          type,
          purchasePrice: purchasePrice ? Number(purchasePrice) : null,
          sellingPrice: sellingPrice ? Number(sellingPrice) : null,
          // Create the initial stock entry if stockLocationId is provided
          stocks: stockLocationId ? {
            create: {
              quantity,
              location: {
                connect: {
                  id: stockLocationId
                }
              }
            }
          } : undefined
        },
        include: {
          stocks: {
            include: {
              location: true
            }
          }
        }
      });

      return res.status(201).json(product);
    }

    // GET products
    if (req.method === 'GET') {
      const type = req.query.type as string;
      const assignedToMe = req.query.assignedToMe === 'true';
      const inStock = req.query.inStock === 'true';

      // Get user's stock location if assignedToMe is true
      let userStockLocationId: string | undefined;
      if (assignedToMe) {
        const { getServerSession } = await import('next-auth/next');
        const { authOptions } = await import('@/pages/api/auth/[...nextauth]');
        const session = await getServerSession(req, res, authOptions);

        if (session?.user?.id) {
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { stockLocation: true }
          });
          userStockLocationId = user?.stockLocation?.id;
        }
      }

      const products = await prisma.product.findMany({
        where: type ? {
          type: { equals: type as ProductType }
        } : {},
        include: {
          stocks: {
            where: {
              status: 'FOR_SALE',
              // Filter by user's stock location if assignedToMe is true
              ...(userStockLocationId ? { locationId: userStockLocationId } : {})
            },
            include: {
              location: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const transformedProducts = products.map(product => {
        const primaryStock = product.stocks?.[0];
        const totalQuantity = product.stocks?.reduce((total, stock) => total + stock.quantity, 0) || 0;

        return {
          id: product.id,
          name: product.name,
          brand: product.brand,
          model: product.model,
          serialNumber: product.serialNumber,
          productCode: product.productCode,
          type: product.type,
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice,
          price: product.sellingPrice, // Add alias for compatibility
          warrantyExpiration: product.warrantyExpiration,
          createdAt: product.createdAt,
          stockLocation: primaryStock?.location || null,
          stockLocationId: primaryStock?.locationId || null,
          quantity: totalQuantity, // Quantity in user's stock (if filtered)
          stockQuantity: totalQuantity,
          totalQuantity: totalQuantity,
          stocks: product.stocks, // Include full stocks array
          status: product.status || 'ACTIVE'
        };
      });

      // Filter out products with no stock if inStock is true
      const filteredProducts = inStock
        ? transformedProducts.filter(p => p.quantity > 0)
        : transformedProducts;

      return res.status(200).json(filteredProducts);
    }

    // UPDATE product
    if (req.method === 'PUT') {
      const { id, name, model, brand, serialNumber, purchasePrice, sellingPrice, stockLocationId, quantity = 1 } = req.body;

      if (!id || !name || !model || !brand) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // First update the product

      // Then handle stock location update if provided
      if (stockLocationId) {
        // Get existing stock for this location
        const existingStock = await prisma.stock.findFirst({
          where: {
            productId: id,
            locationId: stockLocationId
          }
        });

        if (existingStock) {
          // Update existing stock
          await prisma.stock.update({
            where: { id: existingStock.id },
            data: { quantity }
          });
        } else {
          // Create new stock entry
          await prisma.stock.create({
            data: {
              quantity,
              product: {
                connect: { id }
              },
              location: {
                connect: { id: stockLocationId }
              }
            }
          });
        }
      }

      // Fetch the updated product with its stocks
      const finalProduct = await prisma.product.findUnique({
        where: { id },
        include: {
          stocks: {
            include: {
              location: true
            }
          }
        }
      });

      return res.status(200).json(finalProduct);
    }

    // DELETE product
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Missing product ID' });
      }

      // Delete associated stocks first
      await prisma.stock.deleteMany({
        where: { productId: id as string }
      });

      // Then delete the product
      await prisma.product.delete({
        where: { id: id as string }
      });

      return res.status(200).json({ message: 'Product deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in products API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
