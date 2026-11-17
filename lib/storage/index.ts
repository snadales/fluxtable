import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface StorageProvider {
  upload(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<{
    storagePath: string;
    safeFilename: string;
    fileSize: number;
    hash: string;
  }>;
  read(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
  exists(storagePath: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'data', 'uploads');
  }

  private async ensureDir() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (err) {
      // Ignorar si ya existe
    }
  }

  public async upload(fileBuffer: Buffer, originalFilename: string, mimeType: string) {
    await this.ensureDir();

    // Generar hash SHA-256 para evitar duplicación y nombres inseguros (path traversal)
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const ext = path.extname(originalFilename).toLowerCase() || '.bin';
    const safeFilename = `${hash}${ext}`;
    const storagePath = path.join(this.baseDir, safeFilename);

    await fs.writeFile(storagePath, fileBuffer);

    return {
      storagePath,
      safeFilename,
      fileSize: fileBuffer.length,
      hash,
    };
  }

  public async read(storagePath: string): Promise<Buffer> {
    return await fs.readFile(storagePath);
  }

  public async delete(storagePath: string): Promise<void> {
    try {
      await fs.unlink(storagePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  public async exists(storagePath: string): Promise<boolean> {
    try {
      await fs.access(storagePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const defaultStorage = new LocalStorageProvider();
