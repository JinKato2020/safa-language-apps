import { Pressable, View } from 'react-native';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useI18n } from './i18n';
import { useScaleStyle } from './SettingsContext';

// Navigation invokes this callback directly. Keep component hooks inside the
// returned element instead of adding them to the navigator's render lifecycle.
export const renderStudyHeader = (props: NativeStackHeaderProps) => <StudyHeader {...props} />;

/** Use a normal React touch target for study screens, independent of native back-button layout. */
export default function StudyHeader({ navigation, options }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets(), { lang , copy: trCopy } = useI18n(), ss = useScaleStyle();
  return <View style={{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right, backgroundColor: '#f8faf9' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: 8, paddingHorizontal: 8 }}>
      <Pressable testID="study-back" accessibilityRole="button" accessibilityLabel={trCopy('c_b72cd401b9a6', '戻る', 'Back')}
        hitSlop={4} onPress={() => { if (navigation.isFocused()) { if (navigation.canGoBack()) navigation.goBack(); else navigation.navigate('MainTabs'); } }}
        style={({ pressed }) => ({ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: pressed ? '#dcebe5' : '#eef4f1' })}>
        <Text style={{ fontSize: 36, lineHeight: 42, color: '#123039' }}>‹</Text>
      </Pressable>
      <Text accessibilityRole="header" style={[{ flex: 1, color: '#123039', fontWeight: '700' }, ss(17, 26)]}>{options.title ?? (trCopy('c_8fcb913ad4d2', '学習', 'Learning'))}</Text>
      <View style={{ width: 48 }} />
    </View>
  </View>;
}
