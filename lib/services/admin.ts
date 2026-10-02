import "server-only";
import { getDb } from "@/lib/db";
import { NotFoundError } from "@/lib/api-errors";
import { ModerationStatus } from "@prisma/client";

export async function getAdminDashboard() {
  const db = getDb();
  const [totalStores, totalProducts, totalOrders, byStatus, deliveredAgg, recentOrders] = await Promise.all([
    db.store.count(),
    db.product.count({ where: { isArchived: false } }),
    db.order.count(),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.aggregate({ where: { status: "DELIVERED" }, _sum: { total: true } }),
    db.order.findMany({ orderBy: { placedAt: "desc" }, take: 8, include: { store: true, city: true } }),
  ]);
  const statusCounts: Record<string, number> = {};
  for (const row of byStatus) statusCounts[row.status] = row._count._all;
  return {
    totalStores,
    totalProducts,
    totalOrders,
    statusCounts,
    mockDeliveredValue: deliveredAgg._sum.total ?? 0,
    recentOrders,
  };
}

export async function listAllStores(filters: { cityId?: string; categoryId?: string } = {}) {
  const db = getDb();
  return db.store.findMany({
    where: { cityId: filters.cityId, categoryId: filters.categoryId },
    include: { city: true, category: true, owner: { select: { name: true, email: true } } },
    orderBy: { name: "asc" },
  });
}

export async function setStoreModeration(storeId: string, status: ModerationStatus) {
  const db = getDb();
  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) throw new NotFoundError("Store not found.");
  // Blocking prevents new orders/catalogue visibility (enforced in catalogue + order
  // creation services) but never cancels existing orders.
  return db.store.update({ where: { id: storeId }, data: { moderationStatus: status } });
}

export async function listAllProducts(filters: { storeId?: string; cityId?: string; categoryId?: string; availableOnly?: boolean } = {}) {
  const db = getDb();
  return db.product.findMany({
    where: {
      storeId: filters.storeId,
      categoryId: filters.categoryId,
      isAvailable: filters.availableOnly ? true : undefined,
      store: filters.cityId ? { cityId: filters.cityId } : undefined,
    },
    include: { store: true, category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllUsers() {
  const db = getDb();
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      stores: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return users;
}

export async function getBasicReports() {
  const db = getDb();
  const [byCity, byStore, byStatus, popularProducts] = await Promise.all([
    db.order.groupBy({ by: ["cityId"], _count: { _all: true } }),
    db.order.groupBy({ by: ["storeId"], _count: { _all: true } }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.orderItem.groupBy({ by: ["productId", "productName"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
  ]);
  const [cities, stores] = await Promise.all([
    db.city.findMany({ where: { id: { in: byCity.map((c) => c.cityId) } } }),
    db.store.findMany({ where: { id: { in: byStore.map((s) => s.storeId) } } }),
  ]);
  const cityNameById = new Map(cities.map((c) => [c.id, c.name]));
  const storeNameById = new Map(stores.map((s) => [s.id, s.name]));
  return {
    byCity: byCity.map((c) => ({ city: cityNameById.get(c.cityId) ?? "Unknown", count: c._count._all })),
    byStore: byStore.map((s) => ({ store: storeNameById.get(s.storeId) ?? "Unknown", count: s._count._all })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
    popularProducts: popularProducts.map((p) => ({ name: p.productName, quantity: p._sum.quantity ?? 0 })),
  };
}
