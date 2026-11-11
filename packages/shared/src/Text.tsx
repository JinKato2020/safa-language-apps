// グローバルなフォントスケールを適用する Text ラッパー。
// 使用法: import { Text } from '../Text';
//
// 設定の fontMode (大/中/小) に応じて、style の fontSize/lineHeight を
// curve-based scaledFontSize に渡してスケールする。
// 既に大きい文字 (>=30px) はほぼスケールしない (元の比率を維持)
// 小さい文字 (<=14px) は最大限スケールする (UI 要素の可読性向上)

import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { Children, isValidElement, type ReactNode } from 'react';
import { useGlobalScaleStyle } from './SettingsContext';
import { isolateLtrInArabic, textDirection } from './textDirection';

function visibleText(children: ReactNode): string {
  return Children.toArray(children).map(child => {
    if (typeof child === 'string' || typeof child === 'number') return String(child);
    if (isValidElement<{ children?: ReactNode }>(child)) return visibleText(child.props.children);
    return '';
  }).join('');
}

export function Text(props: TextProps) {
  const ss = useGlobalScaleStyle();
  const flat = StyleSheet.flatten(props.style) as TextStyle | undefined;
  let style: TextProps['style'] = props.style;

  if (flat && typeof flat === 'object' && typeof flat.fontSize === 'number') {
    const oldFs = flat.fontSize;
    const lh = typeof flat.lineHeight === 'number' ? flat.lineHeight : undefined;
    const scaled = ss(oldFs, lh);
    style = { ...flat, ...scaled };
  }
  const direction = textDirection(visibleText(props.children));
  if (direction === 'rtl') {
    // Arabic letters must remain connected; decorative tracking breaks shaping.
    style = [style, { writingDirection: 'rtl', textAlign: flat?.textAlign ?? 'right', letterSpacing: 0 }];
  } else if (direction === 'ltr') {
    style = [style, { writingDirection: 'ltr' }];
  }
  // iOS Fabric flips explicit left/right textAlign when the Text's Yoga
  // direction is RTL (RCTAttributedTextUtils.mm). Keep this text box LTR so
  // alignment stays physical; writingDirection above controls the script.
  // The surrounding screen/row remains RTL, including navigation and icons.
  style = [style, { direction: 'ltr' }];
  const children = direction === 'rtl'
    ? Children.map(props.children, child => typeof child === 'string' ? isolateLtrInArabic(child) : child)
    : props.children;
  return <RNText {...props} style={style}>{children}</RNText>;
}

export default Text;
