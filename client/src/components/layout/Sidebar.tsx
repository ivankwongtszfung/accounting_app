import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  HomeIcon, 
  CreditCardIcon, 
  FileIcon, 
  BarChartIcon, 
  ShoppingBagIcon, 
  SettingsIcon, 
  HelpCircleIcon, 
  LogOutIcon
} from "lucide-react";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
};

const NavItem = ({ href, icon, children, isActive }: NavItemProps) => {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center px-4 py-2 rounded-md",
        isActive 
          ? "text-primary bg-green-50" 
          : "text-text-light hover:bg-gray-50"
      )}
    >
      <span className="mr-3">{icon}</span>
      {children}
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div id="sidebar" className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 p-4">
      <div className="flex items-center mb-8">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <HomeIcon className="h-5 w-5 text-white" />
        </div>
        <h1 className="ml-2 text-xl font-bold font-inter">FinTrack</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        <NavItem href="/" icon={<HomeIcon className="h-5 w-5" />} isActive={location === "/"}>
          Dashboard
        </NavItem>
        <NavItem href="/accounts" icon={<CreditCardIcon className="h-5 w-5" />} isActive={location === "/accounts"}>
          Accounts
        </NavItem>
        <NavItem href="/transactions" icon={<FileIcon className="h-5 w-5" />} isActive={location === "/transactions"}>
          Transactions
        </NavItem>
        <NavItem href="/insights" icon={<BarChartIcon className="h-5 w-5" />} isActive={location === "/insights"}>
          Insights
        </NavItem>
        <NavItem href="/budgets" icon={<ShoppingBagIcon className="h-5 w-5" />} isActive={location === "/budgets"}>
          Budgets
        </NavItem>
        <NavItem href="/settings" icon={<SettingsIcon className="h-5 w-5" />} isActive={location === "/settings"}>
          Settings
        </NavItem>
      </nav>
      
      <div className="mt-auto border-t border-gray-200 pt-4">
        <NavItem href="/help" icon={<HelpCircleIcon className="h-5 w-5" />}>
          Help & Support
        </NavItem>
        <NavItem href="/logout" icon={<LogOutIcon className="h-5 w-5" />}>
          Logout
        </NavItem>
      </div>
    </div>
  );
}
