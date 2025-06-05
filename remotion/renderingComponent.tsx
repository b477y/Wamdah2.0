import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Video,
  Img
} from "remotion";
import { FunctionComponent, useMemo } from "react";
import { CalculateMetadataFunction } from 'remotion';
import { getAudioDurationInSeconds } from '@remotion/media-utils';

// Arabic Fonts
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadTajawal } from "@remotion/google-fonts/Tajawal";
import { loadFont as loadLateef } from "@remotion/google-fonts/Lateef";
import { loadFont as loadReemKufi } from "@remotion/google-fonts/ReemKufi";
import { loadFont as loadSofia } from "@remotion/google-fonts/Sofia";
import { loadFont as loadScheherazadeNew } from "@remotion/google-fonts/ScheherazadeNew";
import { loadFont as loadLalezar } from "@remotion/google-fonts/Lalezar"

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

// --- INTERFACES ---
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
  backgroundColor?: string; // Not used in current style, but kept for future
  wordBackground?: string; // Not used in current style, but kept for future
  wordPadding?: string; // Not used in current style, but kept for future
  borderRadius?: number;
  debug?: boolean;
  type?: string; // Added to Props as it's used for background images
  assetsPath?: string; // Added to Props as it's essential for asset loading
  aiAvatarFile?: string; // Added to Props for avatar video
  // Add other props if needed for `job.data`
  titleText?: string;
  titleColor?: string;
  logoColor1?: string;
  logoColor2?: string;
  speaker?: string;
  script?: string;
  timestamp?: number;
}

// --- FONT MAP ---
const FONT_MAP = {
  // Arabic Fonts
  Amiri: loadAmiri,
  Cairo: loadCairo,
  Tajawal: loadTajawal,
  Lateef: loadLateef,
  "Reem Kufi": loadReemKufi,
  Sofia: loadSofia,
  Scheherazade: loadScheherazadeNew,
  Lalezar: loadLalezar, // Lalezar font added here

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

// --- HELPER FUNCTION FOR TEXT OUTLINE USING TEXT-SHADOW ---
const createOutlineShadow = (thickness: number, color: string): string => {
  let shadows: string[] = [];
  // Loop to create shadows in all directions for desired thickness
  for (let x = -thickness; x <= thickness; x++) {
    for (let y = -thickness; y <= thickness; y++) {
      if (x !== 0 || y !== 0) { // Exclude the center (0,0)
        shadows.push(`${x}px ${y}px 0 ${color}`);
      }
    }
  }
  return shadows.join(', ');
};


// --- RENDERING COMPONENT ---
export const RenderingComponent: FunctionComponent<Props> = ({
  words = [],
  fontSize = 80,
  fontFamily = "Lalezar",
  textColor = "#000000",
  highlightColor = "#FF9800",
  voiceFile,
  aiAvatarFile,
  borderRadius = 6,
  type = "advertising",
  assetsPath = "http://localhost:3000/public",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentTime = frame / fps;

  const backgroundImagePaths = [
    `/templates/${type}/image1.jpg`,
    `/templates/${type}/image2.jpg`,
    `/templates/${type}/image3.jpg`
  ];

  const imageDurationInFrames = Math.floor(durationInFrames / backgroundImagePaths.length);

  const fontLoader = loadFont(fontFamily);
  if (fontLoader) { fontLoader(); }

  const audioPath = voiceFile
    ? `${assetsPath}/renders/voices/${voiceFile}`
    : null;
  const aiAvatarPath = aiAvatarFile
    ? `${assetsPath}/renders/aiAvatars/${aiAvatarFile}`
    : null;

  const activeWord = useMemo(() => {
    return words.find(
      (wordObj) => currentTime >= wordObj.start && currentTime <= wordObj.end
    );
  }, [words, currentTime]);

  const displayWord = activeWord
    ? activeWord.punctuated_word || activeWord.word
    : "";

  const outlineThickness = 2;
  const outlineColor = 'black';
  const outlineShadow = useMemo(() => createOutlineShadow(outlineThickness, outlineColor), [outlineThickness, outlineColor]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "white",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 150,
        overflow: "hidden",
      }}
    >

      {/* Background Images - Looping and Displaying based on calculated duration */}
      {backgroundImagePaths.map((path, index) => {
        const startFrame = index * imageDurationInFrames;
        const endFrame = (index === backgroundImagePaths.length - 1)
          ? durationInFrames
          : startFrame + imageDurationInFrames;

        const isCurrentActiveImage = frame >= startFrame && frame < endFrame;

        return (
          <Img
            key={path}
            src={`${assetsPath}${path}`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
              opacity: isCurrentActiveImage ? 1 : 0,
            }}
          />
        );
      })}

      {/* Audio Layer */}
      {audioPath && <Audio src={audioPath} />}

      {/* Avatar Video — only if aiAvatarFile is provided */}
      {aiAvatarPath && (
        <Video
          src={aiAvatarPath}
          startFrom={0}
          muted={true}
          style={{
            position: "absolute",
            top: "960px",
            width: "100%",
            height: "960px",
            objectFit: "cover",
            zIndex: 1,
          }}
        />
      )}

      {/* Active Word Caption */}
      {activeWord ? (
        <span
          style={{
            fontSize,
            fontFamily,
            color: highlightColor,
            textShadow: outlineShadow,
            borderRadius,
            whiteSpace: "nowrap",
            textAlign: isArabicText(displayWord) ? "right" : "left",
            direction: isArabicText(displayWord) ? "rtl" : "ltr",
            position: "relative",
            zIndex: 2,
          }}
        >
          {displayWord}
        </span>
      ) : (
        <span style={{ visibility: "hidden", fontSize: fontSize }}>Placeholder</span>
      )}

    </AbsoluteFill>
  );
};

// --- CALCULATE METADATA ---
export const calculateMetadata: CalculateMetadataFunction<Props> = async ({
  props,
}) => {
  const fps = 30;

  const audioPath = props.voiceFile
    ? `${props.assetsPath}/renders/voices/${props.voiceFile}`
    : null;

  let audioDurationInSeconds = 0;
  try {
    if (audioPath) {
      audioDurationInSeconds = await getAudioDurationInSeconds(audioPath);
    } else {
      console.warn("No voiceFile provided, video duration will be 0.");
      audioDurationInSeconds = 5;
    }
  } catch (error) {
    console.error(`Error getting audio duration for ${audioPath}:`, error);
    audioDurationInSeconds = 5;
  }

  const durationInFrames = Math.floor(audioDurationInSeconds * fps);
  const minDurationFrames = 1 * fps;
  const finalDurationInFrames = Math.max(durationInFrames, minDurationFrames);

  return {
    durationInFrames: finalDurationInFrames,
    fps: fps,
    width: 1080,
    height: 1920,
  };
};