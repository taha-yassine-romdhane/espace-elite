import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
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
        // Get query parameters first
        const { type = 'all', showReserved = 'true', assignedToMe = 'false' } = req.query;
        
        // Build the medical device query based on employee restrictions
        const medicalDeviceQuery: any = {
          include: {
            stockLocation: true,
            Patient: true,
          },
        };

        // If employee wants only assigned devices, filter by their stock location
        if (assignedToMe === 'true') {
          // Get the user's stock location first
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { stockLocation: true }
          });

          console.log('Employee medical devices filter - User:', {
            userId: session.user.id,
            hasStockLocation: !!user?.stockLocation,
            stockLocationId: user?.stockLocation?.id,
            stockLocationName: user?.stockLocation?.name
          });

          if (user?.stockLocation) {
            medicalDeviceQuery.where = {
              stockLocationId: user.stockLocation.id
            };
            console.log('Filtering devices by stockLocationId:', user.stockLocation.id);
          } else {
            // If user has no stock location, return empty array
            medicalDeviceQuery.where = {
              id: 'non-existent-id' // This will return no results
            };
            console.log('User has no stock location, returning empty results');
          }
        }

        // Fetch both medical devices and regular products
        const [medicalDevices, products] = await Promise.all([
          prisma.medicalDevice.findMany(medicalDeviceQuery),
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

        if (assignedToMe === 'true') {
          console.log('Medical devices found for employee:', {
            totalDevices: medicalDevices.length,
            devices: medicalDevices.map(d => ({
              id: d.id,
              name: d.name,
              type: d.type,
              stockLocationId: d.stockLocationId,
              stockLocationName: (d as any).stockLocation?.name
            }))
          });
        }
        
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
            deviceCode: device.deviceCode,
            name: device.name,
            type: device.type,
            brand: device.brand,
            model: device.model,
            serialNumber: device.serialNumber,
            rentalPrice: device.rentalPrice,
            purchasePrice: device.purchasePrice,
            sellingPrice: device.sellingPrice,
            technicalSpecs: device.technicalSpecs,
            destination: device.destination,
            stockLocation: (device as any).stockLocation,
            stockLocationId: device.stockLocationId,
            stockQuantity: device.stockQuantity || 1, // Default to 1 if not specified
            status: device.status,
            configuration: device.configuration,
            installationDate: device.installationDate,
            patientId: device.patientId,
            reservedUntil: device.reservedUntil,
            location: device.location,
            isReserved: isReserved,
            patient: (device as any).Patient
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
          status: product.status, // Use product's own status
          stocks: product.stocks // Include the full stocks array
        }));

        // Combine both types of products
        return res.status(200).json([...transformedMedicalDevices, ...transformedProducts]);

      case 'POST':
        try {
          const { type, parameters, ...data } = req.body;
          console.log('Received data:', { type, parameters, ...data });

          // Handle medical devices
          if (type === 'MEDICAL_DEVICE' || type === 'DIAGNOSTIC_DEVICE') {
            // Generate device code if not provided
            let deviceCode = data.deviceCode;

            if (!deviceCode) {
              if (type === 'DIAGNOSTIC_DEVICE') {
                // Generate APP-DIAG-01, APP-DIAG-02, etc. for diagnostic devices
                const lastDiagDevice = await prisma.medicalDevice.findFirst({
                  where: {
                    deviceCode: {
                      startsWith: 'APP-DIAG-'
                    }
                  },
                  orderBy: {
                    deviceCode: 'desc'
                  }
                });

                deviceCode = 'APP-DIAG-01';
                if (lastDiagDevice && lastDiagDevice.deviceCode) {
                  const lastNumber = parseInt(lastDiagDevice.deviceCode.replace('APP-DIAG-', ''));
                  if (!isNaN(lastNumber)) {
                    deviceCode = `APP-DIAG-${String(lastNumber + 1).padStart(2, '0')}`;
                  }
                }
              } else {
                // Generate APP0001, APP0002, etc. for regular medical devices
                const lastDevice = await prisma.medicalDevice.findFirst({
                  where: {
                    deviceCode: {
                      startsWith: 'APP',
                      not: {
                        startsWith: 'APP-DIAG-'
                      }
                    }
                  },
                  orderBy: {
                    deviceCode: 'desc'
                  }
                });

                deviceCode = 'APP0001';
                if (lastDevice && lastDevice.deviceCode) {
                  const lastNumber = parseInt(lastDevice.deviceCode.replace('APP', ''));
                  if (!isNaN(lastNumber)) {
                    deviceCode = `APP${String(lastNumber + 1).padStart(4, '0')}`;
                  }
                }
              }
            }

            const newMedicalDevice = await prisma.medicalDevice.create({
              data: {
                deviceCode: deviceCode,
                name: data.name,
                type: type,
                brand: data.brand,
                model: data.model,
                serialNumber: data.serialNumber,
                rentalPrice: data.rentalPrice ? parseFloat(data.rentalPrice) : null,
                purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
                sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
                technicalSpecs: data.technicalSpecs,
                destination: data.destination || 'FOR_SALE',
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
              deviceCode: newMedicalDevice.deviceCode,
              name: newMedicalDevice.name,
              type: newMedicalDevice.type,
              brand: newMedicalDevice.brand,
              model: newMedicalDevice.model,
              serialNumber: newMedicalDevice.serialNumber,
              purchasePrice: newMedicalDevice.purchasePrice,
              sellingPrice: newMedicalDevice.sellingPrice,
              technicalSpecs: newMedicalDevice.technicalSpecs,
              destination: newMedicalDevice.destination,
              rentalPrice: newMedicalDevice.rentalPrice,
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

            // Handle multiple stock locations
            const stockLocations = data.stockLocations || [];

            // Create stock entries for all locations
            const createdStocks = await Promise.all(
              stockLocations.map((stockLoc: any) =>
                prisma.stock.create({
                  data: {
                    productId: newProduct.id,
                    locationId: stockLoc.locationId,
                    quantity: parseInt(stockLoc.quantity.toString()),
                    status: stockLoc.status || 'FOR_SALE'
                  },
                  include: {
                    location: true
                  }
                })
              )
            );

            return res.status(201).json({
              id: newProduct.id,
              name: newProduct.name,
              type: newProduct.type,
              brand: newProduct.brand,
              model: newProduct.model,
              serialNumber: newProduct.serialNumber,
              purchasePrice: newProduct.purchasePrice,
              sellingPrice: newProduct.sellingPrice,
              warrantyExpiration: newProduct.warrantyExpiration,
              stocks: createdStocks,
              status: newProduct.status
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
              rentalPrice: updateData.rentalPrice ? parseFloat(updateData.rentalPrice.toString()) : null,
              purchasePrice: updateData.purchasePrice ? parseFloat(updateData.purchasePrice.toString()) : null,
              sellingPrice: updateData.sellingPrice ? parseFloat(updateData.sellingPrice.toString()) : null,
              technicalSpecs: updateData.technicalSpecs,
              destination: updateData.destination || 'FOR_SALE',
              configuration: updateData.configuration || updateData.specifications,
              status: updateData.status || 'ACTIVE',
              stockLocationId: updateData.stockLocationId || updateData.stockLocation,
              stockQuantity: updateData.stockQuantity ? parseInt(updateData.stockQuantity.toString()) : 1,
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
            rentalPrice: updatedMedicalDevice.rentalPrice,
            purchasePrice: updatedMedicalDevice.purchasePrice,
            sellingPrice: updatedMedicalDevice.sellingPrice,
            technicalSpecs: updatedMedicalDevice.technicalSpecs,
            destination: updatedMedicalDevice.destination,
            stockLocation: updatedMedicalDevice.stockLocation,
            stockLocationId: updatedMedicalDevice.stockLocationId,
            stockQuantity: updatedMedicalDevice.stockQuantity,
            status: updatedMedicalDevice.status
          });
        }
        
        // Handle regular product update
        else {
          // Update product metadata
          const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
              name: updateData.name,
              brand: updateData.brand,
              model: updateData.model,
              serialNumber: updateData.serialNumber,
              purchasePrice: updateData.purchasePrice ? parseFloat(updateData.purchasePrice) : null,
              sellingPrice: updateData.sellingPrice ? parseFloat(updateData.sellingPrice) : null,
              warrantyExpiration: updateData.warrantyExpiration ? new Date(updateData.warrantyExpiration) : null,
            },
          });

          // Handle stock locations update if provided
          if (updateData.stockLocations && Array.isArray(updateData.stockLocations)) {
            // Get existing stocks for this product
            const existingStocks = await prisma.stock.findMany({
              where: { productId: id }
            });

            const existingLocationIds = new Set(existingStocks.map(s => s.locationId));
            const newLocationIds = new Set(updateData.stockLocations.map((sl: any) => sl.locationId));

            // Delete stocks that are no longer in the list
            const toDelete = existingStocks.filter(s => !newLocationIds.has(s.locationId));
            await Promise.all(
              toDelete.map(stock =>
                prisma.stock.delete({ where: { id: stock.id } })
              )
            );

            // Update or create stocks
            await Promise.all(
              updateData.stockLocations.map(async (stockLoc: any) => {
                const existing = existingStocks.find(s => s.locationId === stockLoc.locationId);

                if (existing) {
                  // Update existing stock
                  return prisma.stock.update({
                    where: { id: existing.id },
                    data: {
                      quantity: parseInt(stockLoc.quantity.toString()),
                      status: stockLoc.status || 'FOR_SALE'
                    }
                  });
                } else {
                  // Create new stock
                  return prisma.stock.create({
                    data: {
                      productId: id,
                      locationId: stockLoc.locationId,
                      quantity: parseInt(stockLoc.quantity.toString()),
                      status: stockLoc.status || 'FOR_SALE'
                    }
                  });
                }
              })
            );
          }

          // Fetch updated product with stocks
          const productWithStocks = await prisma.product.findUnique({
            where: { id },
            include: {
              stocks: {
                include: {
                  location: true
                }
              }
            }
          });

          return res.status(200).json({
            id: productWithStocks!.id,
            name: productWithStocks!.name,
            type: productWithStocks!.type,
            brand: productWithStocks!.brand,
            model: productWithStocks!.model,
            serialNumber: productWithStocks!.serialNumber,
            purchasePrice: productWithStocks!.purchasePrice,
            sellingPrice: productWithStocks!.sellingPrice,
            technicalSpecs: null,
            stocks: productWithStocks!.stocks,
            status: productWithStocks!.status
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'unknown field';
      return res.status(409).json({ 
        error: `Duplicate value for ${field}`, 
        field,
        code: 'P2002'
      });
    }
    
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}