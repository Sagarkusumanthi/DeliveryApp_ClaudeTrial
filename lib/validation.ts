import { z } from "zod";

export const phoneRegex = /^[6-9]\d{9}$/;

export const recipientSchema = z.object({
  recipientName: z.string().trim().min(2, "Enter at least 2 characters").max(60),
  recipientPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid 10-digit phone number starting with 6-9"),
  deliveryAddress: z.string().trim().min(10, "Enter a complete address (min 10 characters)"),
  landmark: z.string().trim().max(120).optional().or(z.literal("")),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
    .optional()
    .or(z.literal("")),
});

export const occasionEnum = z.enum([
  "Birthday",
  "Anniversary",
  "Thank you",
  "Congratulations",
  "Just because",
]);

export const giftSchema = z.object({
  giftMessage: z.string().trim().max(250, "Message can be at most 250 characters").optional().or(z.literal("")),
  occasion: occasionEnum,
  senderName: z.string().trim().min(2, "Enter your name").max(60),
});

export const deliveryOptionEnum = z.enum(["STANDARD", "EXPRESS", "SCHEDULED"]);
export const deliverySlotEnum = z.enum(["MORNING", "AFTERNOON", "EVENING"]);
export const paymentMethodEnum = z.enum(["COD", "UPI_MOCK"]);

export const deliverySchema = z
  .object({
    deliveryOption: deliveryOptionEnum,
    deliveryDate: z.string().optional(), // ISO date (yyyy-mm-dd) when SCHEDULED
    deliverySlot: deliverySlotEnum.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.deliveryOption === "SCHEDULED") {
      if (!val.deliveryDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryDate"], message: "Pick a delivery date" });
      }
      if (!val.deliverySlot) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliverySlot"], message: "Pick a delivery slot" });
      }
    }
  });

export const checkoutSchema = recipientSchema
  .merge(giftSchema)
  .merge(
    z.object({
      deliveryOption: deliveryOptionEnum,
      deliveryDate: z.string().optional(),
      deliverySlot: deliverySlotEnum.optional(),
      paymentMethod: paymentMethodEnum,
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(10),
      cityId: z.string().min(1),
      idempotencyKey: z.string().min(10),
      displayedTotal: z.number().optional(), // used to detect price drift; recalculated server-side regardless
    })
  )
  .superRefine((val, ctx) => {
    if (val.deliveryOption === "SCHEDULED") {
      if (!val.deliveryDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryDate"], message: "Pick a delivery date" });
      }
      if (!val.deliverySlot) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliverySlot"], message: "Pick a delivery slot" });
      }
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  description: z.string().trim().min(1, "Add a short description"),
  categoryId: z.string().min(1, "Choose a category"),
  price: z
    .number({ invalid_type_error: "Enter a price" })
    .finite()
    .gt(0, "Price must be greater than zero")
    .refine((v) => Math.round(v * 100) === v * 100, "Max two decimal places"),
  imageUrl: z.string().trim().min(1, "Add an image URL"),
  isFeatured: z.boolean().optional().default(false),
  isAvailable: z.boolean().optional().default(true),
});

export const storeProfileSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  address: z.string().trim().min(1),
  coverImage: z.string().trim().min(1),
  isOpen: z.boolean(),
});

export const reasonRequiredSchema = z.object({
  reason: z.string().trim().min(3, "Please provide a reason (min 3 characters)"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const ORDER_STATUS_VALUES = [
  "ORDER_PLACED",
  "STORE_ACCEPTED",
  "PREPARING_GIFT",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "REJECTED",
] as const;

export const adminOverrideSchema = z.object({
  targetStatus: z.enum(ORDER_STATUS_VALUES),
  reason: z.string().trim().min(3, "Please provide a reason (min 3 characters)"),
});
