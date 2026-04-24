"use client";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Ban, CreditCard, Truck, ArrowRight } from "lucide-react";

const cards = [
  {
    href: "/orders/categories/cancel",
    icon: Ban,
    title: "キャンセル区分",
    desc: "受注キャンセル理由をマスタとして管理します。",
    accent: "text-red-600 bg-red-500/10 border-red-500/20",
  },
  {
    href: "/orders/categories/payment",
    icon: CreditCard,
    title: "支払区分",
    desc: "支払方法・手数料・前払/後払の区分を管理します。",
    accent: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  },
  {
    href: "/orders/categories/shipping",
    icon: Truck,
    title: "発送区分",
    desc: "発送方法・送料・リード日数・代引対応を管理します。",
    accent: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  },
];

export default function CategoriesHubPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">区分名称設定</h1>
        <p className="text-sm text-gray-500 mt-1">
          受注で使う3種類の区分（キャンセル・支払・発送）の名称と属性を設定します。
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="block">
            <GlassCard className="h-full hover:bg-white/85 transition-colors">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${c.accent} mb-3`}>
                <c.icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-gray-800">{c.title}</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{c.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                開く <ArrowRight className="h-3 w-3" />
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
