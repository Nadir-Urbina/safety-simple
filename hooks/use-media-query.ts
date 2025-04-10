"use client"

import { useState, useEffect } from "react"

type BreakpointKey = "sm" | "md" | "lg" | "xl" | "2xl";

const breakpoints: Record<BreakpointKey, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536
};

/**
 * Custom hook for responsive design
 * Returns an object with boolean values for common screen size breakpoints:
 * - isMobile: screens < 768px (sm to md)
 * - isTablet: screens >= 768px and < 1024px (md to lg)
 * - isDesktop: screens >= 1024px (lg and above)
 * - isSmall: screens < 640px (below sm)
 * - isLargeDesktop: screens >= 1280px (xl and above)
 * - is[Size]: boolean for each breakpoint (e.g., isSm, isMd, etc.)
 * - atLeast[Size]: boolean for if the screen is at least that size
 * - atMost[Size]: boolean for if the screen is at most that size
 */
export function useMediaQuery() {
  const [windowSize, setWindowSize] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    // Initialize with current window size
    setWindowSize(window.innerWidth);
    
    // Update on resize
    const handleResize = () => {
      setWindowSize(window.innerWidth);
    };
    
    window.addEventListener("resize", handleResize);
    
    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Only run on client-side
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      isSmall: false,
      isLargeDesktop: false,
      isSm: false,
      isMd: false,
      isLg: false,
      isXl: false,
      is2xl: false,
      atLeastSm: false,
      atLeastMd: false,
      atLeastLg: false,
      atLeastXl: false,
      atLeast2xl: false,
      atMostSm: false,
      atMostMd: false,
      atMostLg: false,
      atMostXl: false,
      atMost2xl: false,
      width: 0
    };
  }
  
  // If windowSize is undefined (SSR), return default values
  if (windowSize === undefined) {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      isSmall: false,
      isLargeDesktop: false,
      isSm: false,
      isMd: false,
      isLg: false,
      isXl: false,
      is2xl: false,
      atLeastSm: false,
      atLeastMd: false,
      atLeastLg: false,
      atLeastXl: false,
      atLeast2xl: false,
      atMostSm: false,
      atMostMd: false,
      atMostLg: false,
      atMostXl: false,
      atMost2xl: false,
      width: 0
    };
  }
  
  // Calculate breakpoint values
  const width = windowSize;
  const isSm = width >= breakpoints.sm && width < breakpoints.md;
  const isMd = width >= breakpoints.md && width < breakpoints.lg;
  const isLg = width >= breakpoints.lg && width < breakpoints.xl;
  const isXl = width >= breakpoints.xl && width < breakpoints["2xl"];
  const is2xl = width >= breakpoints["2xl"];
  
  // Calculate "at least" values
  const atLeastSm = width >= breakpoints.sm;
  const atLeastMd = width >= breakpoints.md;
  const atLeastLg = width >= breakpoints.lg;
  const atLeastXl = width >= breakpoints.xl;
  const atLeast2xl = width >= breakpoints["2xl"];
  
  // Calculate "at most" values
  const atMostSm = width < breakpoints.md;
  const atMostMd = width < breakpoints.lg;
  const atMostLg = width < breakpoints.xl;
  const atMostXl = width < breakpoints["2xl"];
  const atMost2xl = true; // Always true as we don't have a larger breakpoint
  
  // Convenience combinations
  const isMobile = width < breakpoints.md; // Less than md
  const isTablet = width >= breakpoints.md && width < breakpoints.lg; // md to lg
  const isDesktop = width >= breakpoints.lg; // lg and above
  const isSmall = width < breakpoints.sm; // Less than sm
  const isLargeDesktop = width >= breakpoints.xl; // xl and above
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmall,
    isLargeDesktop,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    atLeastSm,
    atLeastMd,
    atLeastLg,
    atLeastXl,
    atLeast2xl,
    atMostSm,
    atMostMd,
    atMostLg,
    atMostXl,
    atMost2xl,
    width
  };
} 