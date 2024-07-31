import mongoose from "mongoose";
import { Request, Response } from "express";

import { User } from "../models/user.model.ts";
import { Post } from "../models/post.model.ts";
import { Comment } from "../models/comment.model.ts";
import { addCommentReqBody, likeReqBody } from "../constants.ts";

const ObjectId = mongoose.Types.ObjectId;

export const getComments = async (req: Request, res: Response) => {
    try {
        const comments = await Comment.aggregate([
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    comment: 1,
                    commentedBy: 1,
                    commentedOn: 1,
                    updatedAt: 1,
                    likes: {
                        $size: "$likes"
                    }
                }
            }
        ]);

        res.status(200).json(comments);
    } catch (error) {
        console.log("Error while fetching comments: ", error);
        res.sendStatus(500);
    }
};

export const addComment = async (req: Request, res: Response) => {
    const { comment, commentedBy, commentedOn }: addCommentReqBody = req.body;

    if (!comment || !commentedBy || !commentedOn) return res.sendStatus(400);

    const foundUser = await User.findById(commentedBy);

    if (!foundUser) return res.sendStatus(401);

    const foundPost = await Post.findById(commentedOn);

    if (!foundPost) return res.sendStatus(404);

    const user = new ObjectId(commentedBy);
    const post = new ObjectId(commentedOn);

    const commented = await Comment.create({
        comment, 
        commentedBy: user,
        commentedOn: post
    });

    if (!commented) return res.sendStatus(500);

    res.sendStatus(200);
};

export const getPostComments = async (req: Request, res: Response) => {
    const { id, postId } = req.query;

    if (!id || !postId) return res.sendStatus(400);

    const foundPost = await Post.findById(postId);

    if (!foundPost) return res.sendStatus(404);

    const Id = new ObjectId(String(id));
    const PostId = new ObjectId(String(postId));

    const comments = await Comment.aggregate([
        {
            $match: {
                "commentedOn": PostId
            }
        },
        {
            $sort: {
                createdAt: 1
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "commentedBy",
                foreignField: "_id",
                as: "commentedBy"
            }
        },
        {
            $unwind: {
                path: "$commentedBy"
            }
        },
        {
            $addFields: {
                "isCommentator": {
                    $eq: [Id, "$commentedBy._id"]
                },
                "totalLikes": {
                    $size: "$likes"
                },
                "hasLiked": {
                    $cond: {
                        if: { $in: [id, "$likes"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                comment: 1,
                createdAt: 1,
                commentedBy: {
                    username: 1,
                    avatar: {
                        url: 1
                    }
                },
                isCommentator: 1,
                totalLikes: 1,
                hasLiked: 1
            }
        },
        {
            $addFields: {
                "commentedBy.avatar": "$commentedBy.avatar.url"
            }
        }
    ]);

    res.status(200).json(comments);
};

export const likeOrUnlike = async (req: Request, res: Response) => {
    const { id, commentId }: likeReqBody = req.body;

    if (!id || !commentId) return res.sendStatus(400);

    const foundUser = await User.findById(id);

    if (!foundUser) return res.sendStatus(401);

    const foundComment = await Comment.findById(commentId);

    if (!foundComment) return res.sendStatus(404);

    let result;
    const _id = new ObjectId(commentId);

    if (foundComment.likes.includes(id)) {
        result = await Comment.updateOne({ _id }, { $pull: { likes: id } }, { new: true });
    } else {
        result = await Comment.updateOne({ _id }, { $push: { likes: id } }, { new: true });
    }

    if (!result) return res.sendStatus(500);

    res.sendStatus(200);
};

export const updateComment = async (req: Request, res: Response) => {
    const { id, content }: { id: string, content: string } = req.body;

    if (!id || !content) return res.sendStatus(400);

    const foundComment = await Comment.findById(id);

    if (!foundComment) return res.sendStatus(404);

    const updatedComment = await Comment.findByIdAndUpdate(id, { $set: { comment: content } }, { new: true });

    if (!updatedComment) return res.sendStatus(500);

    res.sendStatus(200);
};

export const deleteComment = async (req: Request, res: Response) => {
    const { id }: { id: string } = req.body;

    if (!id) return res.sendStatus(400);

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) return res.sendStatus(500);

    res.sendStatus(200);
};