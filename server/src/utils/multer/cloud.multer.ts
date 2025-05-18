import multer from "multer";

export const fileValidations = {
  image: ["image/jpeg", "image/png", "image/gif"],
  document: ["application/pdf", "application/msword"],
  audio: ["audio/mpeg", "audio/mp3"],
};

export const uploadCloudFile = (fileValidations = []) => {
  const storage = multer.diskStorage({});

  function fileFilter(req, file, cb) {
    if (fileValidations.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb("In-valid file format", false);
    }
  }

  return multer({ dest: "tempPath", fileFilter, storage });
};
