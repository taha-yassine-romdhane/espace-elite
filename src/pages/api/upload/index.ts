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
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Vous devez être connecté pour télécharger des fichiers' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      multiples: true,
      maxFileSize: 16 * 1024 * 1024, // 16MB max file size
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Get the uploaded file(s)
    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé' });
    }

    const uploadedFileData = [];

    for (const file of uploadedFiles) {
      if (!file) continue;

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = (file as FormidableFile).originalFilename || 'file';
      const ext = path.extname(originalName);
      const basename = path.basename(originalName, ext);
      const uniqueName = `${timestamp}-${basename}${ext}`;

      // Define paths - use environment variable for VPS or default to public/imports
      const uploadsDir = process.env.FILE_STORAGE_PATH
        ? path.join(process.env.FILE_STORAGE_PATH, 'imports')
        : path.join(process.cwd(), 'public', 'imports');

      const filePath = path.join(uploadsDir, uniqueName);

      // Ensure the imports directory exists
      await fs.mkdir(uploadsDir, { recursive: true });

      // Move file from temp location to imports folder
      await fs.copyFile((file as FormidableFile).filepath, filePath);

      // Delete temp file
      await fs.unlink((file as FormidableFile).filepath);

      // Construct the file URL
      const fileUrl = `/imports/${uniqueName}`;

      uploadedFileData.push({
        url: fileUrl,
        name: originalName,
        size: (file as FormidableFile).size,
        type: (file as FormidableFile).mimetype || 'application/octet-stream',
        key: uniqueName,
      });
    }

    return res.status(200).json({
      success: true,
      files: uploadedFileData,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
  }
}
