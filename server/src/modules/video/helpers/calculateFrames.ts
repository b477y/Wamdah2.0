import { AccentsAndDialects } from "../../../utils/enum/enums";

const calculateFrames = (accentOrDialect) => {
    let framesPerSentence;

    switch (accentOrDialect.toLowerCase()) {
        case AccentsAndDialects.egyptian.en:
            framesPerSentence = 45;
            break;

        case AccentsAndDialects.syrian.en:
            framesPerSentence = 52;
            break;

        case AccentsAndDialects.american.en:
            framesPerSentence = 38;
            break;

        case AccentsAndDialects.british.en:
            framesPerSentence = 42;
            break;

        default:
            break;
    }
    return framesPerSentence;
}

export default calculateFrames;
