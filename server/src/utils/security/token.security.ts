import jwt from "jsonwebtoken";
import { TokenType } from "../enum/enums";
import UserModel from "../../db/models/User.model";

export const generateTokens = async ({
  payload,
  accessTokenSK = "936d45727465f0c399cec52efe8a77450eb4bf1c77e2f5b197c6c1744bf5661a",
  refreshTokenSK = "3e9dae78c0c87b83833d054a50a24d3269e941de1c5e3c2c5dd9302175a48dc7",
  tokenType = [TokenType.ACCESS, TokenType.REFRESH],
}) => {
  if (!payload) {
    throw new Error("Payload is required to generate tokens.");
  }

  let tokens = {};

  if (tokenType.includes(TokenType.ACCESS)) {
    if (!accessTokenSK) throw new Error("Access token secret key is missing.");
    tokens.accessToken = jwt.sign(
      { _id: payload._id, role: payload.role },
      accessTokenSK,
      {
        expiresIn: "7d",
      }
    );
  }

  if (tokenType.includes(TokenType.REFRESH)) {
    if (!refreshTokenSK)
      throw new Error("Refresh token secret key is missing.");
    tokens.refreshToken = jwt.sign(
      { _id: payload._id, role: payload.role },
      refreshTokenSK,
      {
        expiresIn: "7d",
      }
    );
  }

  return tokens;
};

export const verifyToken = ({ token, secretKey } = {}) => {
  return jwt.verify(token, secretKey);
};
export const decodeToken = async ({ authorization, tokenType } = {}) => {
  if (typeof authorization !== "string" || !authorization.trim()) {
    throw new Error("Invalid authorization format", { cause: 401 });
  }

  const secretKey =
    tokenType === TokenType.ACCESS
      ? "936d45727465f0c399cec52efe8a77450eb4bf1c77e2f5b197c6c1744bf5661a"
      : "3e9dae78c0c87b83833d054a50a24d3269e941de1c5e3c2c5dd9302175a48dc7";

  let decoded;
  try {
    decoded = verifyToken({ token: authorization, secretKey });
  } catch (err) {
    console.error("JWT ERROR:", err.name, err.message); // Log the real error

    if (err.name === "TokenExpiredError") {
      throw new Error("Token has expired", { cause: 401 });
    }

    if (err.name === "JsonWebTokenError") {
      throw new Error("Invalid token signature", { cause: 401 });
    }

    throw new Error("Token verification failed", { cause: 401 });
  }

  if (!decoded?._id || !decoded?.role) {
    throw new Error("Invalid token payload", { cause: 401 });
  }

  const userExists = await UserModel.exists({
    _id: decoded._id,
    deletedAt: { $exists: false },
  });

  if (!userExists) {
    throw new Error("Not registered account", { cause: 404 });
  }

  return { _id: decoded._id, role: decoded.role };
};
