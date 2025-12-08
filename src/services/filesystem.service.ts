import * as fs from "node:fs/promises";
import * as path from "node:path";
import { injectable } from "inversify";
import "reflect-metadata";

@injectable()
export class FilesystemService {
  async write(dir: string, filename: string, content: string): Promise<string> {
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, content, "utf8");
    return filePath;
  }

  async ls(dir: string): Promise<string[]> {
    return await fs.readdir(dir);
  }

  async read(dir: string, filename: string): Promise<Buffer> {
    const filePath = path.join(dir, filename);
    return await fs.readFile(filePath);
  }
}
