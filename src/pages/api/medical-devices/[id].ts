import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        // Try to find medical device first
        let device = await prisma.medicalDevice.findUnique({
          where: { id: id as string },
          include: {
            stockLocation: true
          }
        });

        if (device) {
          return res.status(200).json({
            id: device.id,
            name: device.name,
            type: device.type,
            brand: device.brand,
            model: device.model,
            serialNumber: device.serialNumber,
            purchasePrice: device.purchasePrice,
            sellingPrice: device.sellingPrice,
            technicalSpecs: device.technicalSpecs,
            warranty: device.warranty,
            availableForRent: device.availableForRent,
            requiresMaintenance: device.requiresMaintenance,
            stockLocation: device.stockLocation?.name || 'Non assigné',
            stockLocationId: device.stockLocationId,
            stockQuantity: device.stockQuantity,
            status: device.status,
            configuration: device.configuration,
            installationDate: device.installationDate
          });
        }

        // If not found, try to find regular product
        const product = await prisma.product.findUnique({
          where: { id: id as string },
          include: {
            stocks: {
              include: {
                location: true
              }
            }
          }
        });

        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        return res.status(200).json({
          id: product.id,
          name: product.name,
          type: product.type,
          brand: product.brand,
          model: product.model,
          serialNumber: product.serialNumber,
          purchasePrice: product.purchasePrice,
          totalCost: product.totalCost,
          minStock: product.minStock,
          maxStock: product.maxStock,
          alertThreshold: product.alertThreshold,
          stockLocation: product.stocks[0]?.location.name || 'Non assigné',
          stockLocationId: product.stocks[0]?.location.id,
          stockQuantity: product.stocks.reduce((acc, stock) => acc + stock.quantity, 0),
          status: product.stocks[0]?.status || 'EN_VENTE'
        });

      case 'PUT':
        try {
          const { type, ...data } = req.body;
          console.log("Updating device:", id, data);

          if (type === 'MEDICAL_DEVICE' || type === 'DIAGNOSTIC_DEVICE') {
            const updatedDevice = await prisma.medicalDevice.update({
              where: { id: id as string },
              data: {
                name: data.name,
                brand: data.brand,
                model: data.model,
                serialNumber: data.serialNumber,
                purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
                sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
                technicalSpecs: data.technicalSpecs,
                warranty: data.warranty,
                availableForRent: data.availableForRent || false,
                requiresMaintenance: data.requiresMaintenance || false,
                configuration: data.configuration,
                status: data.status || 'ACTIVE',
                ...(data.stockLocationId ? {
                  stockLocation: {
                    connect: {
                      id: data.stockLocationId
                    }
                  }
                } : {
                  stockLocation: {
                    disconnect: true
                  }
                }),
                stockQuantity: data.stockQuantity || 1
              },
              include: {
                stockLocation: true
              }
            });

            return res.status(200).json({
              id: updatedDevice.id,
              name: updatedDevice.name,
              type: updatedDevice.type,
              brand: updatedDevice.brand,
              model: updatedDevice.model,
              serialNumber: updatedDevice.serialNumber,
              purchasePrice: updatedDevice.purchasePrice,
              sellingPrice: updatedDevice.sellingPrice,
              technicalSpecs: updatedDevice.technicalSpecs,
              warranty: updatedDevice.warranty,
              availableForRent: updatedDevice.availableForRent,
              requiresMaintenance: updatedDevice.requiresMaintenance,
              stockLocation: updatedDevice.stockLocation?.name || 'Non assigné',
              stockLocationId: updatedDevice.stockLocationId,
              stockQuantity: updatedDevice.stockQuantity,
              status: updatedDevice.status,
              configuration: updatedDevice.configuration
            });
          } else {
            // Update product
            const updatedProduct = await prisma.product.update({
              where: { id: id as string },
              data: {
                name: data.name,
                brand: data.brand || null,
                model: data.model || null,
                serialNumber: data.serialNumber || null,
                purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice.toString()) : null,
                minStock: data.minStock ? parseInt(data.minStock.toString()) : null,
                maxStock: data.maxStock ? parseInt(data.maxStock.toString()) : null,
                alertThreshold: data.alertThreshold ? parseInt(data.alertThreshold.toString()) : null
              },
              include: {
                stocks: {
                  include: {
                    location: true
                  }
                }
              }
            });

            // Get the stock for this product
            const stock = await prisma.stock.findFirst({
              where: { productId: id as string },
              include: { location: true }
            });

            // Update stock quantity if provided
            if (stock && data.stockQuantity) {
              await prisma.stock.update({
                where: { id: stock.id },
                data: {
                  quantity: parseInt(data.stockQuantity.toString())
                }
              });
            }

            return res.status(200).json({
              id: updatedProduct.id,
              name: updatedProduct.name,
              type: updatedProduct.type,
              brand: updatedProduct.brand,
              model: updatedProduct.model,
              serialNumber: updatedProduct.serialNumber,
              purchasePrice: updatedProduct.purchasePrice,
              minStock: updatedProduct.minStock,
              maxStock: updatedProduct.maxStock,
              alertThreshold: updatedProduct.alertThreshold,
              stockLocation: stock?.location?.name || 'Non assigné',
              stockLocationId: stock?.location?.id,
              stockQuantity: data.stockQuantity || stock?.quantity || 0,
              status: stock?.status || 'EN_VENTE'
            });
          }
        } catch (error) {
          console.error("Update error:", error);
          return res.status(500).json({ error: "Failed to update device" });
        }

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: 'Error processing your request' });
  }
}
