import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Card 组件，作为内容容器，带有圆角、边框和阴影。
 */
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

/**
 * 新建一个具有指定 displayName 和 classNames 的卡片组件。
 * @param displayName 组件的显示名称
 * @param classNames 组件的类名
 * @returns React 组件
 */
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

/**
 * CardHeader 组件，卡片的头部区域，通常用于放置标题等内容。
 */
const CardHeader = createCardComponent(
  'CardHeader',
  'flex flex-col space-y-1.5 p-6',
);
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle 组件，显示卡片的标题内容。
 */
const CardTitle = createCardComponent(
  'CardTitle',
  'font-semibold leading-none tracking-tight',
);
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription 组件，显示卡片的描述信息。
 */
const CardDescription = createCardComponent(
  'CardDescription',
  'text-sm text-muted-foreground',
);
CardDescription.displayName = 'CardDescription';

/**
 * CardContent 组件，卡片的主要内容区域。
 */
const CardContent = createCardComponent('CardContent', 'p-6 pt-0');
CardContent.displayName = 'CardContent';

/**
 * CardFooter 组件，卡片的底部区域，通常用于放置操作按钮等。
 */
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
