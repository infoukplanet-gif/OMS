"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Tag,
  Users,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  ChevronDown,
  CreditCard,
  ClipboardList,
  Mail,
  type LucideIcon,
} from "lucide-react";

const SidebarContext = createContext({
  collapsed: false,
  setCollapsed: (_: boolean) => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "ダッシュボード", href: "/" },
  {
    icon: ShoppingCart, label: "受注", href: "/orders",
    children: [
      { label: "受注一覧", href: "/orders" },
      { label: "受注詳細", href: "/orders/details" },
      { label: "受注明細一覧", href: "/orders/items" },
      { label: "一括登録(CSV)", href: "/orders/import" },
      { label: "登録パターン", href: "/orders/import-patterns" },
      { label: "伝票有効化", href: "/orders/activate" },
      { label: "備考欄確認", href: "/orders/notes" },
      { label: "分類タグ", href: "/orders/tags" },
      { label: "確認内容設定", href: "/orders/confirm-settings" },
    ],
  },
  {
    icon: Truck, label: "出荷", href: "/shipments",
    children: [
      { label: "出荷一覧", href: "/shipments" },
      { label: "納品書・指示書", href: "/shipments/documents" },
      { label: "検品サポート", href: "/shipments/inspection" },
      { label: "配送番号反映", href: "/shipments/tracking" },
      { label: "欠品処理", href: "/shipments/shortage" },
      { label: "不良品振替", href: "/shipments/defective-transfer" },
    ],
  },
  {
    icon: Tag, label: "商品", href: "/products",
    children: [
      { label: "商品一覧", href: "/products" },
      { label: "商品登録", href: "/products/new" },
      { label: "商品一括登録", href: "/products/import" },
      { label: "モール商品一括登録", href: "/products/mall-import" },
      { label: "セット商品登録", href: "/products/sets/new" },
      { label: "商品マスタダウンロード", href: "/products/master-download" },
      { label: "在庫管理", href: "/products/inventory" },
      { label: "在庫変動履歴", href: "/products/inventory/history" },
      { label: "在庫更新処理", href: "/products/inventory/update" },
      { label: "在庫連携確認", href: "/products/inventory/check" },
      { label: "拠点と店舗の在庫連携", href: "/products/inventory/warehouse-link" },
      { label: "引当拠点パターン設定", href: "/products/inventory/allocation-pattern" },
      { label: "引当自動実行", href: "/products/allocation/auto" },
      { label: "棚卸", href: "/products/stocktaking" },
      { label: "店舗内カテゴリマスタ", href: "/products/categories" },
      { label: "カテゴリ変換設定", href: "/products/category-mapping" },
      { label: "独自タグ登録", href: "/products/tags" },
      { label: "納期区分設定", href: "/products/delivery-period" },
      { label: "コード紐づけ", href: "/products/code-mapping" },
      { label: "商品情報自動作成", href: "/products/auto-create" },
    ],
  },
  {
    icon: Users, label: "顧客", href: "/customers",
    children: [
      { label: "顧客一覧", href: "/customers" },
      { label: "顧客登録", href: "/customers/new" },
      { label: "卸先マスタ", href: "/customers/wholesale" },
      { label: "ブラックリスト", href: "/customers/blacklist" },
      { label: "顧客マスタ自動作成", href: "/customers/auto-create" },
    ],
  },
  {
    icon: CreditCard, label: "入金・決済", href: "/payments",
    children: [
      { label: "入金管理", href: "/payments" },
      { label: "金額不整合", href: "/payments/mismatch" },
      { label: "支払方法別手数料", href: "/payments/fees" },
    ],
  },
  {
    icon: ClipboardList, label: "発注・仕入", href: "/purchasing",
    children: [
      { label: "発注伝票", href: "/purchasing" },
      { label: "発注計算", href: "/purchasing/calculate" },
      { label: "仕入先マスタ", href: "/purchasing/suppliers" },
      { label: "返品管理", href: "/purchasing/returns" },
    ],
  },
  {
    icon: Mail, label: "メール", href: "/mail",
    children: [
      { label: "メール設定", href: "/mail" },
      { label: "メール送信処理", href: "/mail/send" },
      { label: "送信待ち", href: "/mail/pending" },
      { label: "送信履歴", href: "/mail/history" },
    ],
  },
  { icon: BarChart3, label: "分析", href: "/analytics" },
  {
    icon: Settings, label: "設定", href: "/settings",
    children: [
      { label: "企業設定", href: "/settings" },
      { label: "担当者・権限", href: "/settings/users" },
      { label: "拠点管理", href: "/settings/warehouses" },
      { label: "受注設定", href: "/settings/order-rules" },
      { label: "規定値設定", href: "/settings/defaults" },
      { label: "テンプレート", href: "/settings/templates" },
      { label: "カテゴリ変換設定", href: "/settings/category-conversion" },
      { label: "自動実行処理", href: "/settings/automation" },
      { label: "API設定", href: "/settings/api" },
      { label: "受注取得API処理", href: "/settings/api/order-fetch" },
      { label: "ダウンロード履歴", href: "/settings/download-history" },
      { label: "その他設定", href: "/settings/misc" },
      { label: "機能一覧", href: "/settings/sitemap" },
    ],
  },
];

