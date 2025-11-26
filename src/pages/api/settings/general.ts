import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { z } from 'zod';

// Validation schema for settings update
const updateSettingsSchema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
  companyAddress: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  companyPhone: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères"),
  companyEmail: z.string().email("Email invalide"),
  companyLogo: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET request - retrieve settings (public, accessible to everyone)
  if (req.method === 'GET') {
    try {
      // Get the first settings record or create one if it doesn't exist
      let settings = await prisma.appSettings.findFirst();

      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.appSettings.create({
          data: {
            companyName: "Elite medicale",
            companyAddress: "123 Rue de la Santé, Tunis, Tunisie",
            companyPhone: "+216 71 123 456",
            companyEmail: "contact@elite-medicale.tn",
            companyLogo: null, // No default logo - admin must upload via /uploads-public/
          }
        });
      }

      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  // PUT request - update settings (admin only)
  if (req.method === 'PUT') {
    // Authentication check for write operations
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin (case-insensitive)
    if (session.user.role?.toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    try {
      // Validate request body
      const validationResult = updateSettingsSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.errors
        });
      }

      const { companyName, companyAddress, companyPhone, companyEmail, companyLogo } = validationResult.data;

      // Find the first settings record
      const existingSettings = await prisma.appSettings.findFirst();

      let settings;

      if (existingSettings) {
        // Update existing settings
        settings = await prisma.appSettings.update({
          where: { id: existingSettings.id },
          data: {
            companyName,
            companyAddress,
            companyPhone,
            companyEmail,
            companyLogo: companyLogo || existingSettings.companyLogo,
          }
        });
      } else {
        // Create new settings if none exist
        settings = await prisma.appSettings.create({
          data: {
            companyName,
            companyAddress,
            companyPhone,
            companyEmail,
            companyLogo: companyLogo || null,
          }
        });
      }

      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  // Return 405 for other methods
  return res.status(405).json({ error: 'Method not allowed' });
}
