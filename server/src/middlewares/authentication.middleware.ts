import { decodeToken } from "../utils/security/token.security";
import asyncHandler from "../utils/response/error.response";
import { TokenType } from "../utils/enum/enums";

const authentication = () => {
  return asyncHandler(async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization || typeof authorization !== "string") {
      return next(
        new Error("Authorization header is required", { cause: 401 })
      );
    }

    try {
      const user = await decodeToken({
        authorization,
        tokenType: TokenType.ACCESS,
      });

      if (!user || !user._id) {
        return next(new Error("Unauthorized access", { cause: 401 }));
      }

      req.user = { _id: user._id, role: user.role };
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token", { cause: 401 }));
    }
  });
};

export default authentication;
