import { randomInt } from "node:crypto";
import QRCode from "qrcode";

// No 0/o/1/l/i so codes stay readable if someone has to type one.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const CODE_LENGTH = 12;

export function generateCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

export function qrUrlForCode(code: string) {
  return `${process.env.APP_URL}/r/${code}`;
}

export function renderQrPng(code: string) {
  return QRCode.toBuffer(qrUrlForCode(code), {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
