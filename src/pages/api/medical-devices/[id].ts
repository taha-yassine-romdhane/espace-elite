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
          sellingPrice: product.sellingPrice,
          stockLocation: product.stocks[0]?.location.name || 'Non assigné',
          stockLocationId: product.stocks[0]?.location.id,
          stockQuantity: product.stocks.reduce((acc, stock) => acc + stock.quantity, 0),
          status: product.stocks[0]?.status || 'EN_VENTE'
        });

      case 'PUT':
        try {
          console.log("Received PUT request for ID:", id);
          console.log("Request body:", JSON.stringify(req.body, null, 2));
          
          const { type, ...data } = req.body;
          console.log("Extracted type:", type);
          console.log("Updating device:", id, JSON.stringify(data, null, 2));

          if (!id) {
            return res.status(400).json({ error: 'ID is required' });
          }

          if (type === 'MEDICAL_DEVICE' || type === 'DIAGNOSTIC_DEVICE') {
            // Handle parameters for diagnostic devices
            let parametersData = {};
            if (type === 'DIAGNOSTIC_DEVICE' && data.parameters && Array.isArray(data.parameters)) {
              console.log('Processing parameters for diagnostic device:', data.parameters);
              
              try {
                // First delete any parameter values that reference these parameters
                // Find the parameters to get their IDs
                const existingParameters = await prisma.diagnosticParameter.findMany({
                  where: { deviceId: id as string },
                  select: { id: true }
                });
                
                const parameterIds = existingParameters.map(param => param.id);
                
                if (parameterIds.length > 0) {
                  // Delete parameter values first
                  console.log('Deleting parameter values for parameters:', parameterIds);
                  await prisma.parameterValue.deleteMany({
                    where: { parameterId: { in: parameterIds } }
                  });
                }
                
                // Now it's safe to delete the parameters
                console.log('Deleting parameters for device:', id);
                await prisma.diagnosticParameter.deleteMany({
                  where: { deviceId: id as string }
                });
              } catch (deleteError) {
                console.error('Error deleting parameters:', deleteError);
                // Continue with the update even if parameter deletion fails
              }
              
              try {
                // Create new parameters
                parametersData = {
                  parameters: {
                    create: data.parameters.map((param: any) => ({
                      title: param.name || param.title || 'Parameter',
                      type: param.type || 'INPUT',
                      unit: param.unit,
                      isRequired: param.isRequired || false,
                      isAutomatic: false
                    }))
                  }
                };
                console.log('Parameters data prepared:', JSON.stringify(parametersData, null, 2));
              } catch (paramError) {
                console.error('Error processing parameters:', paramError);
                // Continue without parameters if there's an error
                parametersData = {};
              }
              
              // Remove parameters from main data object
              delete data.parameters;
            }
            
            console.log('About to update device with ID:', id);
            console.log('Update data:', {
              name: data.name,
              brand: data.brand,
              model: data.model,
              serialNumber: data.serialNumber,
              purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
              sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
              parametersData
            });
            
            try {
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
                  stockQuantity: data.stockQuantity || 1,
                  ...parametersData
                },
                include: {
                  stockLocation: true,
                  parameters: true
                }
              });
              
              console.log('Device updated successfully:', updatedDevice.id);
              
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
                parameters: updatedDevice.parameters || [],
                status: updatedDevice.status,
                configuration: updatedDevice.configuration
              });
            } catch (updateError) {
              console.error('Error updating device:', updateError);
              return res.status(500).json({ error: 'Failed to update device' });
            }
          } else {
            // Update product
            try {
              // First, find the existing stock if any
              const existingStock = await prisma.stock.findFirst({
                where: {
                  productId: id as string,
                  locationId: data.stockLocationId
                }
              });

              const updatedProduct = await prisma.product.update({
                where: { id: id as string },
                data: {
                  name: data.name,
                  brand: data.brand || null,
                  model: data.model || null,
                  serialNumber: data.serialNumber || null,
                  purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice.toString()) : null,
                  sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice.toString()) : null,
                  type: data.type,
                  status: data.status === 'EN_VENTE' ? 'ACTIVE' : 
                         data.status === 'EN_REPARATION' ? 'MAINTENANCE' : 
                         data.status === 'HORS_SERVICE' ? 'RETIRED' : 'ACTIVE',
                  ...(data.stockLocationId ? {
                    stocks: {
                      upsert: {
                        where: {
                          id: existingStock?.id || 'new'
                        },
                        create: {
                          quantity: parseInt(data.stockQuantity?.toString() || '1'),
                          status: data.status || 'EN_VENTE',
                          location: {
                            connect: { id: data.stockLocationId }
                          }
                        },
                        update: {
                          quantity: parseInt(data.stockQuantity?.toString() || '1'),
                          status: data.status || 'EN_VENTE'
                        }
                      }
                    }
                  } : {})
                },
                include: {
                  stocks: {
                    include: {
                      location: true
                    }
                  }
                }
              });

              // Map the status back to the frontend format
              const mappedStatus = updatedProduct.status === 'ACTIVE' ? 'EN_VENTE' :
                                 updatedProduct.status === 'MAINTENANCE' ? 'EN_REPARATION' :
                                 updatedProduct.status === 'RETIRED' ? 'HORS_SERVICE' : 'EN_VENTE';

              return res.status(200).json({
                id: updatedProduct.id,
                name: updatedProduct.name,
                type: updatedProduct.type,
                brand: updatedProduct.brand,
                model: updatedProduct.model,
                serialNumber: updatedProduct.serialNumber,
                purchasePrice: updatedProduct.purchasePrice,
                sellingPrice: updatedProduct.sellingPrice,
                stockLocation: updatedProduct.stocks[0]?.location?.name || 'Non assigné',
                stockLocationId: updatedProduct.stocks[0]?.location?.id,
                stockQuantity: updatedProduct.stocks[0]?.quantity || 0,
                status: mappedStatus
              });
            } catch (error) {
              console.error("Product update error:", error);
              return res.status(500).json({ error: "Failed to update product" });
            }
          }
        } catch (error) {
          console.error("Update error:", error);
          return res.status(500).json({ error: "Failed to update device" });
        }
        break;

      case 'DELETE':
        try {
          // First check if it's a medical device
          const device = await prisma.medicalDevice.findUnique({
            where: { id: id as string },
            include: {
              Diagnostic: true,
              Rental: true,
            },
          });

          if (device) {
            // Check if the device has any related records
            if (device.Diagnostic.length > 0 || device.Rental.length > 0) {
              return res.status(400).json({
                error: 'Cannot delete device with existing diagnostics or rentals'
              });
            }

            // Delete the medical device
            await prisma.medicalDevice.delete({
              where: { id: id as string },
            });

            return res.status(200).json({ message: 'Medical device deleted successfully' });
          }

          // If not a medical device, check if it's a product (accessory or spare part)
          const product = await prisma.product.findUnique({
            where: { id: id as string },
            include: {
              stocks: true,
              transfers: true
            }
          });

          if (!product) {
            return res.status(404).json({ error: 'Product not found' });
          }

          // Delete related stocks first
          if (product.stocks.length > 0) {
            await prisma.stock.deleteMany({
              where: { productId: id as string }
            });
          }

          // Delete related transfers
          if (product.transfers.length > 0) {
            await prisma.stockTransfer.deleteMany({
              where: { productId: id as string }
            });
          }

          // Delete the product
          await prisma.product.delete({
            where: { id: id as string }
          });

          return res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error) {
          console.error('Error deleting device/product:', error);
          return res.status(500).json({ error: 'Error deleting device/product' });
        }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: 'Error processing your request' });
  }
}
