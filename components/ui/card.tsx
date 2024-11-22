import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card 组件，使用 forwardRef 转发 ref
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * 创建一个带有指定 displayName 和 classNames 的组件
 * @param displayName - 组件的显示名称
 * @param classNames - 组件的 CSS 类名
 * @returns 带有指定 displayName 和 classNames 的组件
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
 * CardHeader 组件，使用 flex 布局，带有内边距
 */
const CardHeader = createCardComponent("CardHeader", "flex flex-col space-y-1.5 p-6");
CardHeader.displayName = "CardHeader";

/**
 * CardTitle 组件，带有字体加粗和紧凑的行间距
 */
const CardTitle = createCardComponent("CardTitle", "font-semibold leading-none tracking-tight");
CardTitle.displayName = "CardTitle";

/**
 * CardDescription 组件，带有较小的字体和 muted-foreground 颜色
 */
const CardDescription = createCardComponent("CardDescription", "text-sm text-muted-foreground");
CardDescription.displayName = "CardDescription";

/**
 * CardContent 组件，带有内边距
 */
const CardContent = createCardComponent("CardContent", "p-6 pt-0");
CardContent.displayName = "CardContent";

/**
 * CardFooter 组件，使用 flex 布局，带有内边距
 */
const CardFooter = createCardComponent("CardFooter", "flex items-center p-6 pt-0");
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
