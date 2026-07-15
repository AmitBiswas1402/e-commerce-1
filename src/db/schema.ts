import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ENUMS

export const userRoleEnum = pgEnum("user_role", [
  "CUSTOMER",
  "ADMIN",
]);

export const productStatusEnum = pgEnum("product_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

// USERS

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clerkId: text("clerk_id").notNull().unique(),

    email: text("email").notNull().unique(),

    firstName: text("first_name"),

    lastName: text("last_name"),

    imageUrl: text("image_url"),

    role: userRoleEnum("role").default("CUSTOMER").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("users_clerk_id_idx").on(table.clerkId),
  ]
);

// CATEGORIES

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    slug: text("slug").notNull().unique(),

    description: text("description"),

    imageUrl: text("image_url"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("categories_slug_idx").on(table.slug),
  ]
);

// BRANDS

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    slug: text("slug").notNull().unique(),

    logoUrl: text("logo_url"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("brands_slug_idx").on(table.slug),
  ]
);

// PRODUCTS

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, {
        onDelete: "restrict",
      }),

    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),

    name: text("name").notNull(),

    slug: text("slug").notNull().unique(),

    description: text("description"),

    status: productStatusEnum("status")
      .default("DRAFT")
      .notNull(),

    isFeatured: boolean("is_featured")
      .default(false)
      .notNull(),

    isNewArrival: boolean("is_new_arrival")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("products_slug_idx").on(table.slug),
    index("products_category_id_idx").on(table.categoryId),
    index("products_brand_id_idx").on(table.brandId),
    index("products_status_idx").on(table.status),
  ]
);

// PRODUCT IMAGES

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    imageUrl: text("image_url").notNull(),

    altText: text("alt_text"),

    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("product_images_product_id_idx").on(
      table.productId
    ),
  ]
);

// PRODUCT VARIANTS

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    sku: text("sku").notNull().unique(),

    color: text("color"),

    size: text("size"),

    price: integer("price").notNull(),

    compareAtPrice: integer("compare_at_price"),

    stock: integer("stock").default(0).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("product_variants_product_id_idx").on(
      table.productId
    ),
    index("product_variants_sku_idx").on(table.sku),
  ]
);

// CARTS

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("carts_user_id_idx").on(table.userId),
  ]
);

// CART ITEMS

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, {
        onDelete: "cascade",
      }),

    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, {
        onDelete: "cascade",
      }),

    quantity: integer("quantity").default(1).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("cart_items_cart_variant_unique").on(
      table.cartId,
      table.variantId
    ),
  ]
);

// WISHLISTS

export const wishlists = pgTable("wishlists", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// WISHLIST ITEMS

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    wishlistId: uuid("wishlist_id")
      .notNull()
      .references(() => wishlists.id, {
        onDelete: "cascade",
      }),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("wishlist_product_unique").on(
      table.wishlistId,
      table.productId
    ),
  ]
);

// ADDRESSES

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    label: text("label"),

    fullName: text("full_name").notNull(),

    phone: text("phone").notNull(),

    addressLine1: text("address_line_1").notNull(),

    addressLine2: text("address_line_2"),

    city: text("city").notNull(),

    state: text("state").notNull(),

    postalCode: text("postal_code").notNull(),

    country: text("country").default("India").notNull(),

    isDefault: boolean("is_default").default(false).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("addresses_user_id_idx").on(table.userId),
  ]
);

// ORDERS

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderNumber: text("order_number").notNull().unique(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    status: orderStatusEnum("status")
      .default("PENDING")
      .notNull(),

    paymentStatus: paymentStatusEnum("payment_status")
      .default("PENDING")
      .notNull(),

    subtotal: integer("subtotal").notNull(),

    shippingAmount: integer("shipping_amount")
      .default(0)
      .notNull(),

    discountAmount: integer("discount_amount")
      .default(0)
      .notNull(),

    totalAmount: integer("total_amount").notNull(),

    shippingFullName: text("shipping_full_name").notNull(),

    shippingPhone: text("shipping_phone").notNull(),

    shippingAddressLine1: text(
      "shipping_address_line_1"
    ).notNull(),

    shippingAddressLine2: text("shipping_address_line_2"),

    shippingCity: text("shipping_city").notNull(),

    shippingState: text("shipping_state").notNull(),

    shippingPostalCode: text(
      "shipping_postal_code"
    ).notNull(),

    shippingCountry: text("shipping_country").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
  ]
);

// ORDER ITEMS

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, {
        onDelete: "cascade",
      }),

    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),

    variantId: uuid("variant_id").references(
      () => productVariants.id,
      {
        onDelete: "set null",
      }
    ),

    productName: text("product_name").notNull(),

    variantName: text("variant_name"),

    sku: text("sku").notNull(),

    unitPrice: integer("unit_price").notNull(),

    quantity: integer("quantity").notNull(),

    totalPrice: integer("total_price").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
  ]
);

// PAYMENTS

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, {
        onDelete: "cascade",
      }),

    provider: text("provider").notNull(),

    providerPaymentId: text("provider_payment_id"),

    amount: integer("amount").notNull(),

    status: paymentStatusEnum("status")
      .default("PENDING")
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payments_order_id_idx").on(table.orderId),
  ]
);

// REVIEWS

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    rating: integer("rating").notNull(),

    title: text("title"),

    content: text("content"),

    isVerifiedPurchase: boolean("is_verified_purchase")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("reviews_user_product_unique").on(
      table.userId,
      table.productId
    ),

    index("reviews_product_id_idx").on(table.productId),
  ]
);