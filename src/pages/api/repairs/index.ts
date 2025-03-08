import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { 
        medicalDeviceId, 
        notes, 
        locationId, 
        employeeId, 
        repairCost, 
        repairDate,
        spareParts,
        deviceStatus
      } = req.body;

      // First find or create the technician record for this employee
      let technician = await prisma.technician.findFirst({
        where: {
          userId: employeeId
        }
      });

      if (!technician) {
        technician = await prisma.technician.create({
          data: {
            user: {
              connect: {
                id: employeeId
              }
            }
          }
        });
      }

      // Create the repair log with spare parts
      const repair = await prisma.$transaction(async (tx) => {
        // Update device status
        await tx.medicalDevice.update({
          where: {
            id: medicalDeviceId
          },
          data: {
            status: deviceStatus
          }
        });

        // Create repair log
        return await tx.repairLog.create({
          data: {
            notes,
            repairCost: new Prisma.Decimal(repairCost),
            repairDate: new Date(repairDate),
            medicalDevice: {
              connect: {
                id: medicalDeviceId
              }
            },
            location: {
              connect: {
                id: locationId
              }
            },
            technician: {
              connect: {
                id: technician.id
              }
            },
            // Add spare parts if any
            spareParts: spareParts?.length > 0 ? {
              create: spareParts.map((part: { id: string; quantity: number }) => ({
                product: {
                  connect: {
                    id: part.id
                  }
                },
                quantity: part.quantity
              }))
            } : undefined
          },
          include: {
            medicalDevice: true,
            location: true,
            technician: {
              include: {
                user: true
              }
            },
            spareParts: {
              include: {
                product: true
              }
            }
          }
        });
      });

      // Update the stock quantities for used spare parts
      if (spareParts?.length > 0) {
        for (const part of spareParts) {
          // Get current stock
          const currentStock = await prisma.stock.findFirst({
            where: {
              productId: part.id
            }
          });

          if (currentStock) {
            // Update stock quantity
            await prisma.stock.update({
              where: {
                id: currentStock.id
              },
              data: {
                quantity: currentStock.quantity - part.quantity
              }
            });
          }
        }
      }

      return res.status(201).json(repair);
    } catch (error) {
      console.error('Error creating repair:', error);
      return res.status(500).json({ error: 'Failed to create repair record' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { medicalDeviceId } = req.query;

      const repairs = await prisma.repairLog.findMany({
        where: medicalDeviceId ? {
          medicalDeviceId: medicalDeviceId as string
        } : {},
        include: {
          medicalDevice: true,
          location: true,
          technician: {
            include: {
              user: true
            }
          },
          spareParts: {
            include: {
              product: true
            }
          }
        },
        orderBy: {
          repairDate: 'desc',
        },
      });
      return res.status(200).json(repairs);
    } catch (error) {
      console.error('Error fetching repairs:', error);
      return res.status(500).json({ error: 'Failed to fetch repairs' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
