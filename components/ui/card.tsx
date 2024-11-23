import * as React from 'react';

import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow',
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const createCardComponent = (displayName: string, classNames: string) => {
  const Component = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ className, ...props }, ref) => (
    <div ref={ref} className={cn(classNames, className)} {...props} />
  ));
  Component.displayName = displayName;
  return Component;
};

const CardHeader = createCardComponent(
  'CardHeader',
  'flex flex-col space-y-1.5 p-6',
);
CardHeader.displayName = 'CardHeader';

const CardTitle = createCardComponent(
  'CardTitle',
  'font-semibold leading-none tracking-tight',
);
CardTitle.displayName = 'CardTitle';

const CardDescription = createCardComponent(
  'CardDescription',
  'text-sm text-muted-foreground',
);
CardDescription.displayName = 'CardDescription';

const CardContent = createCardComponent('CardContent', 'p-6 pt-0');
CardContent.displayName = 'CardContent';

const CardFooter = createCardComponent(
  'CardFooter',
  'flex items-center p-6 pt-0',
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
