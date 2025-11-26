import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import formidable, { File as FormidableFile } from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow authenticated admins to upload
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Vous devez être connecté pour télécharger des fichiers' });
  }

  // Only admins can upload public files (logos)
  if (session.user.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Seuls les administrateurs peuvent télécharger des logos' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      multiples: false,
      maxFileSize: 5 * 1024 * 1024, // 5MB max for logos
      keepExtensions: true,
      // Only allow image files
      filter: function ({ mimetype }) {
        return mimetype ? mimetype.includes('image') : false;
      },
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Get the uploaded file
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé' });
    }

    const file = uploadedFile as FormidableFile;

    // Validate file is an image
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Seules les images sont autorisées (PNG, JPG, SVG)' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.originalFilename || 'logo';
    const ext = path.extname(originalName);
    const basename = path.basename(originalName, ext);
    const uniqueName = `${timestamp}-${basename}${ext}`;

    // Define paths - use public/uploads-public folder (separate from sensitive documents)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads-public');
    const filePath = path.join(uploadsDir, uniqueName);

    console.log('Public upload details:', {
      originalName,
      uniqueName,
      uploadsDir,
      filePath,
      tempPath: file.filepath,
      mimetype: file.mimetype,
    });

    // Ensure the uploads-public directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    // Move file from temp location to uploads-public folder
    try {
      await fs.copyFile(file.filepath, filePath);
      console.log('File copied successfully to:', filePath);

      // Verify the file exists
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!fileExists) {
        throw new Error('File was not saved successfully');
      }

      // Delete temp file
      await fs.unlink(file.filepath);
      console.log('Temp file deleted');
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Construct the file URL
    const fileUrl = `/uploads-public/${uniqueName}`;

    return res.status(200).json({
      success: true,
      files: [{
        url: fileUrl,
        name: originalName,
        size: file.size,
        type: file.mimetype || 'image/*',
        key: uniqueName,
      }],
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
  }
}
