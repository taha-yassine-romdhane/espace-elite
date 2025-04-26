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

        // Get query parameters
        const { type = 'all', showReserved = 'true' } = req.query;
        
        // Filter medical devices based on type and reservation status
        let filteredMedicalDevices = medicalDevices;
        
        // Filter by device type if specified
        if (type !== 'all' && type !== '') {
          filteredMedicalDevices = filteredMedicalDevices.filter(device => device.type === type);
        }
        
        // Filter out reserved devices if showReserved is false
        if (showReserved === 'false') {
          const now = new Date();
          filteredMedicalDevices = filteredMedicalDevices.filter(device => 
            !device.patientId || 
            !device.reservedUntil || 
            new Date(device.reservedUntil) < now
          );
        }
        
        // Transform medical devices
        const transformedMedicalDevices = filteredMedicalDevices.map(device => {
          // Check if device is currently reserved
          const now = new Date();
          const isReserved = device.patientId && 
                            device.reservedUntil && 
                            new Date(device.reservedUntil) >= now;
          
          return {
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
            installationDate: device.installationDate,
            patientId: device.patientId,
            reservedUntil: device.reservedUntil,
            location: device.location,
            isReserved: isReserved
          };
        });

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
          const { type, parameters, ...data } = req.body;
          console.log('Received data:', { type, parameters, ...data });

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
            
            // If this is a diagnostic device and has parameters, save them separately
            if (type === 'DIAGNOSTIC_DEVICE' && parameters && Array.isArray(parameters) && parameters.length > 0) {
              console.log(`Saving ${parameters.length} parameters for device ID ${newMedicalDevice.id}`);
              
              try {
                // Save parameters using the diagnostic-parameters API
                const parameterResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/diagnostic-parameters`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    // Include the session cookie to maintain authentication
                    'Cookie': req.headers.cookie || '',
                  },
                  body: JSON.stringify({
                    deviceId: newMedicalDevice.id,
                    parameters: parameters
                  }),
                });
                
                if (!parameterResponse.ok) {
                  console.error('Failed to save parameters:', await parameterResponse.text());
                } else {
                  console.log('Parameters saved successfully via API');
                }
              } catch (paramError) {
                console.error('Error saving parameters via API:', paramError);
                // Continue execution even if parameter saving fails
              }
            }

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
        const { id, parameters, ...updateData } = req.body;

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
          
          // If this is a diagnostic device and has parameters, update them separately
          if (existingMedicalDevice.type === 'DIAGNOSTIC_DEVICE' && parameters && Array.isArray(parameters) && parameters.length > 0) {
            console.log(`Updating ${parameters.length} parameters for device ID ${id}`);
            
            try {
              // Save parameters using the diagnostic-parameters API
              const parameterResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/diagnostic-parameters`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  // Include the session cookie to maintain authentication
                  'Cookie': req.headers.cookie || '',
                },
                body: JSON.stringify({
                  deviceId: id,
                  parameters: parameters
                }),
              });
              
              if (!parameterResponse.ok) {
                console.error('Failed to update parameters:', await parameterResponse.text());
              } else {
                console.log('Parameters updated successfully via API');
              }
            } catch (paramError) {
              console.error('Error updating parameters via API:', paramError);
              // Continue execution even if parameter updating fails
            }
          }

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
