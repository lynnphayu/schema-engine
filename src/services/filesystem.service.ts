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

  ls: async (dir: string): Promise<string[]> => {
    return await fs.readdir(dir);
  },

  read: async (dir: string, filename: string) => {
    const filePath = path.join(dir, filename);
    return await fs.readFile(filePath);
  },
});
