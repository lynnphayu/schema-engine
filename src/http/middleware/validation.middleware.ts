import { Cause, Effect, Exit } from "effect";
import type { MiddlewareHandler, Next } from "hono";
import type { z } from "zod";
import {
  RequestJsonParseError,
  RequestValidationError,
} from "#/errors/validation";

const runValidationOrThrow = async (
  program: Effect.Effect<void, RequestValidationError | RequestJsonParseError>,
): Promise<void> => {
  const exit = await Effect.runPromiseExit(program);
  if (Exit.isFailure(exit)) {
    throw Cause.squash(exit.cause);
  }
};

export const validateBody = <T extends z.ZodTypeAny>(
  schema: T,
): MiddlewareHandler<{ Variables: { validatedBody: z.infer<T> } }> => {
  return async (c, next: Next) => {
    await runValidationOrThrow(
      Effect.gen(function* () {
        const body = yield* Effect.tryPromise({
          try: () => c.req.json(),
          catch: (cause) => new RequestJsonParseError({ cause }),
        });
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          yield* Effect.fail(
            new RequestValidationError({
              part: "body",
              issues: parsed.error.issues,
            }),
          );
          return;
        }
        c.set("validatedBody", parsed.data);
      }),
    );
    await next();
  };
};

export const validateParams = <T extends z.ZodTypeAny>(
  schema: T,
): MiddlewareHandler<{ Variables: { validatedParams: z.infer<T> } }> => {
  return async (c, next: Next) => {
    await runValidationOrThrow(
      Effect.gen(function* () {
        const params = c.req.param();
        const parsed = schema.safeParse(params);
        if (!parsed.success) {
          yield* Effect.fail(
            new RequestValidationError({
              part: "params",
              issues: parsed.error.issues,
            }),
          );
          return;
        }
        c.set("validatedParams", parsed.data);
      }),
    );
    await next();
  };
};

export const validateQuery = <T extends z.ZodTypeAny>(
  schema: T,
): MiddlewareHandler<{ Variables: { validatedQuery: z.infer<T> } }> => {
  return async (c, next: Next) => {
    await runValidationOrThrow(
      Effect.gen(function* () {
        const query = c.req.query();
        const parsed = schema.safeParse(query);
        if (!parsed.success) {
          yield* Effect.fail(
            new RequestValidationError({
              part: "query",
              issues: parsed.error.issues,
            }),
          );
          return;
        }
        c.set("validatedQuery", parsed.data);
      }),
    );
    await next();
  };
};
