import React from 'react';
import { Badge } from '@/components/ui/badge';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

/**
 * RoleBadge component
 * Displays a styled badge showing user's system role
 * Used to indicate who is enrolled in courses (student, faculty, admin)
 */
export function RoleBadge({ role, className }: RoleBadgeProps) {
  const getRoleDisplay = (role: string): string => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'faculty':
        return 'Faculty';
      case 'admin':
        return 'Admin';
      case 'pending_faculty':
        return 'Pending Faculty';
      default:
        return role;
    }
  };

  const getRoleVariant = (role: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (role) {
      case 'student':
        return 'secondary'; // Gray for students
      case 'faculty':
        return 'default'; // Blue/primary for faculty
      case 'admin':
        return 'destructive'; // Red for admin
      case 'pending_faculty':
        return 'outline'; // Outline for pending
      default:
        return 'secondary';
    }
  };

  return (
    <Badge
      variant={getRoleVariant(role)}
      className={className}
    >
      {getRoleDisplay(role)}
    </Badge>
  );
}
