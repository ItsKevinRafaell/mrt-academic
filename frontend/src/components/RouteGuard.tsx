'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

/**
 * Route guard component that redirects users without required roles
 */
export function RouteGuard({
  children,
  allowedRoles,
  fallbackPath = '/dashboard'
}: RouteGuardProps) {
  const { user, role, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Redirect to login if not authenticated
      if (!user) {
        router.push('/login');
        return;
      }

      // Redirect to fallback if user doesn't have required role
      if (!role || !allowedRoles.includes(role)) {
        router.push(fallbackPath);
      }
    }
  }, [user, role, isLoading, allowedRoles, fallbackPath, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't have access
  if (!user || !role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}

export default RouteGuard;
