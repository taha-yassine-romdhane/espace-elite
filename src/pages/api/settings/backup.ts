import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';
import { create } from 'xmlbuilder2';

const prisma = new PrismaClient();
const execPromise = promisify(exec);

// Create backup directory if it doesn't exist
const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET request - list all backups
  if (req.method === 'GET') {
    try {
      // Try to get backups from database first
      let backups: any[] = [];
      try {
        backups = await prisma.databaseBackup.findMany({
          orderBy: {
            createdAt: 'desc'
          }
        });
      } catch (dbError) {
        console.error('Error fetching backups from database:', dbError);
        // Continue with empty backups array if database query fails
      }
      
      // If no backups found in database or database query failed, scan the filesystem
      if (backups.length === 0) {
        console.log('No backups found in database, scanning filesystem...');
        
        // Get all files in the backup directory
        const files = fs.readdirSync(backupDir);
        
        // Filter for .sql and .json files
        const backupFiles = files.filter(file => 
          file.endsWith('.sql') || file.endsWith('.json')
        );
        
        // Create backup records from files
        backups = backupFiles.map(fileName => {
          const filePath = path.join(backupDir, fileName);
          const stats = fs.statSync(filePath);
          
          // Extract timestamp from filename (assuming format backup-YYYY-MM-DDTHH-mm-ss-SSSZ.ext)
          let createdAt = new Date();
          const timestampMatch = fileName.match(/backup-(.*?)\.(sql|json)/);
          if (timestampMatch) {
            const timestamp = timestampMatch[1].replace(/-/g, ':').replace('T', ' ');
            try {
              createdAt = new Date(timestamp);
            } catch (e) {
              // Use file creation time if parsing fails
              createdAt = stats.birthtime;
            }
          } else {
            createdAt = stats.birthtime;
          }
          
          // Determine if it's a JSON or SQL backup
          const isJsonBackup = fileName.endsWith('.json');
          
          return {
            id: `file-${fileName}`, // Generate a pseudo-ID
            fileName,
            filePath,
            fileSize: stats.size,
            description: isJsonBackup ? 'JSON backup (filesystem)' : 'SQL backup (filesystem)',
            createdBy: 'system',
            createdAt: createdAt.toISOString(),
            restoredAt: null
          };
        });
        
        // Sort by creation date (newest first)
        backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Try to register these backups in the database if possible
        try {
          for (const backup of backups) {
            const exists = await prisma.databaseBackup.findFirst({
              where: { fileName: backup.fileName }
            });
            
            if (!exists) {
              await prisma.databaseBackup.create({
                data: {
                  fileName: backup.fileName,
                  filePath: backup.filePath,
                  fileSize: backup.fileSize,
                  description: backup.description,
                  createdBy: backup.createdBy,
                  createdAt: new Date(backup.createdAt)
                }
              });
            }
          }
        } catch (registerError) {
          console.error('Failed to register filesystem backups in database:', registerError);
          // Continue with the backups we found on filesystem
        }
      }
      
      return res.status(200).json(backups);
    } catch (error) {
      console.error('Error fetching backups:', error);
      return res.status(500).json({ error: 'Failed to fetch backups' });
    }
  }
  
  // POST request - create a new backup
  if (req.method === 'POST') {
    try {
      const { description, userId, format = 'json', download = false } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Validate format
      const validFormats = ['json', 'sql', 'xml', 'csv', 'xlsx'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({ error: `Invalid format. Supported formats: ${validFormats.join(', ')}` });
      }
      
      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let backupFileName = `backup-${timestamp}.${format}`;
      let backupPath = path.join(backupDir, backupFileName);
      
      // Get database URL from environment variable
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return res.status(500).json({ error: 'Database URL not configured' });
      }
      
      let fileSizeInBytes = 0;
      let backupCreated = false;
      let backupData: any = null;
      
      // If SQL format is requested, try pg_dump first
      if (format === 'sql') {
        try {
          // Parse database connection string
          const dbUrlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
          if (!dbUrlMatch) {
            throw new Error('Invalid database URL format');
          }
          
          const [, user, password, host, port, dbname] = dbUrlMatch;
          
          // Create pg_dump command
          const pgDumpCmd = `PGPASSWORD=${password} pg_dump -U ${user} -h ${host} -p ${port} -d ${dbname} -f ${backupPath}`;
          
          // Execute pg_dump
          const { stdout, stderr } = await execPromise(pgDumpCmd);
          
          if (stderr && !fs.existsSync(backupPath)) {
            console.error('pg_dump stderr:', stderr);
            throw new Error(`pg_dump failed: ${stderr}`);
          }
          
          // Get file size
          const stats = fs.statSync(backupPath);
          fileSizeInBytes = stats.size;
          backupCreated = true;
        } catch (pgDumpError) {
          console.error('pg_dump error:', pgDumpError);
          // Fall through to the JSON backup method
        }
      }
      
      // If SQL backup failed or another format was requested, use the data export approach
      if (!backupCreated) {
        try {
          console.log(`Creating ${format} backup...`);
          
          // Fetch critical data from database
          const patients = await prisma.patient.findMany();
          const companies = await prisma.company.findMany();
          const medicalDevices = await prisma.medicalDevice.findMany();
          const settings = await prisma.appSettings.findFirst();
          
          // Create the backup data object
          backupData = {
            timestamp: new Date().toISOString(),
            patients,
            companies,
            medicalDevices,
            settings
          };
          
          // Generate the appropriate format
          switch (format) {
            case 'json':
              fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
              break;
              
            case 'xml':
              const xmlDoc = create({ backup: backupData });
              fs.writeFileSync(backupPath, xmlDoc.end({ prettyPrint: true }));
              break;
              
            case 'csv':
              // Create separate CSV files for each entity
              const mainCsvData = { timestamp: backupData.timestamp };
              fs.writeFileSync(backupPath, JSON.stringify(mainCsvData));
              
              // Create separate CSV files for each entity type
              for (const entity of ['patients', 'companies', 'medicalDevices']) {
                if (backupData[entity] && backupData[entity].length > 0) {
                  try {
                    const parser = new Parser();
                    const csv = parser.parse(backupData[entity]);
                    const entityPath = path.join(backupDir, `${entity}-${timestamp}.csv`);
                    fs.writeFileSync(entityPath, csv);
                  } catch (csvError) {
                    console.error(`Error creating CSV for ${entity}:`, csvError);
                  }
                }
              }
              break;
              
            case 'xlsx':
              const workbook = XLSX.utils.book_new();
              
              // Add each entity as a separate worksheet
              for (const entity of ['patients', 'companies', 'medicalDevices']) {
                if (backupData[entity] && backupData[entity].length > 0) {
                  const worksheet = XLSX.utils.json_to_sheet(backupData[entity]);
                  XLSX.utils.book_append_sheet(workbook, worksheet, entity);
                }
              }
              
              // Add settings as a separate worksheet if available
              if (backupData.settings) {
                const settingsWorksheet = XLSX.utils.json_to_sheet([backupData.settings]);
                XLSX.utils.book_append_sheet(workbook, settingsWorksheet, 'settings');
              }
              
              // Write the workbook to file
              XLSX.writeFile(workbook, backupPath);
              break;
              
            default:
              // Default to JSON if format is not recognized
              fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
              backupFileName = `backup-${timestamp}.json`;
              backupPath = path.join(backupDir, backupFileName);
          }
          
          // Get file size
          const stats = fs.statSync(backupPath);
          fileSizeInBytes = stats.size;
          backupCreated = true;
        } catch (dataExportError) {
          console.error('Data export backup failed:', dataExportError);
          throw new Error(`Failed to create ${format} backup: ${dataExportError}`);
        }
      }
      
      if (!backupCreated) {
        return res.status(500).json({ error: 'Failed to create backup file' });
      }
      
      // Create backup record in database
      const backup = await prisma.databaseBackup.create({
        data: {
          fileName: backupFileName,
          filePath: backupPath,
          fileSize: fileSizeInBytes,
          format: format,
          source: 'local',
          description: description || `${format.toUpperCase()} backup created on ${new Date().toLocaleString()}`,
          createdBy: userId,
        }
      });
      
      // If download flag is set, return the file content for download
      if (download) {
        // Read the file content
        const fileContent = fs.readFileSync(backupPath);
        
        // Set appropriate headers for file download
        res.setHeader('Content-Disposition', `attachment; filename=${backupFileName}`);
        
        // Set content type based on format
        switch (format) {
          case 'json':
            res.setHeader('Content-Type', 'application/json');
            break;
          case 'sql':
            res.setHeader('Content-Type', 'application/sql');
            break;
          case 'xml':
            res.setHeader('Content-Type', 'application/xml');
            break;
          case 'csv':
            res.setHeader('Content-Type', 'text/csv');
            break;
          case 'xlsx':
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            break;
          default:
            res.setHeader('Content-Type', 'application/octet-stream');
        }
        
        // Send the file content
        return res.status(200).send(fileContent);
      }
      
      // Otherwise return the backup metadata
      return res.status(200).json(backup);
    } catch (error) {
      console.error('Error creating backup:', error);
      return res.status(500).json({ 
        error: 'Failed to create backup', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Handle download request for existing backup
  if (req.method === 'GET' && req.query.id && req.query.download === 'true') {
    try {
      const backupId = req.query.id as string;
      
      // Find the backup in the database
      const backup = await prisma.databaseBackup.findUnique({
        where: { id: backupId }
      });
      
      if (!backup) {
        return res.status(404).json({ error: 'Backup not found' });
      }
      
      // Check if file exists
      if (!fs.existsSync(backup.filePath)) {
        return res.status(404).json({ error: 'Backup file not found on disk' });
      }
      
      // Read the file content
      const fileContent = fs.readFileSync(backup.filePath);
      
      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename=${backup.fileName}`);
      
      // Set content type based on format
      const format = backup.format || 'json';
      switch (format) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          break;
        case 'sql':
          res.setHeader('Content-Type', 'application/sql');
          break;
        case 'xml':
          res.setHeader('Content-Type', 'application/xml');
          break;
        case 'csv':
          res.setHeader('Content-Type', 'text/csv');
          break;
        case 'xlsx':
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          break;
        default:
          res.setHeader('Content-Type', 'application/octet-stream');
      }
      
      // Send the file content
      return res.status(200).send(fileContent);
    } catch (error) {
      console.error('Error downloading backup:', error);
      return res.status(500).json({ 
        error: 'Failed to download backup', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Return 405 for other methods
  return res.status(405).json({ error: 'Method not allowed' });
}
