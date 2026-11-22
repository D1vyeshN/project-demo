import * as React from "react";
import { cn } from "@/lib/utils";

const SidebarContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>((props, ref) => {
  const { className, defaultOpen, onOpenChange, children, open, ...restProps } = props;
  const [isOpen, setIsOpen] = React.useState(defaultOpen ?? false);
  const controlledOpen = open !== undefined ? open : isOpen;

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <SidebarContext.Provider value={{ open: controlledOpen, setOpen: handleOpenChange }}>
      <div ref={ref} className={cn("relative z-50", className)} {...restProps}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
});
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-sidebar", className)}
    {...props}
  />
));
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SidebarContext);
  return (
    <button
      ref={ref}
      onClick={() => setOpen(!open)}
      className={cn("inline-flex items-center justify-center rounded-md p-2 text-sm font-medium ring-offset-background transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:hidden", className)}
      {...props}
    >
      {children}
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { setOpen } = React.useContext(SidebarContext);
  return (
    <div
      ref={ref}
      onClick={() => setOpen(false)}
      className={cn("fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)}
      {...props}
    />
  );
});
SidebarOverlay.displayName = "SidebarOverlay";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-full flex-col overflow-y-auto border-r border-sidebar shadow-sm", className)}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between px-6 py-4 border-b border-sidebar", className)}
    {...props}
  />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarGroup = ({
  className,
  children,
  label,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { label?: string }) => (
  <div
    className={cn("space-y-2 px-3 py-2", className)}
    {...props}
  >
    {label && (
      <div className="flex items-center gap-1 px-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
        {label}
      </div>
    )}
    <div className="space-y-0.5">{children}</div>
  </div>
);
SidebarGroup.displayName = "SidebarGroup";

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1 px-3 py-2", className)}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn("flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground focus:outline-none", className)}
    {...props}
  >
    {children}
  </button>
));
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuItem = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "relative flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors focus:bg-sidebar-accent focus:text-sidebar-accent-foreground focus:outline-none data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </a>
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 px-6 py-4 border-t border-sidebar mt-auto", className)}
    {...props}
  />
));
SidebarFooter.displayName = "SidebarFooter";

export {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarOverlay,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
};



