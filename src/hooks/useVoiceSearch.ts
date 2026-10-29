import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  isSpeechRecognitionSupported, 
  createSpeechRecognition, 
  ISpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  playListeningStartTone,
  playRecognitionSuccessTone,
  parseVoiceCommand,
  ParsedVoiceCommand,
  SUPPORTED_VOICE_LANGUAGES
} from '../utils/speechRecognition';

export interface UseVoiceSearchOptions {
  onCommand?: (command: ParsedVoiceCommand) => void;
  defaultLang?: string;
  continuous?: boolean;
}

export function useVoiceSearch(options: UseVoiceSearchOptions = {}) {
  const { onCommand, defaultLang = 'en-UG' } = options;

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>(defaultLang);
  const [lastParsedCommand, setLastParsedCommand] = useState<ParsedVoiceCommand | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isStoppingManually = useRef<boolean>(false);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  const stopListening = useCallback(() => {
    isStoppingManually.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Recognition already stopped or error
      }
    }
    setIsListening(false);
  }, []);

  const cancelListening = useCallback(() => {
    isStoppingManually.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    isStoppingManually.current = false;

    if (!isSpeechRecognitionSupported()) {
      setError('Web Speech API is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = createSpeechRecognition();
      if (!recognition) {
        setError('Could not initialize Speech Recognition in this browser.');
        return;
      }

      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        playListeningStartTone();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          const cleaned = final.trim();
          setTranscript(cleaned);
          setInterimTranscript('');
          playRecognitionSuccessTone();

          const parsed = parseVoiceCommand(cleaned);
          setLastParsedCommand(parsed);

          if (onCommand) {
            onCommand(parsed);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error === 'no-speech') {
          setError('No voice detected. Please try speaking closer to your microphone.');
        } else if (event.error === 'network') {
          setError('Speech recognition network error. Please check your internet connection.');
        } else if (event.error !== 'aborted') {
          setError(`Speech error: ${event.error || 'Failed to capture voice'}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.warn('SpeechRecognition start failed:', err);
      setIsListening(false);
      setError(err?.message || 'Failed to start microphone.');
    }
  }, [language, onCommand]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    clearError: () => setError(null),
    language,
    setLanguage,
    startListening,
    stopListening,
    cancelListening,
    toggleListening,
    lastParsedCommand,
    supportedLanguages: SUPPORTED_VOICE_LANGUAGES
  };
}
