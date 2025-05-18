import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadTajawal } from "@remotion/google-fonts/Tajawal";
import { loadFont as loadLateef } from "@remotion/google-fonts/Lateef";
import { loadFont as loadReemKufi } from "@remotion/google-fonts/ReemKufi";
import { loadFont as loadSofia } from "@remotion/google-fonts/Sofia";
import { loadFont as loadScheherazadeNew } from "@remotion/google-fonts/ScheherazadeNew";
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

export function getFontLoader(fontFamily) {
    const fontMap = {
        Amiri: loadAmiri,
        Cairo: loadCairo,
        Tajawal: loadTajawal,
        Lateef: loadLateef,
        "Reem Kufi": loadReemKufi,
        Sofia: loadSofia,
        Scheherazade: loadScheherazadeNew,
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

    return fontMap[fontFamily];
}
