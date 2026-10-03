// Multer file upload middleware storing image files in memory buffer.
// Ensures food photos are held temporarily in RAM and discarded after processing.
// Configures file size limits and image mime-type filtering for security.

import multer from 'multer';

const storage = multer.memoryStorage();

// Filters incoming uploads to allow image files only.
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});
