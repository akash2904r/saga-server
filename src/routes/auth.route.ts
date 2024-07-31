import express from "express";

import { 
    signUp, 
    signIn,
    signOut,
    deleteUser,
    googleLogin, 
    handleRefreshToken,
} from "../controllers/auth.controller.ts";

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);
router.post("/google", googleLogin);
router.post("/refresh", handleRefreshToken);
router.post("/delete", deleteUser);

export default router;