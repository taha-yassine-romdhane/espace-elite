import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Product } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!prisma) {
    return res.status(500).json({ error: 'Database connection not initialized' });
  }

  try {
    // CREATE product
    if (req.method === 'POST') {
      const { nom, type, marque, stock, ns, prixAchat, status, montantReparation, pieceRechange } = req.body;

      if (!nom || !type || !marque || !stock) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const product = await prisma.product.create({
        data: {
          nom,
          type,
          marque,
          stock,
          ns,
          prixAchat: prixAchat ? parseFloat(prixAchat) : null,
          status,
          montantReparation: montantReparation ? parseFloat(montantReparation) : null,
          pieceRechange,
        },
      });

      return res.status(201).json(product);
    }

    // GET products
    if (req.method === 'GET') {
      const products = await prisma.product.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(products);
    }

    // UPDATE product
    if (req.method === 'PUT') {
      const { id, nom, type, marque, stock, ns, prixAchat, status, montantReparation, pieceRechange } = req.body;

      if (!id || !nom || !type || !marque || !stock) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          nom,
          type,
          marque,
          stock,
          ns,
          prixAchat: prixAchat ? parseFloat(prixAchat) : null,
          status,
          montantReparation: montantReparation ? parseFloat(montantReparation) : null,
          pieceRechange,
        },
      });

      return res.status(200).json(product);
    }

    // DELETE product
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing product ID' });
      }

      await prisma.product.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Product deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
    
    console.log('Error in products API:', errorMessage, errorDetails);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Product with this name already exists' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Product not found' });
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
