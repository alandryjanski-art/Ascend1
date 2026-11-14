
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Keyboard,
  Animated,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

// ==========================================
// ASCEND — CENTRAL INTELLIGENCE SYSTEM
// ==========================================

const API_URL = process.env.EXPO_PUBLIC_ASCEND_API_URL || '';

const STORAGE = {
  HISTORY: '@ascend_history',
  XP: '@ascend_xp',
  LEVEL: '@ascend_level',
};

const COLORS = {
  background: '#080B12',
  surface: '#111827',
  text: '#F4F6FA',
  secondary: '#8994A8',
  accent: '#B69AFF',
  waves: '#101D32',
  levelUp: '#182C20',
  giant: '#080B12',
};

const ADVISORS = [
  {
    name: 'Ezio',
    role: 'Strateg strategii i działania',
  },
  {
    name: 'Leonardo',
    role: 'Wynalazca i innowator',
  },
  {
    name: 'Borgia',
    role: 'Analityk władzy i polityki',
  },
  {
    name: 'Piłsudski',
    role: 'Przywódca i strateg państwowy',
  },
  {
    name: 'Dmowski',
    role: 'Analityk interesu narodowego',
  },
  {
    name: 'Bem',
    role: 'Dowódca i organizator',
  },
];

const SYSTEM_PROMPT = `
Jesteś Głównym Koordynatorem ASCEND.

Masz do dyspozycji sześciu doradców:
1. Ezio — strategia, odwaga i działanie.
2. Leonardo — nauka, kreatywność i wynalazczość.
3. Borgia — analiza władzy, polityki i interesów.
4. Piłsudski — przywództwo, państwowość i strategia.
5. Dmowski — analiza interesu narodowego i dyplomacja.
6. Bem — organizacja, odpowiedzialność i dowodzenie.

Przeanalizuj każdą wiadomość z perspektywy wszystkich sześciu doradców.
Następnie połącz ich perspektywy i samodzielnie wybierz najlepszą odpowiedź.

Zasady:
- Odpowiadaj po polsku.
- Bądź konkretny, inteligentny i rzeczowy.
- Nie udawaj, że historyczne postacie rzeczywiście uczestniczą w rozmowie.
- Nie stosuj pustych motywacyjnych sloganów.
- Dawaj praktyczne wskazówki.
- Pomagaj użytkownikowi rozwijać wiedzę, charakter i odpowiedzialność.
- Nie zachęcaj do przemocy ani niebezpiecznych działań.
- Nie wymyślaj faktów.

Zwróć WYŁĄCZNIE poprawny JSON:
{
  "text": "Twoja odpowiedź",
  "ui_action": "show_waves"
}

Dostępne ui_action:
- show_waves
- level_up
- show_giant_text

Wybierz jedną akcję odpowiednią do kontekstu.
`;

// ==========================================
// MAIN APPLICATION
// ==========================================

