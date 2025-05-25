import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  staticFile, // Potentially not needed if all assets are fetched via URL
  Video,
  Sequence,
  Img
} from "remotion";
import { FunctionComponent, useMemo } from "react";
import { CalculateMetadataFunction } from 'remotion';
import { getAudioDurationInSeconds } from '@remotion/media-utils';

// Arabic Fonts (ensure these are installed if you plan to use them dynamically)
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

// --- RENDERING COMPONENT ---
export const RenderingComponent: FunctionComponent<Props> = ({
  words = [],
  fontSize = 70,
  fontFamily = "Roboto",
  textColor = "#000000",
  highlightColor = "#FF9800",
  // fadeIn = true,
  // fadeDuration = 0.2,
  voiceFile,
  aiAvatarFile,
  borderRadius = 6,
  // debug = false,
  type, // This prop is now correctly defined in Props interface
  assetsPath = "http://localhost:3000/public", // Default for local dev/studio
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig(); // Get fps and total duration from config
  const currentTime = frame / fps;

  // Background Image Paths
  const backgroundImagePaths = [
    `/templates/${type}/image1.jpg`,
    `/templates/${type}/image2.jpg`,
    `/templates/${type}/image3.jpg`
    // `/templates/${type}/image4.jpg`,
    // `/templates/${type}/image5.jpg`,
  ];

  // Load the selected font
  const fontLoader = loadFont(fontFamily);
  if (fontLoader) {
    fontLoader();
  }

  // Construct full URLs for audio and avatar video
  const audioPath = voiceFile
    ? `${assetsPath}/renders/voices/${voiceFile}`
    : null;
  const aiAvatarPath = aiAvatarFile
    ? `${assetsPath}/renders/aiAvatars/${aiAvatarFile}`
    : null;

  // Find the active word based on current time
  const activeWord = useMemo(() => {
    return words.find(
      (wordObj) => currentTime >= wordObj.start && currentTime <= wordObj.end
    );
  }, [words, currentTime]);

  const displayWord = activeWord
    ? activeWord.punctuated_word || activeWord.word
    : "";

  // Calculate fade opacity (kept for reference, currently commented out in style)
  // const fadeOpacity = useMemo(() => {
  //   if (!activeWord || !fadeIn) return 1;

  //   return interpolate(
  //     currentTime,
  //     [
  //       activeWord.start - fadeDuration,
  //       activeWord.start,
  //       activeWord.end,
  //       activeWord.end + fadeDuration,
  //     ],
  //     [0, 1, 1, 0],
  //     { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  //   );
  // }, [activeWord, currentTime, fadeIn, fadeDuration]);

  // Debug information
  // const debugInfo = debug ? (
  //   <div style={{
  //     position: 'absolute',
  //     bottom: 20,
  //     left: 20,
  //     backgroundColor: 'rgba(0,0,0,0.7)', // Changed for better visibility
  //     color: 'white',
  //     padding: '10px',
  //     borderRadius: '4px',
  //     fontFamily: 'monospace',
  //     fontSize: '14px',
  //     zIndex: 100, // Ensure it's on top
  //   }}>
  //     <div>Frame: {frame}</div>
  //     <div>Time: {currentTime.toFixed(2)}s</div>
  //     <div>Comp Duration: {durationInFrames / fps}s ({durationInFrames} frames)</div>
  //     <div>Active Word: {displayWord || 'None'}</div>
  //     {activeWord && (
  //       <>
  //         <div>Start: {activeWord.start.toFixed(2)}s</div>
  //         <div>End: {activeWord.end.toFixed(2)}s</div>
  //       </>
  //     )}
  //   </div>
  // ) : null;

  // Handle case where no words are provided
  if (words.length === 0) {
    return (
      <AbsoluteFill style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}>
        <span style={{ color: "red", fontSize: 32 }}>No words provided for captioning</span>
      </AbsoluteFill>
    );
  }

  // Duration for each background image before it cycles to the next one
  // This will make images cycle through the entire video duration
  // const imageDurationInSeconds = 11;
  // const totalImageCycleDurationInFrames = backgroundImagePaths.length * imageDurationInSeconds * fps;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "white",
        display: "flex",
        justifyContent: "flex-end", // align vertically to bottom
        alignItems: "center",       // horizontally centered
        paddingBottom: 150,         // adjust the padding as needed
        overflow: "hidden", // Hide overflow for images
      }}
    >

      {/* Background Images - Looping */}
      {backgroundImagePaths.map((path, index) => {
        const imageDurationInSeconds = (durationInFrames * fps) / 3; // Ensure this matches your desired display duration for each image
        const totalImageCycleDurationInFrames = backgroundImagePaths.length * imageDurationInSeconds * fps;
        const startFrameOfFirstAppearance = index * imageDurationInSeconds * fps;

        const currentCycleFrame = frame % totalImageCycleDurationInFrames;
        const isCurrentActiveImage =
          currentCycleFrame >= startFrameOfFirstAppearance &&
          currentCycleFrame < startFrameOfFirstAppearance + imageDurationInSeconds * fps;

        return (
          <Sequence
            key={path}
            from={0}
            durationInFrames={durationInFrames}
          >
            <Img
              src={`${assetsPath}${path}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 0,
                opacity: isCurrentActiveImage ? 1 : 0, // Show only the currently active image
                // REMOVE OR COMMENT OUT THIS LINE TO ELIMINATE THE TRANSITION
                // transition: isCurrentActiveImage ? 'opacity 0.5s ease-in-out' : 'none',
              }}
            />
          </Sequence>
        );
      })}

      {/* Audio Layer */}
      {audioPath && <Audio src={audioPath} />}

      {/* Avatar Video — only if aiAvatarFile is provided */}
      {aiAvatarPath && (
        <Video
          src={aiAvatarPath}
          startFrom={0}
          // The AI avatar video typically contains the primary audio, so setting muted to true
          // to avoid double audio if voiceFile is also present and intended for separate playback.
          // If the AI avatar is meant to be the *only* audio source, ensure voiceFile is null or absent.
          muted={true} // Set to false if you want the avatar video's audio to play
          style={{
            position: "absolute",
            top: "960px", // Example position, adjust as needed
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
            color: highlightColor, // Use highlight color for the active word
            // opacity: fadeOpacity, // Uncomment if you want fade effect for the word
            // transition: "opacity 0.1s linear", // Add a subtle transition if opacity is used
            borderRadius,
            whiteSpace: "nowrap",
            textAlign: isArabicText(displayWord) ? "right" : "left",
            direction: isArabicText(displayWord) ? "rtl" : "ltr",
            position: "relative",
            zIndex: 2, // Ensure text is above background
          }}
        >
          {displayWord}
        </span>
      ) : (
        // Placeholder to maintain layout consistency even when no word is active
        <span style={{ visibility: "hidden", fontSize: fontSize }}>Placeholder</span>
      )}

      {/* {debugInfo} */}
    </AbsoluteFill>
  );
};

// --- CALCULATE METADATA ---
export const calculateMetadata: CalculateMetadataFunction<Props> = async ({
  props, // The inputProps from the backend (or defaultProps from Root.tsx)
}) => {
  const fps = 30; // Define your desired frames per second

  // Construct the full URL to the audio file using assetsPath from props
  const audioPath = props.voiceFile
    ? `${props.assetsPath}/renders/voices/${props.voiceFile}`
    : null; // If no voiceFile is provided, audioPath will be null

  let audioDurationInSeconds = 0;
  try {
    if (audioPath) {
      audioDurationInSeconds = await getAudioDurationInSeconds(audioPath);
    } else {
      console.warn("No voiceFile provided, video duration will be 0.");
      // You might want a minimum duration if no audio is present
      // audioDurationInSeconds = props.words.length > 0 ? (props.words[props.words.length - 1]?.end || 5) : 5; // Example fallback duration
      audioDurationInSeconds = 5; // A reasonable default if no audio
    }
  } catch (error) {
    console.error(`Error getting audio duration for ${audioPath}:`, error);
    // Fallback duration in case of an error fetching audio
    audioDurationInSeconds = 5; // Or throw error, depending on desired behavior
  }


  // Convert duration to frames
  const durationInFrames = Math.floor(audioDurationInSeconds * fps);

  // Ensure minimum duration if required, e.g., for very short audio or no audio
  const minDurationFrames = 1 * fps; // 1 second minimum
  const finalDurationInFrames = Math.max(durationInFrames, minDurationFrames);


  return {
    durationInFrames: finalDurationInFrames,
    fps: fps,
    width: 1080, // Set your desired video width
    height: 1920, // Set your desired video height
  };
};