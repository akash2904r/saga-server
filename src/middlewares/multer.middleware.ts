import multer from "multer";
import { DIR } from "../constants.ts";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, DIR);
    },
    filename: function (req, file, cb) {
        const imgId = req.query.imgId as string;
        const imgExt = file.originalname.split('.').pop();

        if (imgId) {
            cb(null, `${imgId}.${imgExt}`);
        } else {
            cb(null, file.originalname);
        }
    }
});

export const upload = multer({ storage });