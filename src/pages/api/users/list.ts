import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get role filter from query params
    const { role } = req.query;

    // Authorization logic
    const isAdmin = session.user.role === 'ADMIN';
    const isEmployeeQueryingDoctors = session.user.role === 'EMPLOYEE' && role === 'DOCTOR';

    // Only admins can see all users, employees can only query doctors
    if (!isAdmin && !isEmployeeQueryingDoctors) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Build where clause based on role filter and permissions
    const whereClause: any = {
      isActive: true
    };

    if (role === 'DOCTOR' && isEmployeeQueryingDoctors) {
      // Employee querying doctors
      whereClause.role = 'DOCTOR';
    } else if (isAdmin) {
      // Admin can filter by role or see all
      if (role) {
        whereClause.role = role;
      } else {
        whereClause.role = {
          in: ['ADMIN', 'EMPLOYEE']
        };
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' }
      ]
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role
    }));

    return res.status(200).json({ users: formattedUsers });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}