'use client';

import React, { forwardRef } from 'react';

export interface MotionProps extends React.HTMLAttributes<HTMLElement> {
  initial?: Record<string, any> | boolean;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
  whileHover?: Record<string, any>;
  whileTap?: Record<string, any>;
  layout?: boolean | 'position';
  asChild?: boolean;
  [key: string]: any;
}

function createMotionComponent<T extends keyof React.JSX.IntrinsicElements>(tag: T) {
  const Component = forwardRef<HTMLElement, MotionProps>((props, ref) => {
    const {
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      layout,
      className = '',
      style = {},
      children,
      ...rest
    } = props;

    const computedStyle: React.CSSProperties = {
      ...style,
      transition:
        style.transition ||
        `all ${transition?.duration ? `${transition.duration}s` : '260ms'} cubic-bezier(0.22, 1, 0.36, 1)`
    };

    if (animate && typeof animate === 'object') {
      if (typeof animate.opacity === 'number') {
        computedStyle.opacity = animate.opacity;
      }
      const transforms: string[] = [];
      if (typeof animate.y === 'number') transforms.push(`translateY(${animate.y}px)`);
      if (typeof animate.x === 'number') transforms.push(`translateX(${animate.x}px)`);
      if (typeof animate.scale === 'number') transforms.push(`scale(${animate.scale})`);
      if ( typeof animate.rotate === 'number') transforms.push(`rotate(${animate.rotate}deg)`);
      if (transforms.length > 0) {
        computedStyle.transform = transforms.join(' ');
      }
    }

    const interactiveClasses = [
      'transition-all duration-200 ease-out',
      whileTap ? 'active:scale-[0.96]' : '',
      whileHover ? 'hover:-translate-y-[1px]' : '',
      className
    ]
      .filter(Boolean)
      .join(' ');

    return React.createElement(
      tag,
      {
        ref,
        className: interactiveClasses,
        style: computedStyle,
        ...rest
      },
      children
    );
  });

  Component.displayName = `motion.${String(tag)}`;
  return Component;
}

export const motion = {
  div: createMotionComponent('div'),
  section: createMotionComponent('section'),
  button: createMotionComponent('button'),
  span: createMotionComponent('span'),
  header: createMotionComponent('header'),
  article: createMotionComponent('article'),
  a: createMotionComponent('a'),
  p: createMotionComponent('p')
};

export function AnimatePresence({
  children
}: {
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
  initial?: boolean;
}) {
  return <>{children}</>;
}
