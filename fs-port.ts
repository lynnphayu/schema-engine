import { mkdir, readdir, rm, writeFile } from "node:fs/promises";

export default {
  write: async (folder: string, file: string, data: string) => {
    await readdir(folder).catch(async () => {
      await mkdir(folder, { recursive: true });
    });
    await writeFile(`${folder}/${file}`, data);
    return `${folder}/${file}`;
  },
  delete: async (path: string) => {
    await rm(path, { recursive: true });
  },
};
