import { z } from "zod";

export const listOrdersParamsSchema = z.object({
  tenantSlug: z.string().min(1),
});

export const listOrdersQuerySchema = z.object({
  status: z.enum(["new", "confirmed", "preparing", "ready", "done"]).optional(),
  search: z.string().trim().min(1).optional(),
  locationId: z.string().trim().min(1).optional(),
});

export const updateOrderStatusParamsSchema = z.object({
  tenantSlug: z.string().min(1),
  orderId: z.string().min(1),
});

export const updateOrderStatusBodySchema = z.object({
  status: z.enum(["new", "confirmed", "preparing", "ready", "done"]),
});
