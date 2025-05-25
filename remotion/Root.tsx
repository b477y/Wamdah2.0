import { Composition } from "remotion";
import { RenderingComponent, calculateMetadata } from "./renderingComponent";

// Define video duration
// const durationInFrames = 30 * 30; // 60 seconds × 30 fps = 1800 frames

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RenderingComponent"
        component={RenderingComponent}
        // durationInFrames={durationInFrames}
        // fps={30}
        // width={1080}
        // height={1920}
        defaultProps={{
          titleText: "Rendering Component",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
          assetsPath: "http://localhost:3000/public", // Your Express server's public assets URL
        }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
