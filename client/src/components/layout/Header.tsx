import { useState } from "react";
import { 
  MenuIcon, 
  SearchIcon, 
  PlusIcon, 
  BellIcon, 
  DownloadIcon,
  UploadIcon
} from "lucide-react";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import ImportTransactionsModal from "@/components/common/ImportTransactionsModal";

type HeaderProps = {
  title: string;
  subtitle?: string;
  showExport?: boolean;
  showImport?: boolean;
};

export default function Header({ title, subtitle, showExport = false, showImport = false }: HeaderProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
            <h1 className="ml-2 text-xl font-bold font-inter md:hidden">FinTrack</h1>
          </div>
          
          <div className="hidden md:block">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
              <SearchIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              className="hidden md:flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light transition"
              onClick={() => {}}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Account
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-alert rounded-full"></span>
              </Button>
            </div>
            <div className="flex items-center">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="User avatar" 
                className="h-8 w-8 rounded-full"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold font-inter text-text">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-text-light">{subtitle}</p>}
          </div>
          {(showExport || showImport) && (
            <div className="mt-4 md:mt-0 flex space-x-3">
              {showExport && (
                <Button variant="outline" className="px-4 py-2 bg-white text-text-light border border-gray-300 rounded-md hover:bg-gray-50">
                  <DownloadIcon className="h-5 w-5 mr-2" />
                  Export
                </Button>
              )}
              {showImport && (
                <Button 
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
                  onClick={() => setIsImportModalOpen(true)}
                >
                  <UploadIcon className="h-5 w-5 mr-2" />
                  Import Transactions
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <ImportTransactionsModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
    </>
  );
}
