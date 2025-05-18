import UserModel from "../db/models/User.model";

const checkCredits = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.aiCredits < 5) {
            return res.status(403).json({ success: false, message: "Insufficient AI credits (minimum 5 required)" });
        }

        next();
    } catch (err) {
        next(err);
    }
};

export default checkCredits;
