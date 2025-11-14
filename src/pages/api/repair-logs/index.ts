import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const repairLogs = await prisma.repairLog.findMany({
        orderBy: {
          repairDate: 'desc'
        },
        include: {
          location: {
            select: {
              name: true,
              type: true
            }
          },
          medicalDevice: {
            select: {
              deviceCode: true,
              name: true,
              type: true
            }
          },
          technician: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          spareParts: {
            include: {
              product: {
                select: {
                  productCode: true,
                  name: true,
                  sellingPrice: true
                }
              }
            }
          }
        }
      });

      return res.status(200).json(repairLogs);
    } catch (error) {
      console.error('Error fetching repair logs:', error);
      return res.status(500).json({ error: 'Failed to fetch repair logs' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
