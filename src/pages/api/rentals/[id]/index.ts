import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get rental ID from request
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid rental ID' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle GET request to fetch a single rental
  if (req.method === 'GET') {
    try {
      // Fetch rental with all related data
      const rental = await prisma.rental.findUnique({
        where: {
          id: id,
        },
        include: {
          medicalDevice: true,
          patient: true,
          Company: true,
          payment: {
            include: {
              paymentDetails: true,
            },
          },
        },
      });

      if (!rental) {
        return res.status(404).json({ error: 'Rental not found' });
      }

      // Return the rental data
      return res.status(200).json({ rental });
    } catch (error) {
      console.error('Error fetching rental:', error);
      return res.status(500).json({ error: 'Failed to fetch rental' });
    }
  }

  // Return 405 for other methods
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
