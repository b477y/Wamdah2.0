import asyncHandler from "../utils/response/error.response";

const authorization = (accessRoles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new Error("Unauthorized access", { cause: 401 }));
    }

    const roles = Array.isArray(accessRoles) ? accessRoles : [accessRoles];

    if (!roles.includes(req.user.role)) {
      return next(new Error("Unauthorized user", { cause: 403 }));
    }

    next();
  });
};

export default authorization;
