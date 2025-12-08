export const TYPES = {
  // Services
  FilesystemService: Symbol.for("FilesystemService"),
  DrizzleKitService: Symbol.for("DrizzleKitService"),
  S3Service: Symbol.for("S3Service"),
  EngineService: Symbol.for("EngineService"),

  // Controllers
  SchemaController: Symbol.for("SchemaController"),

  // External Dependencies
  S3Client: Symbol.for("S3Client"),
};
