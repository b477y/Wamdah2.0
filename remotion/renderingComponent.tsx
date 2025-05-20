import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  staticFile
} from "remotion";
import { FunctionComponent, useMemo } from "react";

// Arabic Fonts
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadTajawal } from "@remotion/google-fonts/Tajawal";
import { loadFont as loadLateef } from "@remotion/google-fonts/Lateef";
import { loadFont as loadReemKufi } from "@remotion/google-fonts/ReemKufi";
import { loadFont as loadSofia } from "@remotion/google-fonts/Sofia";
import { loadFont as loadScheherazadeNew } from "@remotion/google-fonts/ScheherazadeNew";

// English Fonts
import { loadFont as loadOpenSans } from "@remotion/google-fonts/OpenSans";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { loadFont as loadLato } from "@remotion/google-fonts/Lato";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadMerriweather } from "@remotion/google-fonts/Merriweather";
import { loadFont as loadSlabo27px } from "@remotion/google-fonts/Slabo27px";
import { loadFont as loadABeeZee } from "@remotion/google-fonts/ABeeZee";
import { loadFont as loadLora } from "@remotion/google-fonts/Lora";
import { loadFont as loadAdventPro } from "@remotion/google-fonts/AdventPro";

interface Word {
  word: string;
  start: number; // in seconds
  end: number; // in seconds
  punctuated_word?: string;
}

interface Props {
  words: Word[];
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  highlightColor?: string;
  fadeIn?: boolean;
  fadeDuration?: number; // in seconds
  voiceFile?: string;
  backgroundColor?: string;
  wordBackground?: string;
  wordPadding?: string;
  borderRadius?: number;
  debug?: boolean;
}

const FONT_MAP = {
  // Arabic Fonts
  Amiri: loadAmiri,
  Cairo: loadCairo,
  Tajawal: loadTajawal,
  Lateef: loadLateef,
  "Reem Kufi": loadReemKufi,
  Sofia: loadSofia,
  Scheherazade: loadScheherazadeNew,

  // English Fonts
  "Open Sans": loadOpenSans,
  Roboto: loadRoboto,
  Lato: loadLato,
  Poppins: loadPoppins,
  Montserrat: loadMontserrat,
  Merriweather: loadMerriweather,
  "Slabo 27px": loadSlabo27px,
  ABeeZee: loadABeeZee,
  Lora: loadLora,
  "Advent Pro": loadAdventPro,
};

export const loadFont = (fontFamily: string) => {
  return FONT_MAP[fontFamily as keyof typeof FONT_MAP] || null;
};

export const isArabicText = (text: string): boolean => {
  const arabicPattern =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
};

export const RenderingComponent: FunctionComponent<Props> = ({
  words = [],
  fontSize = 60,
  fontFamily = "Roboto",
  textColor = "#000000",
  highlightColor = "#FF9800",
  fadeIn = true,
  fadeDuration = 0.2,
  voiceFile = "",
  borderRadius = 6,
  debug = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Load the selected font
  const fontLoader = loadFont(fontFamily);
  if (fontLoader) {
    fontLoader();
  }

    const audioPath = `http://localhost:3000/renders/${voiceFile}`;

  const activeWord = useMemo(() => {
    return words.find(
      (wordObj) => currentTime >= wordObj.start && currentTime <= wordObj.end
    );
  }, [words, currentTime]);

  const displayWord = activeWord
    ? activeWord.punctuated_word || activeWord.word
    : "";

  const fadeOpacity = useMemo(() => {
    if (!activeWord || !fadeIn) return 1;

    return interpolate(
      currentTime,
      [
        activeWord.start - fadeDuration,
        activeWord.start,
        activeWord.end,
        activeWord.end + fadeDuration,
      ],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  }, [activeWord, currentTime, fadeIn, fadeDuration]);

  // Debug information
  const debugInfo = debug ? (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      backgroundColor: 'white',
      color: 'white',
      padding: '10px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '14px',
    }}>
      <div>Frame: {frame}</div>
      <div>Time: {currentTime.toFixed(2)}s</div>
      <div>Active Word: {displayWord || 'None'}</div>
      {activeWord && (
        <>
          <div>Start: {activeWord.start.toFixed(2)}s</div>
          <div>End: {activeWord.end.toFixed(2)}s</div>
        </>
      )}
    </div>
  ) : null;

  if (words.length === 0) {
    return (
      <AbsoluteFill style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}>
        <span style={{ color: "red", fontSize: 32 }}>No words provided</span>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "white",  // <-- Add this line here
        display: "flex",
        justifyContent: "flex-end", // align vertically to bottom
        alignItems: "center",       // horizontally centered
        paddingBottom: 150,          // adjust the padding as needed
      }}
    >
      {audioPath && <Audio src={audioPath} />}

      {activeWord ? (
        <span
          style={{
            fontSize,
            fontFamily,
            color: highlightColor,
            // opacity: fadeOpacity,
            // transition: "all 0.3s",
            borderRadius,
            whiteSpace: "nowrap",
            textAlign: isArabicText(displayWord) ? "right" : "left",
            direction: isArabicText(displayWord) ? "rtl" : "ltr",
          }}
        // aria-live="assertive"
        // aria-atomic="true"
        >
          {displayWord}
        </span>
      ) : (
        <span style={{ visibility: "hidden" }}>Placeholder</span>
      )}

      {debugInfo}
    </AbsoluteFill>
  );
};