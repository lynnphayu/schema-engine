import * as fs from "node:fs/promises";
import * as path from "node:path";

export class FilesystemService {
  async write(dir: string, filename: string, content: string): Promise<string> {
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, content, "utf8");
    return filePath;
  }

  async read(dir: string, filename: string): Promise<string> {
    const filePath = path.join(dir, filename);
    return await fs.readFile(filePath, "utf8");
  }

  async delete(dir: string): Promise<void> {
    await fs.rm(dir, { recursive: true, force: true });
  }

  async exists(dir: string, filename?: string): Promise<boolean> {
    try {
      const filePath = filename ? path.join(dir, filename) : dir;
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const filesystemService = new FilesystemService();