export default function App() {
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState(
    'Witaj w ASCEND.\n\nTwoja droga zaczyna się od działania.'
  );

  const [history, setHistory] = useState([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  const [inputVisible, setInputVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [uiAction, setUiAction] = useState('show_giant_text');

  const [background, setBackground] = useState(
    COLORS.background
  );

  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      const savedHistory = await AsyncStorage.getItem(
        STORAGE.HISTORY
      );

      const savedXP = await AsyncStorage.getItem(STORAGE.XP);
      const savedLevel = await AsyncStorage.getItem(
        STORAGE.LEVEL
      );

      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);

        if (parsed.length > 0) {
          setAnswer(parsed[parsed.length - 1].assistant);
        }
      }

      if (savedXP !== null) {
        setXp(Number(savedXP));
      }

      if (savedLevel !== null) {
        setLevel(Number(savedLevel));
      }
    } catch (error) {
      console.error('ASCEND initialization error:', error);
    }
  }

  // ========================================
  // PERSISTENCE
  // ========================================

  async function saveData(newHistory, newXP, newLevel) {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE.HISTORY,
          JSON.stringify(newHistory)
        ),
        AsyncStorage.setItem(STORAGE.XP, String(newXP)),
        AsyncStorage.setItem(
          STORAGE.LEVEL,
          String(newLevel)
        ),
      ]);
    } catch (error) {
      console.error('ASCEND storage error:', error);
    }
  }

  // ========================================
  // LEVEL SYSTEM
  // ========================================

  function calculateLevel(points) {
    return Math.floor(points / 100) + 1;
  }

  function addXP(amount) {
    const updatedXP = xp + amount;
    const updatedLevel = calculateLevel(updatedXP);

    const leveledUp = updatedLevel > level;

    setXp(updatedXP);
    setLevel(updatedLevel);

    AsyncStorage.setItem(STORAGE.XP, String(updatedXP));
    AsyncStorage.setItem(
      STORAGE.LEVEL,
      String(updatedLevel)
    );

    return leveledUp;
  }

  // ========================================
  // UI ACTIONS
  // ========================================

  function executeUIAction(action) {
    setUiAction(action);

    switch (action) {
      case 'show_waves':
        setBackground(COLORS.waves);
        break;

      case 'level_up':
        setBackground(COLORS.levelUp);
        break;

      case 'show_giant_text':
      default:
        setBackground(COLORS.giant);
        break;
    }

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }

  // ========================================
  // ADVISOR INFORMATION
  // ========================================

  function buildAdvisorContext() {
    return ADVISORS.map(
      advisor => `${advisor.name}: ${advisor.role}`
    ).join('\n');
  }

  // ========================================
  // AI COORDINATOR
  // ========================================

  async function askCoordinator(message) {
    if (!API_URL) {
      throw new Error(
        'Brak adresu API. Skonfiguruj EXPO_PUBLIC_ASCEND_API_URL.'
      );
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system: SYSTEM_PROMPT,
        advisors: ADVISORS,
        advisor_context: buildAdvisorContext(),
        history: history.slice(-12),
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Błąd serwera AI: ${response.status}`
      );
    }

    const data = await response.json();

    // Obsługa odpowiedzi bezpośredniej lub odpowiedzi JSON
    // zwróconej jako tekst przez model.
    let result = data;

    if (typeof data === 'string') {
      result = JSON.parse(data);
    }

    if (data.output && typeof data.output === 'string') {
      result = JSON.parse(data.output);
    }

    if (
      !result ||
      typeof result.text !== 'string' ||
      ![
        'show_waves',
        'level_up',
        'show_giant_text',
      ].includes(result.ui_action)
    ) {
      throw new Error('Nieprawidłowy format odpowiedzi AI.');
    }

    return result;
  }

  // ========================================
  // MAIN MESSAGE PROCESSING
  // ========================================

  async function sendMessage(textOverride) {
    const message = (textOverride ?? input).trim();

    if (!message || loading) return;

    Keyboard.dismiss();
    setInput('');
    setInputVisible(false);
    setLoading(true);

    try {
      const result = await askCoordinator(message);

      const newXP = xp + 10;
      const newLevel = calculateLevel(newXP);
      const leveledUp = newLevel > level;

      const finalAction = leveledUp
        ? 'level_up'
        : result.ui_action;

      const entry = {
        id: Date.now().toString(),
        user: message,
        assistant: result.text,
        timestamp: new Date().toISOString(),
        ui_action: finalAction,
        xp: 10,
      };

      const newHistory = [...history, entry];

      setHistory(newHistory);
      setAnswer(result.text);
      setXp(newXP);
      setLevel(newLevel);

      executeUIAction(finalAction);

      await saveData(newHistory, newXP, newLevel);

      Speech.stop();

      Speech.speak(result.text, {
        language: 'pl-PL',
        rate: 0.95,
        pitch: 1.0,
      });
    } catch (error) {
      console.error('ASCEND coordinator error:', error);

      setAnswer(
        'Nie udało się połączyć z Koordynatorem.\n\nSprawdź połączenie internetowe i konfigurację serwera AI.'
      );

      setBackground(COLORS.background);
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // MICROPHONE / SPEECH RECOGNITION
  // ========================================

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
  });

  useSpeechRecognitionEvent('result', event => {
    const transcript =
      event.results?.[0]?.transcript || '';

    if (transcript) {
      setInput(transcript);
    }
  });

  useSpeechRecognitionEvent('error', event => {
    setListening(false);
    console.error('Speech recognition error:', event.error);
  });

  async function startMicrophone() {
    try {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'ASCEND',
          'Brak uprawnień do mikrofonu.'
        );
        return;
      }

      setInputVisible(true);

      ExpoSpeechRecognitionModule.start({
        lang: 'pl-PL',
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      console.error('Microphone error:', error);
      Alert.alert(
        'ASCEND',
        'Nie udało się uruchomić mikrofonu.'
      );
    }
  }

  function stopMicrophone() {
    ExpoSpeechRecognitionModule.stop();
    setListening(false);
  }

  // ========================================
  // ANIMATIONS
  // ========================================

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.035,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  // ========================================
  // HISTORY RESET
  // ========================================

  async function clearHistory() {
    Alert.alert(
      'ASCEND',
      'Czy na pewno usunąć całą historię?',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            setHistory([]);
            setAnswer(
              'Nowy początek.\n\nWybierz swój kolejny krok.'
            );

            await AsyncStorage.removeItem(STORAGE.HISTORY);
            Speech.stop();
          },
        },
      ]
    );
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: background },
      ]}
    >
      <StatusBar
        backgroundColor={background}
        barStyle="light-content"
      />

      {/* TOP BAR */}

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={clearHistory}
          style={styles.iconButton}
        >
          <Text style={styles.iconText}>↻</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.logo}>ASCEND</Text>
          <Text style={styles.logoSubtitle}>
            PERSONAL INTELLIGENCE
          </Text>
        </View>

        <View style={styles.levelContainer}>
          <Text style={styles.levelLabel}>LEVEL</Text>
          <Text style={styles.levelNumber}>{level}</Text>
        </View>
      </View>

      {/* XP PROGRESS */}

      <View style={styles.xpContainer}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpLabel}>EXPERIENCE</Text>
          <Text style={styles.xpValue}>
            {xp} XP / {level * 100} XP
          </Text>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${xp % 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* ADVISORS */}

      <View style={styles.advisorContainer}>
        {ADVISORS.map((advisor, index) => (
          <View
            key={advisor.name}
            style={[
              styles.advisorDot,
              loading && styles.advisorActive,
            ]}
          >
            <Text style={styles.advisorInitial}>
              {advisor.name.charAt(0)}
            </Text>
          </View>
        ))}
      </View>

      {/* MAIN DISPLAY */}

      <TouchableOpacity
        activeOpacity={1}
        style={styles.mainDisplay}
        onPress={() => {
          if (!loading) {
            setInputVisible(true);
          }
        }}
      >
        <Animated.View
          style={[
            styles.answerContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {loading ? (
            <>
              <ActivityIndicator
                size="large"
                color={COLORS.accent}
              />

              <Text style={styles.thinkingText}>
                KOORDYNATOR ANALIZUJE
              </Text>

              <Text style={styles.thinkingSubtext}>
                Konsultowanie sześciu perspektyw
              </Text>
            </>
          ) : (
            <ScrollView
              contentContainerStyle={styles.answerScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.answerText}>
                {answer}
              </Text>
            </ScrollView>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* BOTTOM CONTROLS */}

      <View style={styles.bottomContainer}>
        <Text style={styles.bottomHint}>
          DOTKNIJ EKRANU, ABY ROZPOCZĄĆ
        </Text>

        {inputVisible && (
          <View style={styles.inputPanel}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Wpisz swoją myśl..."
              placeholderTextColor="#727D91"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              autoFocus
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => sendMessage()}
            />

            <TouchableOpacity
              style={[
                styles.controlButton,
                listening && styles.recordingButton,
              ]}
              onPress={
                listening
                  ? stopMicrophone
                  : startMicrophone
              }
            >
              <Text style={styles.controlButtonText}>
                {listening ? '■' : '🎙'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ASCEND INTELLIGENCE SYSTEM
          </Text>

          <TouchableOpacity
            onPress={() => {
              Speech.stop();
            }}
          >
            <Text style={styles.stopSpeech}>◼</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
  },

  topBar: {
    height: 75,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#18202E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconText: {
    color: COLORS.text,
    fontSize: 25,
  },

  logoContainer: {
    alignItems: 'center',
  },

  logo: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 5,
  },

  logoSubtitle: {
    color: COLORS.secondary,
    fontSize: 8,
    letterSpacing: 2,
    marginTop: 4,
  },

  levelContainer: {
    alignItems: 'center',
    width: 42,
  },

  levelLabel: {
    color: COLORS.secondary,
    fontSize: 8,
    letterSpacing: 2,
  },

  levelNumber: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: 'bold',
  },

  xpContainer: {
    paddingHorizontal: 25,
    marginTop: 12,
  },

  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },

  xpLabel: {
    color: COLORS.secondary,
    fontSize: 9,
    letterSpacing: 2,
  },

  xpValue: {
    color: COLORS.accent,
    fontSize: 10,
  },

  progressBackground: {
    height: 3,
    backgroundColor: '#263044',
    borderRadius: 5,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 5,
  },

  advisorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 35,
  },

  advisorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#18202E',
    borderWidth: 1,
    borderColor: '#303A50',
    justifyContent: 'center',
    alignItems: 'center',
  },

  advisorActive: {
    borderColor: COLORS.accent,
    backgroundColor: '#30264A',
  },

  advisorInitial: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },

  mainDisplay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  answerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  answerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 25,
  },

  answerText: {
    color: COLORS.text,
    fontSize: 27,
    lineHeight: 40,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  thinkingText: {
    color: COLORS.accent,
    marginTop: 25,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: 'bold',
  },

  thinkingSubtext: {
    color: COLORS.secondary,
    marginTop: 12,
    fontSize: 12,
  },

  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },

  bottomHint: {
    textAlign: 'center',
    color: '#59647A',
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 18,
  },

  inputPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#303A50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 42,
    paddingHorizontal: 8,
    textAlignVertical: 'center',
  },

  controlButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#252F42',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },

  recordingButton: {
    backgroundColor: '#743B48',
  },

  controlButtonText: {
    fontSize: 18,
    color: COLORS.text,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 7,
  },

  sendButtonText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#11121A',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },

  footerText: {
    color: '#515D72',
    fontSize: 8,
    letterSpacing: 2,
  },

  stopSpeech: {
    color: COLORS.secondary,
    fontSize: 15,
    padding: 5,
  },
});
