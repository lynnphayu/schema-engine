import * as fs from "node:fs/promises";
import * as path from "node:path";

export default () => ({
  write: async (
    dir: string,
    filename: string,
    content: string,
  ): Promise<string> => {
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, content, "utf8");
    return filePath;
  },

  read: async (dir: string, filename: string): Promise<string> => {
    const filePath = path.join(dir, filename);
    return await fs.readFile(filePath, "utf8");
  },

  delete: async (dir: string): Promise<void> => {
    await fs.rm(dir, { recursive: true, force: true });
  },

  exists: async (dir: string, filename?: string): Promise<boolean> => {
    try {
      const filePath = filename ? path.join(dir, filename) : dir;
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },
});
