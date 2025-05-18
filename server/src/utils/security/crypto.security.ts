import CryptoJS from "crypto-js";

export const encrypt = ({
  plaintext = "",
  secretKey = process.env.ENCRYPTION_KEY,
} = {}) => {
  const encrypted = CryptoJS.AES.encrypt(plaintext, secretKey).toString();
  return encrypted;
};

export const decrypt = ({
  cipherText = "",
  secretKey = process.env.ENCRYPTION_KEY,
} = {}) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  const plainText = bytes.toString(CryptoJS.enc.Utf8);
  return plainText;
};
