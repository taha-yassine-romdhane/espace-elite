import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid diagnostic ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get diagnostic result for a specific diagnostic
        const diagnosticResult = await prisma.diagnosticResult.findUnique({
          where: { diagnosticId: id }
        });

        if (!diagnosticResult) {
          return res.status(200).json(null); // Return null if no result exists yet
        }

        return res.status(200).json(diagnosticResult);

      case 'POST':
        // Save or update diagnostic result
        const { iah, idValue, remarque, status } = req.body;

        // Check if this is a valid diagnostic
        const diagnostic = await prisma.diagnostic.findUnique({
          where: { id },
          include: { result: true }
        });

        if (!diagnostic) {
          return res.status(404).json({ error: 'Diagnostic not found' });
        }

        let result;

        if (diagnostic.result) {
          // Update existing result
          result = await prisma.diagnosticResult.update({
            where: { diagnosticId: id },
            data: {
              iah: iah !== undefined ? parseFloat(iah) : null,
              idValue: idValue !== undefined ? parseFloat(idValue) : null,
              remarque,
              status: status || 'NORMAL'
            }
          });
        } else {
          // Create new result
          result = await prisma.diagnosticResult.create({
            data: {
              diagnosticId: id,
              iah: iah !== undefined ? parseFloat(iah) : null,
              idValue: idValue !== undefined ? parseFloat(idValue) : null,
              remarque,
              status: status || 'NORMAL'
            }
          });
        }

        return res.status(200).json(result);

      case 'DELETE':
        // Delete diagnostic result
        const deletedResult = await prisma.diagnosticResult.delete({
          where: { diagnosticId: id }
        }).catch(() => null);

        if (!deletedResult) {
          return res.status(404).json({ error: 'Diagnostic result not found' });
        }

        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
