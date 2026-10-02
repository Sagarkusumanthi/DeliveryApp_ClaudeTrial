"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { RecipientSummary } from "@/components/RecipientSummary";
import { GiftMessagePreview } from "@/components/GiftMessagePreview";
import { PriceSummary } from "@/components/PriceSummary";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { buildTimeline, ORDER_STATUS_EXPLANATIONS } from "@/lib/services/orderStateMachine";
import { RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";

const POLL_MS = 15000;

export default function TrackOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback((silent = false) => {
    if (!silent) setRefreshing(true);
    fetch(`/api/orders/${params.id}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).message ?? "Order not found.");
        return r.json();
      })
      .then((d) => {
        setOrder(d.order);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setRefreshing(false));
  }, [params.id]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(true), POLL_MS);
    function onFocus() {
      load(true);
    }
    window.addEventListener("focus", onFocus);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  if (error && !order) {
    return (
      <CustomerShell>
        <div className="p-4">
          <ErrorState message={error} onRetry={() => load()} />
        </div>
      </CustomerShell>
    );
  }

  if (!order) {
    return (
      <CustomerShell>
        <div className="space-y-3 p-4">
          <LoadingSkeleton className="h-40 w-full" />
        </div>
      </CustomerShell>
    );
  }

  const item = order.items[0];
  const timeline = buildTimeline(order.status, order.statusHistory);

  return (
    <CustomerShell>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">{order.orderCode}</p>
            <StatusBadge status={order.status} />
          </div>
          <Button variant="outline" size="sm" onClick={() => load()} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <p className="mb-4 rounded-xl bg-blush/50 p-3 text-sm text-ink">{ORDER_STATUS_EXPLANATIONS[order.status as keyof typeof ORDER_STATUS_EXPLANATIONS]}</p>

        {order.status === "REJECTED" ? (
          <div className="mb-5 rounded-2xl bg-red-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <p className="font-medium">Order rejected</p>
            </div>
            <p className="text-sm text-red-700">{order.rejectionReason}</p>
            <div className="mt-4 flex gap-3">
              <Link href="/products" className="flex-1">
                <Button variant="outline" className="w-full">
                  Browse alternatives
                </Button>
              </Link>
              <Link href={`/products/${item?.productId}`} className="flex-1">
                <Button className="w-full">Reorder</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
            <OrderTimeline steps={timeline} />
          </div>
        )}

        {order.status === "DELIVERED" && (
          <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
            Delivered! {order.proofImage ? "Delivery proof is available below." : "No delivery proof was added for this order."}
            {order.proofImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.proofImage} alt="Delivery proof" className="mt-3 w-full rounded-xl" />
            )}
          </div>
        )}

        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-ink">
              {item?.productName} × {item?.quantity}
            </p>
            <p className="text-xs text-muted">
              {order.store.name} · {order.city.name}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">Recipient</p>
            <RecipientSummary
              name={order.recipientName}
              phone={order.recipientPhone}
              address={order.deliveryAddress}
              landmark={order.landmark}
              pincode={order.pincode}
              city={order.city.name}
            />
          </div>
          <GiftMessagePreview message={order.giftMessage} occasion={order.occasion} senderName={order.senderName} />
          <p className="text-sm text-muted">
            Delivery: {order.deliveryOption === "STANDARD" ? "Standard" : order.deliveryOption === "EXPRESS" ? "Same-day express" : "Scheduled"}
          </p>
          <PriceSummary subtotal={order.subtotal} deliveryFee={order.deliveryFee} total={order.total} />
        </div>
      </div>
    </CustomerShell>
  );
}
