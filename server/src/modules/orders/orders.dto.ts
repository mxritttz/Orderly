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

export const createPublicOrderParamsSchema = z.object({
  tenantSlug: z.string().min(1),
});

export const createPublicOrderBodySchema = z.object({
  customerName: z.string().trim().min(2),
  customerPhone: z.string().trim().min(5),
  notes: z.string().trim().max(500).optional(),
  pickupEtaMinutes: z.coerce.number().int().min(5).max(120).optional(),
  items: z
    .array(
      z.object({
        itemName: z.string().trim().min(1),
        qty: z.coerce.number().int().positive().max(20),
        unitPrice: z.coerce.number().positive().max(999),
      })
    )
    .min(1),
});

export const publicTrackOrderParamsSchema = z.object({
  tenantSlug: z.string().min(1),
  orderId: z.string().min(1),
});
