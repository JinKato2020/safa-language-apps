import { StyleSheet } from 'react-native';

export const learningStyles = StyleSheet.create({
  card: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: 16, padding: 16, gap: 10, marginVertical: 12 },
  title: { color: '#1e3a8a', fontWeight: '700' }, body: { color: '#334155' },
  primary: { backgroundColor: '#1e3a8a', borderRadius: 10, padding: 12, minHeight: 48, justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  secondary: { borderColor: '#94a3b8', borderWidth: 1, backgroundColor: '#fff', borderRadius: 10, minHeight: 48, padding: 12, justifyContent: 'center' },
  link: { color: '#1e40af', fontWeight: '600', textAlign: 'center' }, error: { color: '#9f1239' },
  green: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }, greenText: { color: '#065f46', fontWeight: '700' },
  violet: { backgroundColor: '#f5f3ff', borderColor: '#c4b5fd' }, badge: { color: '#5b21b6', fontWeight: '700' },
});
