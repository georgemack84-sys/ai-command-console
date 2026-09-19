interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface RecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
}

type RecognitionConstructor = new () => RecognitionInstance;

export const startBrowserVoice = (
  onTranscript: (transcript: string) => void,
  onError: (message: string) => void,
): boolean => {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  const Recognition =
    browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
  if (!Recognition) return false;

  const recognition = new Recognition();
  recognition.lang = document.documentElement.lang || "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = (event) =>
    onTranscript(event.results[0][0].transcript);
  recognition.onerror = (event) => onError(event.error);
  recognition.start();
  return true;
};
