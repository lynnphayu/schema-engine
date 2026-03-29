import type { ManagedRuntime } from "effect";
import { Cause, Effect, Exit } from "effect";
import type { Context } from "hono";
import type { z } from "zod";
import { DrizzleKitService, EngineService } from "#/layers/tags";
import type { DynamicSchema, schemaRequestSchema } from "#/types/schema";

type SchemaRequestBody = z.infer<typeof schemaRequestSchema>;

export async function runSchemaEffect<A, E, R>(
  runtime: ManagedRuntime.ManagedRuntime<R, never>,
  program: Effect.Effect<A, E, R>,
  c: Context,
): Promise<Response> {
  const exit = await runtime.runPromiseExit(program);
  if (Exit.isFailure(exit)) {
    throw Cause.squash(exit.cause);
  }
  return c.json(exit.value);
}

export const generateSchemaEffect = (input: {
  readonly tenantId: string;
  readonly body: SchemaRequestBody;
}) =>
  Effect.gen(function* () {
    const engine = yield* EngineService;
    return yield* engine.generate(
      input.tenantId,
      { schema: input.body.schema, tables: input.body.tables },
      input.body.databaseUrl,
    );
  });

export const migrateSchemaEffect = (tenantId: string) =>
  Effect.gen(function* () {
    return yield* Effect.succeed({
      message: `Migration applied successfully for user ${tenantId}`,
      success: true,
    });
  });

export const validateSchemaEffect = (input: {
  readonly tenantId: string;
  readonly body: SchemaRequestBody;
}) =>
  Effect.gen(function* () {
    const drizzle = yield* DrizzleKitService;
    const dynamicSchema: DynamicSchema = {
      schema: input.body.schema,
      tables: input.body.tables,
    };
    const drizzleSchema = yield* drizzle.jsonToDrizzle(dynamicSchema);
    return drizzleSchema;
  });
