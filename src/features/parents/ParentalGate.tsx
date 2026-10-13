/**
 * Parental gate: an adult-level question that must be answered before the
 * parent area (subscription, restore, management and outside links) opens.
 * Not a "Are you a grown-up?" button: the question is written only in words
 * and changes after every wrong answer; three misses pause it briefly.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gatePauseRemaining, openParentGate, recordGateMiss } from '../../state/parentGate';
import { Icon } from '../../ui/icons';
import { colors, fonts } from '../../ui/theme';
import { isCorrect, makeChallenge, type GateChallenge } from './gateChallenge';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const;
const PAUSED = 'Please wait a little, then try a new question.';

export function ParentalGate({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [challenge, setChallenge] = useState<GateChallenge>(() => makeChallenge());
  const [typed, setTyped] = useState('');
  // A pause started on an earlier visit still applies.
  const [paused, setPaused] = useState(() => gatePauseRemaining() > 0);
  const [message, setMessage] = useState<string | null>(() => (paused ? PAUSED : null));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!paused) return;
    timer.current = setTimeout(() => {
      setPaused(false);
      setMessage(null);
    }, gatePauseRemaining() + 50);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [paused]);

  const submit = () => {
    if (paused || !typed) return;
    if (isCorrect(challenge, typed)) {
      openParentGate();
      return;
    }
    setTyped('');
    setChallenge((c) => makeChallenge(Math.random, c));
    if (recordGateMiss() > 0) {
      setPaused(true);
      setMessage(PAUSED);
    } else {
      setMessage('That’s not right. Here’s a new question.');
    }
  };

  const press = (k: (typeof KEYS)[number]) => {
    if (paused) return;
    if (k === 'ok') return submit();
    if (k === 'del') return setTyped((t) => t.slice(0, -1));
    setMessage(null);
    setTyped((t) => (t.length >= 3 ? t : t + k));
  };

  // Keypad sized to the room it has; every key at least 44 pt.
  const padRoomH = landscape ? height - insets.top - insets.bottom - 32 : height * 0.5;
  const padRoomW = landscape ? width * 0.42 : width - 48;
  const key = Math.max(44, Math.min(68, Math.floor((padRoomH - 3 * 10) / 4), Math.floor((padRoomW - 2 * 10) / 3)));

  const question = (
    <View style={[styles.question, landscape && styles.questionLandscape]}>
      <View style={styles.badge}>
        <Icon name="parent" size={26} color={colors.cyan} accent={colors.amber} />
        <Text style={styles.badgeText}>FOR GROWN-UPS</Text>
      </View>
      <Text style={styles.hint}>Ask a grown-up to answer this question.</Text>
      <Text style={styles.prompt} accessibilityRole="header" testID="gate-prompt">
        {challenge.prompt}
      </Text>
      <View style={styles.answer} accessibilityLabel={`Answer: ${typed || 'empty'}`}>
        <Text style={styles.answerText}>{typed || ' '}</Text>
      </View>
      <Text style={styles.message} accessibilityLiveRegion="polite">
        {message ?? ' '}
      </Text>
    </View>
  );

  const pad = (
    <View style={[styles.pad, { width: key * 3 + 20 }]}>
      {KEYS.map((k) => (
        <Pressable
          key={k}
          accessibilityRole="button"
          accessibilityLabel={k === 'del' ? 'Delete' : k === 'ok' ? 'Continue' : k}
          accessibilityState={{ disabled: paused }}
          disabled={paused}
          onPress={() => press(k)}
          style={({ pressed }) => [
            styles.key,
            { width: key, height: key, borderRadius: key / 2 },
            k === 'ok' && styles.keyOk,
            paused && styles.keyPaused,
            pressed && styles.pressed,
          ]}
        >
          {k === 'del' ? (
            <Icon name="back" size={key * 0.42} color={colors.text} />
          ) : k === 'ok' ? (
            <Icon name="check" size={key * 0.46} color={colors.bg} />
          ) : (
            <Text style={[styles.keyText, { fontSize: key * 0.38 }]}>{k}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8, paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to the garage"
        onPress={onClose}
        hitSlop={8}
        style={({ pressed }) => [styles.close, { top: insets.top + 10, left: insets.left + 12 }, pressed && styles.pressed]}
      >
        <Icon name="close" size={26} color={colors.text} />
      </Pressable>
      <View style={[styles.body, landscape && styles.bodyLandscape]}>
        {question}
        {pad}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  close: {
    position: 'absolute',
    zIndex: 2,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  body: { alignItems: 'center', gap: 20 },
  bodyLandscape: { flexDirection: 'row', justifyContent: 'center', gap: 40 },
  question: { alignItems: 'center', gap: 10, maxWidth: 420 },
  questionLandscape: { alignItems: 'flex-start', flexShrink: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeText: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 3, color: colors.cyan },
  hint: { fontFamily: fonts.body, fontSize: 15, color: colors.textDim },
  prompt: { fontFamily: fonts.labelBold, fontSize: 24, color: colors.text },
  answer: {
    minWidth: 120,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: { fontFamily: fonts.labelBold, fontSize: 26, letterSpacing: 4, color: colors.text },
  message: { fontFamily: fonts.body, fontSize: 14, color: colors.amber, minHeight: 18 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  key: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  keyOk: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  keyPaused: { opacity: 0.35 },
  keyText: { fontFamily: fonts.labelBold, color: colors.text },
  pressed: { transform: [{ scale: 0.94 }] },
});
