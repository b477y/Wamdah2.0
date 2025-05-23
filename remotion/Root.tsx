import { Composition } from "remotion";
import { RenderingComponent } from "./renderingComponent";

// Define video duration
const durationInFrames = 60 * 30; // 60 seconds × 30 fps = 1800 frames

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RenderingComponent"
        component={RenderingComponent}
        durationInFrames={durationInFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          titleText: "Render Server Template",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />
    </>
  );
};
