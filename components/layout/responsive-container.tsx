import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  paddingX?: boolean;
  paddingY?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  size = "lg",
  paddingX = true,
  paddingY = true,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto",
        // Max width based on size
        size === "sm" && "max-w-screen-sm",
        size === "md" && "max-w-screen-md",
        size === "lg" && "max-w-screen-lg",
        size === "xl" && "max-w-screen-xl",
        size === "full" && "max-w-none",
        
        // Horizontal padding
        paddingX && "px-4 sm:px-6 md:px-8",
        
        // Vertical padding
        paddingY && "py-4 sm:py-6 md:py-8",
        
        className
      )}
    >
      {children}
    </div>
  );
} 