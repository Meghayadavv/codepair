import React, { useContext } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AppContext } from '@/App';
import { useMobile } from '@/hooks/use-mobile';

export default function Navbar() {
  const [location] = useLocation();
  const { user, setUser } = useContext(AppContext);
  const isMobile = useMobile();

  const handleLogout = () => {
    // Clear user data and redirect to login
    setUser(null);
    window.location.href = "/auth";
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <span className="text-primary-500 font-bold text-xl cursor-pointer">CodePair</span>
              </Link>
            </div>
            
            {!isMobile && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/">
                  <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location === "/" 
                      ? "bg-slate-900 text-white" 
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}>
                    Dashboard
                  </a>
                </Link>
                <Link href="/find-partners">
                  <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location === "/find-partners" 
                      ? "bg-slate-900 text-white" 
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}>
                    Find Partners
                  </a>
                </Link>
                <Link href="/history">
                  <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location === "/history" 
                      ? "bg-slate-900 text-white" 
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}>
                    History
                  </a>
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {user && (
              <>
                <button className="bg-slate-700 p-1 rounded-full text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white mr-4">
                  <span className="sr-only">View notifications</span>
                  <i className="bi bi-bell h-6 w-6 block p-1"></i>
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.displayName} />
                        <AvatarFallback className="bg-primary-700">{user.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            
            {isMobile && (
              <div className="ml-4">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <i className="bi bi-list h-6 w-6 block"></i>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
