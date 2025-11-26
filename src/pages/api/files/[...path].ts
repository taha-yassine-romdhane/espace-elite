import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentication check - files are sensitive
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized - Authentication required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the file path from the URL
    const { path: filePath } = req.query;

    if (!filePath || !Array.isArray(filePath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Join the path segments
    const requestedPath = filePath.join('/');

    // Security: Prevent directory traversal attacks
    if (requestedPath.includes('..') || requestedPath.includes('~')) {
      return res.status(403).json({ error: 'Forbidden - Invalid path' });
    }

    // Construct the full file path
    const fullPath = path.join(process.cwd(), 'private-storage', requestedPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if it's a file (not a directory)
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      return res.status(403).json({ error: 'Forbidden - Not a file' });
    }

    // TODO: Add permission checks here
    // For example: Check if user has access to this specific file
    // based on their role, patient assignments, etc.

    // Read the file
    const fileBuffer = fs.readFileSync(fullPath);

    // Get file extension and set appropriate content type
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

    // Send the file
    res.status(200).send(fileBuffer);
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
