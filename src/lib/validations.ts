import { z } from "zod";

// Auth schemas
export const signinSchema = z.object({
  email: z.string().email("إيميل مش صح"),
  password: z.string().min(1, "اكتب كلمة السر"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "الاسم قصاد"),
  email: z
    .string()
    .email("إيميل مش صح")
    .refine(
      (v) => v.endsWith("@sidibishr-apartment.live"),
      "لازم الإيميل يكون @sidibishr-apartment.live"
    ),
  password: z.string().min(6, "كلمة السر لازم 6 حروف على الأقل"),
});

export const resetRequestSchema = z.object({
  email: z.string().email("إيميل مش صح"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "كلمة السر لازم 6 حروف على الأقل"),
});

// Post schemas
export const createPostSchema = z.object({
  content: z.string().min(1, "اكتب حاجة").max(2000, "طويل أوي"),
  imageUrl: z.string().optional().or(z.literal("")),
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, "اكتب حاجة").max(1000, "طويل أوي"),
  parentId: z.string().optional().nullable(),
});

// Event schemas
export const createEventSchema = z.object({
  title: z.string().min(1, "اكتب عنوان"),
  description: z.string().min(1, "اكتب وصف"),
  date: z.string().refine((v) => !isNaN(Date.parse(v)), "تاريخ مش صح"),
  location: z.string().min(1, "اكتب مكان"),
  coverImage: z.string().optional().or(z.literal("")),
  type: z.enum(["HANGOUT", "IFTAR"]),
});

// Memory schemas
export const createMemorySchema = z.object({
  eventId: z.string(),
  url: z.string().min(1, "ارفع ملف"),
  caption: z.string().max(500).optional().or(z.literal("")),
  type: z.enum(["image", "video"]).default("image"),
});

// Announcement schemas
export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "اكتب عنوان"),
  content: z.string().min(1, "اكتب محتوى"),
  pinned: z.boolean().default(false),
});

// Bill schemas
export const createBillSchema = z.object({
  category: z.enum(["GAS", "ELECTRICITY", "WATER", "INTERNET", "OTHER"]),
  title: z.string().min(1, "اكتب عنوان"),
  amount: z.number().positive("المبلغ لازم يبقى موجب"),
  billDate: z.string().refine((v) => !isNaN(Date.parse(v)), "تاريخ مش صح"),
});

export const settlementSchema = z.object({
  toUserId: z.string(),
  amount: z.number().positive("المبلغ لازم يبقى موجب"),
  billId: z.string().optional(),
});

// Decision schemas
export const createDecisionSchema = z.object({
  title: z.string().min(1, "اكتب عنوان"),
  description: z.string().min(1, "اكتب وصف"),
  threshold: z.enum(["MAJORITY", "TWO_THIRDS", "UNANIMOUS"]).default("MAJORITY"),
});

export const voteSchema = z.object({
  choice: z.enum(["YES", "NO", "ABSTAIN"]),
});

// Badge schemas
export const createBadgeSchema = z.object({
  text: z.string().min(1, "اكتب نص الوسام"),
  recipientId: z.string(),
});
