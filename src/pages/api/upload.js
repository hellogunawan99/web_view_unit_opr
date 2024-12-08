import multer from "multer";
import nextConnect from "next-connect";
import path from "path";

const upload = multer({
  storage: multer.diskStorage({
    destination: "./public/uploads/",
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Something went wrong: ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  },
});

apiRoute.use(upload.single("file"));

apiRoute.post((req, res) => {
  res.status(200).json({ message: "File berhasil diupload", filename: req.file.filename });
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false, // Multer akan meng-handle body parsing
  },
};
