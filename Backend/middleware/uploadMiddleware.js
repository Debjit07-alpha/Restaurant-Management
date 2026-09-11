const multer = require("multer");

// Memory storage: the file buffer is uploaded directly to Cloudinary.
// Nothing is stored permanently inside the Backend folder.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files are allowed (jpg, jpeg, png, webp)"),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    // 5MB per file
    fileSize: 5 * 1024 * 1024
  },
  fileFilter
});

module.exports = upload;
