import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Effect } from "effect";
import {
  FilesystemListError,
  FilesystemReadError,
  FilesystemWriteError,
} from "#/errors/fs";

export const makeFilesystemService = () => ({
  write: (dir: string, filename: string, content: string) =>
    Effect.tryPromise({
      try: async () => {
        await fs.mkdir(dir, { recursive: true });
        const filePath = path.join(dir, filename);
        await fs.writeFile(filePath, content, "utf8");
        return filePath;
      },
      catch: (cause) =>
        new FilesystemWriteError({
          dir,
          filename,
          cause,
        }),
    }),

  ls: (dir: string) =>
    Effect.tryPromise({
      try: () => fs.readdir(dir),
      catch: (cause) => new FilesystemListError({ dir, cause }),
    }),

  read: (dir: string, filename: string) =>
    Effect.tryPromise({
      try: async () => {
        const filePath = path.join(dir, filename);
        return await fs.readFile(filePath);
      },
      catch: (cause) =>
        new FilesystemReadError({
          dir,
          filename,
          cause,
        }),
    }),
});