function NavItem({ item }: { item: MenuItem }) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();

  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href));

  const hasChildren = item.children && item.children.length > 0;

  // Initial open state: open if any child is currently active
  const [isOpen, setIsOpen] = useState(() => {
    if (!hasChildren) return false;
    return item.children!.some(
      (c) => pathname === c.href || (c.href !== item.href && pathname.startsWith(c.href))
    );
  });

  if (collapsed) {
    return (
      <Link
        href={item.href}
        title={item.label}
        className={cn(
          "flex items-center justify-center rounded-xl py-2.5 text-sm transition-all duration-200",
          "hover:bg-white/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.04)]",
          isActive
            ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_rgba(59,130,246,0.1)] text-blue-600 font-medium"
            : "text-gray-600"
        )}
      >
        <item.icon className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center rounded-xl text-sm transition-all duration-200",
          "hover:bg-white/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.04)]",
          isActive && !hasChildren
            ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_rgba(59,130,246,0.1)] text-blue-600 font-medium"
            : isActive
            ? "text-blue-600 font-medium"
            : "text-gray-600"
        )}
      >
        <Link href={item.href} className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0">
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="whitespace-nowrap truncate">{item.label}</span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 mr-1 rounded hover:bg-white/60 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="サブメニュー切替"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/40 pl-3">
          {item.children!.map((child) => {
            const cActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150",
                  cActive
                    ? "bg-white/80 text-blue-600 font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out",
        "bg-white/70 backdrop-blur-2xl",
        "border-r border-white/60",
        "shadow-[0_8px_32px_rgba(0,0,0,0.06)]",
        collapsed ? "w-[68px]" : "w-56"
      )}
    >
      {/* Logo + Toggle */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-white/40">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 font-bold text-sm">
            O
          </div>
          <span
            className={cn(
              "text-base font-semibold text-gray-800 whitespace-nowrap transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            OMS
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-all duration-200",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => (
          <NavItem key={item.href + item.label} item={item} />
        ))}
      </nav>

      {/* Dark mode */}
      <div className="px-2 py-3 border-t border-white/40">
        <button
          onClick={toggleDarkMode}
          title={collapsed ? (darkMode ? "ライトモード" : "ダークモード") : undefined}
          className={cn(
            "flex w-full items-center rounded-xl py-2.5 text-sm text-gray-600 hover:bg-white/80 transition-all duration-200",
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          )}
        >
          {darkMode ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
          <span className={cn("whitespace-nowrap transition-all duration-300", collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
            {darkMode ? "ライトモード" : "ダークモード"}
          </span>
        </button>
      </div>
    </aside>
  );
}
