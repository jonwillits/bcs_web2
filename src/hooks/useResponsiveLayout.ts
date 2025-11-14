"use client";

import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveLayoutConfig {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

/**
 * Hook to detect current breakpoint and provide responsive layout utilities
 *
 * Breakpoints:
 * - mobile: < 768px
 * - tablet: 768px - 1279px
 * - desktop: >= 1280px
 */
export function useResponsiveLayout(): ResponsiveLayoutConfig {
  const [config, setConfig] = useState<ResponsiveLayoutConfig>(() => {
    // Initialize with safe defaults for SSR
    if (typeof window === 'undefined') {
      return {
        breakpoint: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1280,
      };
    }

    const width = window.innerWidth;
    return getBreakpointConfig(width);
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setConfig(getBreakpointConfig(width));
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return config;
}

function getBreakpointConfig(width: number): ResponsiveLayoutConfig {
  if (width < 768) {
    return {
      breakpoint: 'mobile',
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      width,
    };
  }

  if (width < 1280) {
    return {
      breakpoint: 'tablet',
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      width,
    };
  }

  return {
    breakpoint: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width,
  };
}
