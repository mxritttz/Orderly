import { ZodError, type ZodTypeAny } from "zod";
import type { FastifyReply, FastifyRequest } from "fastify";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const ok = (
  request: FastifyRequest,
  reply: FastifyReply,
  data: unknown,
  statusCode = 200
) =>
  reply.code(statusCode).send({
    success: true,
    data,
    meta: { requestId: request.id },
  });

export const parseDto = <TSchema extends ZodTypeAny>(
  schema: TSchema,
  payload: unknown,
  fieldName: string
) => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new HttpError(400, "validation_error", `Invalid ${fieldName}.`, parsed.error.issues);
  }
  return parsed.data;
};

export const errorResponse = (request: FastifyRequest, error: HttpError | Error) => {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
        meta: { requestId: request.id },
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: {
          code: "validation_error",
          message: "Invalid request payload.",
          details: error.issues,
        },
        meta: { requestId: request.id },
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      success: false,
      error: {
        code: "internal_error",
        message: "Internal server error.",
        details: null,
      },
      meta: { requestId: request.id },
    },
  };
};
