import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FormCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  category?: string;
  required?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  href?: string;
  variant?: "default" | "outline" | "highlight";
  buttonText?: string;
  startAction?: React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

// Helper function to get category badge styles
function getCategoryBadge(category: string) {
  switch (category?.toLowerCase()) {
    case "incident":
      return <Badge variant="destructive">Incident</Badge>;
    case "recognition":
      return <Badge variant="success">Recognition</Badge>;
    case "heat":
    case "heatprevention":
      return <Badge variant="warning">Heat</Badge>;
    case "near miss":
    case "nearmiss":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Near Miss</Badge>;
    case "vehicle":
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Vehicle</Badge>;
    default:
      return <Badge variant="secondary">{category}</Badge>;
  }
}

export function FormCard({
  icon: Icon,
  title,
  description,
  category,
  required,
  children,
  footer,
  href,
  variant = "default",
  buttonText,
  startAction,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  className,
}: FormCardProps) {
  return (
    <Card className={cn(
      "h-full flex flex-col transition-all duration-200 hover:shadow-md", 
      variant === "highlight" && "border-primary",
      variant === "outline" && "border-2",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            iconBgColor
          )}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {category && getCategoryBadge(category)}
            {required && <Badge variant="destructive">Required</Badge>}
          </div>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription className="mt-1.5">{description}</CardDescription>}
      </CardHeader>
      
      {children && (
        <CardContent className="pt-0 pb-3 flex-1">
          {children}
        </CardContent>
      )}
      
      <CardFooter className="gap-2 flex-wrap pt-0">
        {startAction}
        {footer || (buttonText && href && (
          <Button className="w-full" asChild>
            <Link href={href}>{buttonText}</Link>
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
} 