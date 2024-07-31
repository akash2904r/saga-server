import fs from "fs";
import { join } from "path";
import mongoose from "mongoose";
import { Request, Response } from "express";

import { Post } from "../models/post.model.ts";
import { Comment } from "../models/comment.model.ts";
import { uploadOnCloud, deleteAsset } from "../utils/cloudinary.ts";
import { checkFileExistence } from "../utils/fileSystem.ts";
import { addPostReqBody, updatePostReqBody } from "../constants.ts";
import { DIR, __filename, __dirname } from "../constants.ts";

const ObjectId = mongoose.Types.ObjectId;

export const getAllPosts = async (req: Request, res: Response) => {
    try {
        const posts = await Post.find({}).select("-content -__v -createdAt").sort({ createdAt: -1 });

        if (!posts) return res.sendStatus(404);

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error while fetching posts data: ", error);
        res.sendStatus(500);
    }
};

export const getRecentPosts = async (req: Request, res: Response) => {
    try {
        const posts = await Post.aggregate([
            {
                $sort: { createdAt: -1 }
            },
            {
                $limit: 5
            },
            {
                $project: {
                    title: 1,
                    content: 1,
                    category: 1,
                    image: "$image.url"
                }
            }
        ]);

        if (!posts) return res.sendStatus(404);

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error while fetching recent posts: ", error);
        res.sendStatus(500);
    }
};

export const getOnePost = async (req: Request, res: Response) => {
    const { id } = req.query;

    try {
        const post = await Post.findById(id).select("-__v -createdAt").lean();

        if (!post) return res.sendStatus(404);

        res.status(200).json({ ...post, image: post.image.url });
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
};

export const getSearchResults = async (req: Request, res: Response) => {
    const { for: term, sort, category } = req.query;

    if (!term && !sort && !category) return res.sendStatus(204);

    const order = sort === "latest" ? -1 : 1;
    const searchTerm = term === "@all" ? "" : term;

    try {
        const posts = await Post.aggregate([
            {
                $match: {
                    $expr: {
                        $or: [
                            { $regexMatch: { input: "$title", regex: searchTerm, options: 'i' } },
                            { $regexMatch: { input: "$category", regex: category, options: 'i' } }
                        ]
                    }
                }
            },
            {
                $sort: { createdAt: order }
            },
            {
                $project: {
                    title: 1,
                    content: 1,
                    category: 1,
                    image: "$image.url"
                }
            }
        ]);

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error while fetching search results: ", error);
        res.sendStatus(500);
    }
};

export const savePostImgLocally = async (req: Request, res: Response) => {
    try {
        const localImgPath = req.file?.path;
    
        if (!localImgPath) return res.sendStatus(400);
    
        const imgId = req.file?.filename.split('.')[0];
    
        if (!imgId) return res.sendStatus(400);
    
        res.sendStatus(200);
    } catch (error) {
        console.log("Error while saving image locally: ", error);
        res.sendStatus(500);
    }
};

export const deleteLocallySavedPostImg = async (req: Request, res: Response) => {
    try {
        const files = await fs.promises.readdir(DIR);
    
        for (const file of files) {
            fs.unlinkSync(join(DIR, file));
        }
    
        res.sendStatus(204);
    } catch (error) {
        console.log("Error while deleting locally saved image: ", error);
        res.sendStatus(500);
    }
};

export const addPost = async (req: Request, res: Response) => {
    const { title, category, content, imgId }: addPostReqBody = req.body;

    if (!title || !category || !content) return res.sendStatus(400);

    if (!imgId) return res.sendStatus(422);

    const postImgPath = await checkFileExistence(imgId);

    if (!postImgPath) return res.sendStatus(404);

    const image = await uploadOnCloud(postImgPath);

    if (!image?.url || !image?.public_id) return res.sendStatus(502);

    const post = await Post.create({
        title, 
        category, 
        content, 
        image: { public_id: image.public_id, url: image.url }
    });

    if (!post) return res.sendStatus(500);

    res.status(201).json({ _id: post._id });
};

export const updatePost = async (req: Request, res: Response) => {
    const { id, title, category, content, imgId }: updatePostReqBody = req.body;

    if (!id) return res.sendStatus(400);
    
    const post = await Post.findById(id);

    if (imgId && post) {
        const postImgPath = await checkFileExistence(imgId);

        if (!postImgPath) return res.sendStatus(404);

        const image = await uploadOnCloud(postImgPath);
        const public_id = post.image.public_id;

        if (!image?.url || !image?.public_id) return res.sendStatus(502);

        post.image = { url: image.url, public_id: image.public_id };

        await deleteAsset(public_id);
    }

    if (post) {
        post.title = title;
        post.category = category;
        post.content = content;
        await post.save();

        return res.status(200).json({ _id: id });
    }

    res.sendStatus(404);
};

export const deletePost = async (req: Request, res: Response) => {
    const { id }: { id: string } = req.body;

    if (!id) return res.sendStatus(400);

    const foundPost = await Post.findById(id);

    if (!foundPost) return res.sendStatus(404);

    const public_id = foundPost.image.public_id;

    if (public_id) {
        const response = await deleteAsset(public_id);

        if (response === 500) return res.sendStatus(500);
    }

    const Id = new ObjectId(id);
    await Comment.deleteMany({ commentedOn: Id });

    await Post.findByIdAndDelete(id);

    res.sendStatus(200);
};
