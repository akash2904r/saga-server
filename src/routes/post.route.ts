import express from "express";

import { 
    addPost,
    updatePost,
    deletePost,
    getOnePost,
    getAllPosts,
    getRecentPosts,
    getSearchResults,
    savePostImgLocally,
    deleteLocallySavedPostImg,
} from "../controllers/post.controller.ts";
import { upload } from "../middlewares/multer.middleware.ts";

const router = express.Router();

router.get("/post", getOnePost);
router.get("/posts", getAllPosts);
router.get("/recent", getRecentPosts);
router.get("/search", getSearchResults);

router.post("/upload-post-img", upload.single("postImg"), savePostImgLocally);
router.post("/delete-post-img", deleteLocallySavedPostImg);
router.post("/create-post", addPost);
router.post("/update-post", updatePost);
router.post("/delete-post", deletePost);

export default router;