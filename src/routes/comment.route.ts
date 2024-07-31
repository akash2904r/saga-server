import express from "express";

import { 
    addComment,  
    getComments,
    likeOrUnlike,
    updateComment, 
    deleteComment,
    getPostComments,
} from "../controllers/comment.controller.ts";

const router = express.Router();

router.get("/post", getPostComments);
router.get("/comments", getComments);

router.post("/add-comment", addComment);

router.patch("/like", likeOrUnlike);
router.patch("/edit", updateComment);

router.delete("/delete", deleteComment);

export default router;