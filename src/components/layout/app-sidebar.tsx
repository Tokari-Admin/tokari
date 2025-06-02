
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  History,
  UserCircle,
  LogOut,
  UserCog,
  Home,
  KanbanSquare, // Added for Task Board
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import AppLogo from "@/components/icons/app-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Skeleton } from "../ui/skeleton";

const navItems = [
  { href: "/deleguer", icon: Briefcase, label: "Déléguer" },
  { href: "/mes-operations", icon: History, label: "Mes Opérations" },
  { href: "/task-board", icon: KanbanSquare, label: "Tableau de Tâches" }, // New Task Board link
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { state, isMobile } = useSidebar();


  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="items-center p-4">
        {state === "expanded" || isMobile ? (
          <AppLogo className="h-8 text-primary" />
        ) : (
           <Link href="/deleguer" aria-label="Tokari Home">
            <Home className="h-7 w-7 text-primary" />
           </Link>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {loading && (
            <>
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
            </>
          )}
          {!loading && navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/deleguer" && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label }}
                  className="justify-start"
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {loading ? (
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            {state === 'expanded' && <Skeleton className="h-4 w-24" />}
          </div>
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 p-2">
                <Avatar className="h-8 w-8">
                  {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || user.email || "User"} />}
                  <AvatarFallback>
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle />}
                  </AvatarFallback>
                </Avatar>
                {(state === "expanded" || isMobile) && (
                  <span className="truncate text-sm font-medium">
                    {user.displayName || user.email}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">
                    {user.displayName || "Wealth Manager"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
