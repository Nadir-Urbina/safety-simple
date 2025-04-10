import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  href?: string;
  variant?: "default" | "outline" | "highlight";
  buttonText?: string;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  children,
  footer,
  href,
  variant = "default",
  buttonText,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  className,
}: FeatureCardProps) {
  // Only use Link wrapper if we don't have a buttonText
  const useWrapperLink = href && !buttonText;
  const CardWrapper = useWrapperLink ? Link : React.Fragment;
  const wrapperProps = useWrapperLink ? { href, className: "block" } : {};

  return (
    <CardWrapper {...wrapperProps}>
      <Card 
        className={cn(
          "h-full flex flex-col transition-all duration-200", 
          variant === "highlight" && "border-primary",
          variant === "outline" && "border-2",
          useWrapperLink && "hover:shadow-md",
          className
        )}
      >
        <CardHeader>
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mb-4",
            iconBgColor
          )}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        
        {children && (
          <CardContent className="flex-1">
            {children}
          </CardContent>
        )}
        
        {(footer || buttonText) && (
          <CardFooter className="pt-0">
            {footer || (buttonText && href && (
              <Button variant="outline" className="w-full" asChild>
                <Link href={href}>{buttonText}</Link>
              </Button>
            ))}
          </CardFooter>
        )}
      </Card>
    </CardWrapper>
  );
} 