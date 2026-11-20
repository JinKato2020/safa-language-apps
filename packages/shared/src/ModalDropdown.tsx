// 汎用モーダル式ドロップダウン。トリガー(現在値+▾)をタップ → 一覧をモーダルで下から提示。
// react-native の Modal のみ使用(外部ライブラリ不要・全OS同じ見た目)。言語選択など共通利用。
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, spacing, radius } from './theme';

export type DropdownItem<T extends string> = { value: T; label: string; sub?: string };

export function ModalDropdown<T extends string>({
  items, value, onChange, placeholder, size = 'normal', accent = colors.accentJa, labelAlignment = 'left', palette,
}: {
  items: DropdownItem<T>[];
  value: T | null;
  onChange: (v: T) => void;
  placeholder?: string;
  size?: 'normal' | 'large';
  accent?: string;
  labelAlignment?: 'left' | 'right';
  palette?: { surface: string; ink: string; muted: string; line: string; accent: string; soft: string };
}) {
  const [open, setOpen] = useState(false);
  const current = items.find(i => i.value === value) ?? null;
  const big = size === 'large';
  const ink = palette && { color: palette.ink };
  const muted = palette && { color: palette.muted };
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, big && styles.triggerLarge, palette && { backgroundColor: palette.surface, borderColor: palette.line }]}
        accessibilityRole="button"
      >
        <View style={{ flex: big ? 0 : 1 }}>
          <Text style={[big ? styles.triggerTextLarge : styles.triggerText, !big && { textAlign: labelAlignment }, !current && styles.placeholder, current ? ink : muted]}>
            {current ? current.label : (placeholder ?? '—')}
          </Text>
          {big && current?.sub ? <Text style={[styles.triggerSub, muted]}>{current.sub}</Text> : null}
        </View>
        <Text style={[styles.chevron, big && styles.chevronLarge, muted]}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, palette && { backgroundColor: palette.surface }]} onPress={() => {}}>
            <ScrollView bounces={false}>
              {items.map(it => {
                const on = it.value === value;
                return (
                  <Pressable
                    key={it.value}
                    onPress={() => { onChange(it.value); setOpen(false); }}
                    style={[styles.option, on && { backgroundColor: palette?.soft ?? colors.lineSoft }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionText, ink, { textAlign: labelAlignment }, on && { color: palette?.accent ?? accent, fontWeight: '700' }]}>{it.label}</Text>
                      {it.sub ? <Text style={[styles.optionSub, muted, { textAlign: labelAlignment }]}>{it.sub}</Text> : null}
                    </View>
                    <Text accessible={false} style={[styles.check, { color: palette?.accent ?? accent }]}>{on ? '✓' : ''}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.surface, minWidth: 120,
  },
  triggerLarge: { width: 248, paddingVertical: 16, justifyContent: 'center' },
  triggerText: { fontSize: 14, color: colors.inkSoft, textAlign: 'left' },
  triggerTextLarge: { fontSize: 20, fontWeight: '700', color: colors.inkSoft, textAlign: 'center' },
  triggerSub: { fontSize: 12, color: colors.inkQuiet, textAlign: 'center', marginTop: 2 },
  placeholder: { color: colors.inkFaint },
  chevron: { fontSize: 12, color: colors.inkQuiet, marginLeft: spacing.sm },
  chevronLarge: { fontSize: 16, marginLeft: spacing.md },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  sheet: { width: '100%', maxWidth: 360, maxHeight: '70%', backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', paddingVertical: spacing.xs },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14 },
  optionText: { fontSize: 16, color: colors.inkSoft, textAlign: 'left' },
  optionSub: { fontSize: 12, color: colors.inkQuiet, marginTop: 2, textAlign: 'left' },
  check: { fontSize: 16, width: 20, textAlign: 'center', marginLeft: spacing.md },
});
