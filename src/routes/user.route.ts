import express from "express";

import { 
    deleteUser,
    changeProfile,
    getUserDetails,
    getDashboardDetails,
} from "../controllers/user.controller.ts";
import { upload } from "../middlewares/multer.middleware.ts";

const router = express.Router();

router.get("/users", getUserDetails);
router.get("/dashboard", getDashboardDetails);

router.post("/profile", upload.single("avatar"), changeProfile);
router.post("/delete-user", deleteUser);

export default router;