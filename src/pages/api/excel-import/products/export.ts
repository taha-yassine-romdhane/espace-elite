import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Fetch all products with their related data
    const products = await prisma.product.findMany({
      include: {
        stocks: {
          include: {
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data for Excel export
    const excelData = products.map(product => ({
      'ID': product.id,
      'Nom du produit': product.name || '',
      'Type de produit': product.type || '',
      'Marque': product.brand || '',
      'Modèle': product.model || '',
      'Numéro de série': product.serialNumber || '',
      'Prix d\'achat': product.purchasePrice || '',
      'Prix de vente': product.sellingPrice || '',
      'Date d\'achat': product.purchaseDate ? new Date(product.purchaseDate).toLocaleDateString('fr-FR') : '',
      'Expiration garantie': product.warrantyExpiration ? new Date(product.warrantyExpiration).toLocaleDateString('fr-FR') : '',
      'Statut': product.status || '',
      'Notes': product.notes || '',
      'Quantité totale en stock': product.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0,
      'Date création': product.createdAt ? new Date(product.createdAt).toLocaleDateString('fr-FR') : '',
      'Date modification': product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('fr-FR') : ''
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // ID
      { wch: 25 }, // Nom du produit
      { wch: 15 }, // Type de produit
      { wch: 15 }, // Marque
      { wch: 20 }, // Modèle
      { wch: 20 }, // Numéro de série
      { wch: 12 }, // Prix d'achat
      { wch: 12 }, // Prix de vente
      { wch: 12 }, // Date d'achat
      { wch: 15 }, // Expiration garantie
      { wch: 10 }, // Statut
      { wch: 25 }, // Notes
      { wch: 20 }, // Emplacement de stock
      { wch: 15 }, // Quantité totale en stock
      { wch: 15 }, // Date création
      { wch: 15 }  // Date modification
    ];
    ws['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Set response headers
    const fileName = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Send the file
    res.send(buffer);
    
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
}