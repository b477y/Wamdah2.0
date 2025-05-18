import bcrypt from "bcrypt";

export const generateHash = ({
  plaintext = "",
  saltRounds = parseInt(process.env.SALT_ROUNDS),
} = {}) => {
  const hashedValue = bcrypt.hashSync(plaintext, saltRounds);
  return hashedValue;
};

export const compareHash = ({ plaintext = "", encryptedText = "" } = {}) => {
  const isMatched = bcrypt.compareSync(plaintext, encryptedText);
  return isMatched;
};
