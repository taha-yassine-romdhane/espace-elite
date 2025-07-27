import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET':
        return handleGetAppointments(req, res);
      case 'POST':
        return handleCreateAppointment(req, res, session);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function handleGetAppointments(req: NextApiRequest, res: NextApiResponse) {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telephone: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
            telephone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    // Transform the data for frontend consumption
    const transformedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      appointmentType: appointment.appointmentType,
      scheduledDate: appointment.scheduledDate,
      duration: appointment.duration || 60,
      location: appointment.location,
      notes: appointment.notes,
      priority: appointment.priority || 'NORMAL',
      status: appointment.status || 'SCHEDULED',
      
      // Client information
      patient: appointment.patient ? {
        id: appointment.patient.id,
        firstName: appointment.patient.firstName,
        lastName: appointment.patient.lastName,
        telephone: appointment.patient.telephone,
      } : null,
      
      company: appointment.company ? {
        id: appointment.company.id,
        companyName: appointment.company.companyName,
        telephone: appointment.company.telephone,
      } : null,
      
      // Staff information
      assignedTo: appointment.assignedTo ? {
        id: appointment.assignedTo.id,
        firstName: appointment.assignedTo.firstName,
        lastName: appointment.assignedTo.lastName,
        fullName: `${appointment.assignedTo.firstName} ${appointment.assignedTo.lastName}`,
      } : null,
      
      createdBy: appointment.createdBy ? {
        id: appointment.createdBy.id,
        firstName: appointment.createdBy.firstName,
        lastName: appointment.createdBy.lastName,
        fullName: `${appointment.createdBy.firstName} ${appointment.createdBy.lastName}`,
      } : null,
      
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    }));

    return res.status(200).json({ 
      appointments: transformedAppointments,
      total: transformedAppointments.length 
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}

async function handleCreateAppointment(
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: any
) {
  try {
    const {
      patientId,
      companyId,
      appointmentType,
      scheduledDate,
      duration,
      location,
      notes,
      priority,
      status,
      assignedToId,
    } = req.body;

    // Validation
    if (!appointmentType || !scheduledDate || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields: appointmentType, scheduledDate, location' 
      });
    }

    if (!patientId && !companyId) {
      return res.status(400).json({ 
        error: 'Either patientId or companyId must be provided' 
      });
    }

    // Check if patient or company exists
    if (patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
    }

    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
    }

    // Check if assigned user exists
    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId }
      });
      if (!assignedUser) {
        return res.status(404).json({ error: 'Assigned user not found' });
      }
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointmentType,
        scheduledDate: new Date(scheduledDate),
        duration: duration || 60,
        location,
        notes: notes || null,
        priority: priority || 'NORMAL',
        status: status || 'SCHEDULED',
        patientId: patientId || null,
        companyId: companyId || null,
        assignedToId: assignedToId || null,
        createdById: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telephone: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
            telephone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return res.status(201).json({ 
      appointment,
      message: 'Appointment created successfully' 
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ error: 'Failed to create appointment' });
  }
}