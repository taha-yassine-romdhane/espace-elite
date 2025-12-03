import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';

// Base storage path for public uploads
const UPLOADS_PUBLIC_PATH = '/var/espace-elite-files/uploads-public';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // No authentication required - these are public files (logos)

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileName } = req.query;

  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ error: 'Invalid file name' });
  }

  try {
    // Construct file path
    const filePath = path.join(UPLOADS_PUBLIC_PATH, fileName);

    // Security check: ensure the resolved path is within our storage directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBasePath = path.resolve(UPLOADS_PUBLIC_PATH);

    if (!resolvedPath.startsWith(resolvedBasePath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Determine MIME type
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    // Only allow image files to be served from public uploads
    if (!mimeType.startsWith('image/')) {
      return res.status(403).json({ error: 'Only image files are allowed' });
    }

    // Set headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Public file serving error:', error);
    return res.status(500).json({ error: 'Failed to serve file' });
  }
}
