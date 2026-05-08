import React from 'react';
import { cn } from '../../lib/utils';

interface Props {
  className?: string;
  variant?: 'card' | 'circle' | 'text' | 'box';
}

export default function Skeleton({ className, variant = 'box' }: Props) {
  const getVariantClass = () => {
    switch (variant) {
      case 'circle': return 'rounded-full';
      case 'card': return 'rounded-[32px]';
      case 'text': return 'rounded h-4 w-full';
      default: return 'rounded-2xl';
    }
  };

  return (
    <div 
      className={cn(
        "bg-gray-200 animate-pulse",
        getVariantClass(),
        className
      )} 
    />
  );
}
