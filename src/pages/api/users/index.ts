import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { Prisma, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!prisma) {
    return res.status(500).json({ error: 'Database connection not initialized' });
  }

  try {
    // CREATE user
    if (req.method === 'POST') {
      const { firstName, lastName, email, password, telephone, role, address, speciality } = req.body;

      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const hashedPassword = await hash(password, 12);

      // Create user with transaction to ensure both user and role-specific records are created
      const user = await prisma.$transaction(async (tx) => {
        // Create the user first
        const newUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            telephone: telephone || null, // Ensure optional field is handled correctly
            address: address || null, // Handle address field for doctors
            speciality: speciality || null, // Handle speciality field for doctors
            role: role as Role,
            isActive: true,
          },
        });
        
        // If user is a doctor, create a doctor record
        if (newUser.role === 'DOCTOR') {
          console.log('Creating doctor record for user:', newUser.id);
          await tx.doctor.create({
            data: {
              userId: newUser.id,
            },
          });
        }
        
        // If user is a technician, create a technician record
        if (newUser.role === 'EMPLOYEE') {
          console.log('Creating technician record for user:', newUser.id);
          await tx.technician.create({
            data: {
              userId: newUser.id,
              specialty: speciality || null,
            },
          });
        }
        
        return newUser;
      });

      return res.status(201).json({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        telephone: user.telephone || '',
        address: user.address || '',
        speciality: user.speciality || '',
        role: user.role,
        isActive: user.isActive,
      });
    }

    // GET users
    if (req.method === 'GET') {
      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          telephone: true,
          address: true,
          speciality: true,
          role: true,
          isActive: true,
        },
      });

      const transformedUsers = users.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        telephone: user.telephone || '',
        address: user.address || '',
        speciality: user.speciality || '',
        role: user.role,
        isActive: user.isActive,
      }));
      
      return res.status(200).json(transformedUsers);
    }

    // UPDATE user
    if (req.method === 'PUT') {
      const { id, firstName, lastName, email, password, telephone, address, speciality, role, isActive } = req.body;

      if (!id || !firstName || !lastName || !email || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const updateData: Prisma.UserUpdateInput = {
        firstName,
        lastName,
        email,
        telephone: telephone || null, // Ensure optional field is handled correctly
        address: address || null, // Handle address field for doctors
        speciality: speciality || null, // Handle speciality field for doctors
        role: role as Role,
        isActive,
      };

      // Only update password if provided
      if (password) {
        updateData.password = await hash(password, 12);
      }

      // Use transaction to handle role changes and related records
      const user = await prisma.$transaction(async (tx) => {
        // Get current user to check if role has changed
        const currentUser = await tx.user.findUnique({
          where: { id },
          select: { role: true }
        });

        // Update the user
        const updatedUser = await tx.user.update({
          where: { id },
          data: updateData,
        });

        // Handle role changes
        if (currentUser && currentUser.role !== updatedUser.role) {
          console.log(`User role changed from ${currentUser.role} to ${updatedUser.role}`);
          
          // If new role is DOCTOR, create doctor record if it doesn't exist
          if (updatedUser.role === 'DOCTOR') {
            const existingDoctor = await tx.doctor.findUnique({
              where: { userId: updatedUser.id }
            });
            
            if (!existingDoctor) {
              console.log('Creating doctor record for user:', updatedUser.id);
              await tx.doctor.create({
                data: { userId: updatedUser.id }
              });
            }
          }
          
          // If new role is EMPLOYEE, create technician record if it doesn't exist
          if (updatedUser.role === 'EMPLOYEE') {
            const existingTechnician = await tx.technician.findFirst({
              where: { userId: updatedUser.id }
            });
            
            if (!existingTechnician) {
              console.log('Creating technician record for user:', updatedUser.id);
              await tx.technician.create({
                data: {
                  userId: updatedUser.id,
                  specialty: speciality || null
                }
              });
            }
          }
        }
        
        return updatedUser;
      });

      return res.status(200).json({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        telephone: user.telephone || '',
        address: user.address || '',
        speciality: user.speciality || '',
        role: user.role,
        isActive: user.isActive,
      });
    }

    // DELETE user
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing user ID' });
      }

      await prisma.user.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'User deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
    
    console.log('Error in users API:', errorMessage, errorDetails);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }
      if (error.code === 'P2021') {
        return res.status(500).json({ error: 'Database table not found. Did you run prisma migrate?' });
      }
      if (error.code === 'P1001') {
        return res.status(500).json({ error: 'Cannot reach database server. Check your database connection.' });
      }
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}