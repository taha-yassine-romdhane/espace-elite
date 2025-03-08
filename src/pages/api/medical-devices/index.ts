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

  try {
    switch (req.method) {
      case 'GET':
        // Fetch both medical devices and regular products
        const [medicalDevices, products] = await Promise.all([
          prisma.medicalDevice.findMany({
            include: {
              stockLocation: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                }
              }
            }
          }),
          prisma.product.findMany({
            where: {
              type: {
                in: ['ACCESSORY', 'SPARE_PART']
              }
            },
            include: {
              stocks: {
                include: {
                  location: true
                }
              }
            }
          })
        ]);

        // Transform medical devices
        const transformedMedicalDevices = medicalDevices.map(device => ({
          id: device.id,
          name: device.name,
          type: device.type,
          brand: device.brand,
          model: device.model,
          serialNumber: device.serialNumber,
          purchasePrice: device.purchasePrice,
          sellingPrice: device.sellingPrice,
          technicalSpecs: device.technicalSpecs,
          availableForRent: device.availableForRent,
          requiresMaintenance: device.requiresMaintenance,
          stockLocation: device.stockLocation,
          stockLocationId: device.stockLocationId,
          stockQuantity: device.stockQuantity || 1, // Default to 1 if not specified
          status: device.status,
          configuration: device.configuration,
          installationDate: device.installationDate
        }));

        // Transform products
        const transformedProducts = products.map(product => ({
          id: product.id,
          name: product.name,
          type: product.type,
          brand: product.brand,
          model: product.model,
          serialNumber: product.serialNumber,
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice,
          technicalSpecs: null,
          stockLocation: product.stocks[0]?.location.name || 'Non assigné',
          stockLocationId: product.stocks[0]?.location.id,
          stockQuantity: product.stocks.reduce((acc, stock) => acc + stock.quantity, 0),
          status: product.stocks[0]?.status || 'EN_VENTE'
        }));

        // Combine both types of products
        return res.status(200).json([...transformedMedicalDevices, ...transformedProducts]);

      case 'POST':
        try {
          const { type, ...data } = req.body;
          console.log('Received data:', { type, ...data });

          // Handle medical devices
          if (type === 'MEDICAL_DEVICE' || type === 'DIAGNOSTIC_DEVICE') {
            const newMedicalDevice = await prisma.medicalDevice.create({
              data: {
                name: data.name,
                type: type,
                brand: data.brand,
                model: data.model,
                serialNumber: data.serialNumber,
                purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
                sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
                technicalSpecs: data.technicalSpecs,
                availableForRent: data.availableForRent || false,
                requiresMaintenance: data.requiresMaintenance || false,
                configuration: data.configuration,
                status: 'ACTIVE',
                stockLocationId: data.stockLocationId,
                stockQuantity: data.stockQuantity ? parseInt(data.stockQuantity) : 1,
              },
              include: {
                stockLocation: true
              }
            });

            return res.status(201).json({
              id: newMedicalDevice.id,
              name: newMedicalDevice.name,
              type: newMedicalDevice.type,
              brand: newMedicalDevice.brand,
              model: newMedicalDevice.model,
              serialNumber: newMedicalDevice.serialNumber,
              purchasePrice: newMedicalDevice.purchasePrice,
              sellingPrice: newMedicalDevice.sellingPrice,
              technicalSpecs: newMedicalDevice.technicalSpecs,
              availableForRent: newMedicalDevice.availableForRent,
              requiresMaintenance: newMedicalDevice.requiresMaintenance,
              stockLocation: newMedicalDevice.stockLocation,
              stockLocationId: newMedicalDevice.stockLocationId,
              stockQuantity: newMedicalDevice.stockQuantity,
              status: newMedicalDevice.status,
              configuration: newMedicalDevice.configuration
            });
          }
          // Handle accessories and spare parts
          else {
            // First, create the product
            const newProduct = await prisma.product.create({
              data: {
                name: data.name,
                type: type,
                brand: data.brand || null,
                model: data.model || null,
                serialNumber: data.serialNumber || null,
                purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice.toString()) : null,
                sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice.toString()) : null,
              },
            });

            // Then, create the stock entry
            const stock = await prisma.stock.create({
              data: {
                product: {
                  connect: {
                    id: newProduct.id
                  }
                },
                location: {
                  connect: {
                    id: data.stockLocationId
                  }
                },
                quantity: parseInt(data.stockQuantity.toString()),
                status: 'EN_VENTE'
              },
              include: {
                location: true
              }
            });

            return res.status(201).json({
              id: newProduct.id,
              name: newProduct.name,
              type: newProduct.type,
              brand: newProduct.brand,
              model: newProduct.model,
              serialNumber: newProduct.serialNumber,
              purchasePrice: newProduct.purchasePrice,
              sellingPrice: newProduct.sellingPrice,
              stockLocation: stock.location.name,
              stockLocationId: stock.location.id,
              stockQuantity: stock.quantity,
              status: stock.status
            });
          }
        } catch (error) {
          console.error('Error creating product:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

      case 'PUT':
        const { id, ...updateData } = req.body;

        // Check if it's a medical device
        const existingMedicalDevice = await prisma.medicalDevice.findUnique({
          where: { id }
        });

        if (existingMedicalDevice) {
          const updatedMedicalDevice = await prisma.medicalDevice.update({
            where: { id },
            data: {
              name: updateData.name,
              brand: updateData.brand,
              model: updateData.model,
              serialNumber: updateData.serialNumber,
              purchasePrice: updateData.purchasePrice ? parseFloat(updateData.purchasePrice) : null,
              sellingPrice: updateData.sellingPrice ? parseFloat(updateData.sellingPrice) : null,
              technicalSpecs: updateData.technicalSpecs,
              availableForRent: updateData.availableForRent,
              requiresMaintenance: updateData.requiresMaintenance,
              configuration: updateData.specifications,
              status: updateData.status || 'ACTIVE',
              stockLocationId: updateData.stockLocation,
              stockQuantity: updateData.stockQuantity ? parseInt(updateData.stockQuantity) : 1,
            },
            include: {
              stockLocation: true
            }
          });

          return res.status(200).json({
            id: updatedMedicalDevice.id,
            name: updatedMedicalDevice.name,
            type: updatedMedicalDevice.type,
            brand: updatedMedicalDevice.brand,
            model: updatedMedicalDevice.model,
            serialNumber: updatedMedicalDevice.serialNumber,
            purchasePrice: updatedMedicalDevice.purchasePrice,
            sellingPrice: updatedMedicalDevice.sellingPrice,
            technicalSpecs: updatedMedicalDevice.technicalSpecs,
            availableForRent: updatedMedicalDevice.availableForRent,
            requiresMaintenance: updatedMedicalDevice.requiresMaintenance,
            stockLocation: updatedMedicalDevice.stockLocation,
            stockLocationId: updatedMedicalDevice.stockLocationId,
            stockQuantity: updatedMedicalDevice.stockQuantity,
            status: updatedMedicalDevice.status
          });
        }
        
        // Handle regular product update
        else {
          const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
              name: updateData.name,
              brand: updateData.brand,
              serialNumber: updateData.serialNumber,
              purchasePrice: updateData.purchasePrice ? parseFloat(updateData.purchasePrice) : null,
              sellingPrice: updateData.sellingPrice ? parseFloat(updateData.sellingPrice) : null,
            },
          });

          // Update stock
          const updatedStock = await prisma.stock.updateMany({
            where: {
              productId: id,
              locationId: updateData.stockLocation
            },
            data: {
              quantity: parseInt(updateData.stockQuantity)
            }
          });

          const stock = await prisma.stock.findFirst({
            where: {
              productId: id,
              locationId: updateData.stockLocation
            },
            include: {
              location: true
            }
          });

          return res.status(200).json({
            id: updatedProduct.id,
            name: updatedProduct.name,
            type: updatedProduct.type,
            brand: updatedProduct.brand,
            serialNumber: updatedProduct.serialNumber,
            purchasePrice: updatedProduct.purchasePrice,
            sellingPrice: null,
            technicalSpecs: null,
            stockLocation: stock?.location.name || 'Non assigné',
            stockLocationId: stock?.location.id,
            stockQuantity: stock?.quantity || 0,
            status: stock?.status || 'EN_VENTE'
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
