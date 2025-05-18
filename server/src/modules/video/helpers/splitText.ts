const splitText = (text) => {
  // Match sentence-ending punctuation in Arabic and English
  const sentenceEndRegex = /([.?!؟\u06D4]+)(?=\s|$)/g;

  // Add a delimiter after each sentence-ending punctuation
  const rawSentences = text
    .replace(sentenceEndRegex, "$1|")
    .split("|")
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  return rawSentences;
};

export default splitText;
