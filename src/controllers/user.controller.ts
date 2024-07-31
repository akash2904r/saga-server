import { Request, Response } from "express";

import { User } from "../models/user.model.ts";
import { Comment } from "../models/comment.model.ts";
import { Post } from "../models/post.model.ts";
import { deleteAsset, uploadOnCloud } from "../utils/cloudinary.ts";
import { checkFileExistence } from "../utils/fileSystem.ts";
import { changeProfileReqBody, MongoProject } from "../constants.ts";

const project = (schemaName: string): MongoProject => {
    const project: MongoProject = schemaName === "User" 
        ? { username: 1, avatar: "$avatar.url" } 
        : schemaName === "Post" 
            ? { image: "$image.url", title: 1, content: 1 } 
            : { comment: 1, likes: { $size: "$likes" } };

    return project;
};

export const getDashboardDetails = async (req: Request, res: Response) => {
    let thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
        const last30daysUser = await User.aggregate([
            {
                $addFields: { isRecent: { $cond: { if: { $gte: ["$createdAt", thirtyDaysAgo] }, then: true, else: false } } }
            },
            { $match: { isRecent: true } },
            { $count: 'count' }
        ]);

        const last30daysComment = await Comment.aggregate([
            {
                $addFields: { isRecent: { $cond: { if: { $gte: ["$createdAt", thirtyDaysAgo] }, then: true, else: false } } }
            },
            { $match: { isRecent: true } },
            { $count: 'count' }
        ]);

        const last30daysPost = await Post.aggregate([
            {
                $addFields: { isRecent: { $cond: { if: { $gte: ["$createdAt", thirtyDaysAgo] }, then: true, else: false } } }
            },
            { $match: { isRecent: true } },
            { $count: 'count' }
        ]);

        if (!last30daysUser || !last30daysComment || !last30daysPost) return res.sendStatus(500);
    
        const totalAndLatestUsers = await User.aggregate([
            {
                $facet: {
                    totalCount: [
                        { $count: "count" }
                    ],
                    latestDocuments: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 2 },
                        { $project: project("User") }
                    ]
                }
            },
            {
                $project: {
                    totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
                    latestDocuments: 1
                }
            }
        ]);

        const totalAndLatestComments = await Comment.aggregate([
            {
                $facet: {
                    totalCount: [
                        { $count: "count" }
                    ],
                    latestDocuments: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 2 },
                        { $project: project("Comment") }
                    ]
                }
            },
            {
                $project: {
                    totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
                    latestDocuments: 1
                }
            }
        ]);

        const totalAndLatestPosts = await Post.aggregate([
            {
                $facet: {
                    totalCount: [
                        { $count: "count" }
                    ],
                    latestDocuments: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 2 },
                        { $project: project("Post") }
                    ]
                }
            },
            {
                $project: {
                    totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
                    latestDocuments: 1
                }
            }
        ]);

        if (!totalAndLatestUsers || !totalAndLatestComments || !totalAndLatestPosts) return res.sendStatus(500);

        const data = {
            users: {
                total: totalAndLatestUsers[0].totalCount ? totalAndLatestUsers[0].totalCount : 0,
                last30days: last30daysUser.length ? last30daysUser[0].count : 0,
                latest: totalAndLatestUsers[0].latestDocuments
            },
            posts: {
                total: totalAndLatestPosts[0].totalCount ? totalAndLatestPosts[0].totalCount : 0,
                last30days: last30daysPost.length ? last30daysPost[0].count : 0,
                latest: totalAndLatestPosts[0].latestDocuments
            },
            comments: {
                total: totalAndLatestComments[0].totalCount ? totalAndLatestComments[0].totalCount : 0,
                last30days: last30daysComment.length ? last30daysComment[0].count: 0,
                latest: totalAndLatestComments[0].latestDocuments
            }
        };

        res.status(200).json(data);
    } catch (error) {
        console.log("Error occured while retrieving Dashboard details: ", error);
        res.sendStatus(500);
    }
};

export const getUserDetails = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select("-password -refreshToken -__v -updatedAt").sort({ createdAt: -1 });

        if (!users) return res.sendStatus(500);

        res.status(200).json(users);
    } catch (error) {
        console.log("Error while fetching users data: ", error);
        res.sendStatus(500);
    }
};

export const changeProfile = async (req: Request, res: Response) => {
    const { id, username, password, email }: changeProfileReqBody = req.body;
    const imgName = req.file?.filename;
    
    if (!username && !email && !password && !imgName) return res.sendStatus(400);
    
    const foundUser = await User.findById(id);
    
    if (!foundUser) return res.sendStatus(404);

    let user;
    
    if (imgName) {
        const avatarPath = await checkFileExistence(imgName);

        if (!avatarPath) return res.sendStatus(404);

        const image = await uploadOnCloud(avatarPath);

        if (!image?.url || !image?.public_id) return res.sendStatus(502);

        if (foundUser.avatar?.url) {
            const response = await deleteAsset(foundUser.avatar.public_id);

            if (response === 500) return res.sendStatus(500);
        }

        const avatar = { public_id: image.public_id, url: image.url };
        
        user = await User.findByIdAndUpdate(id, { avatar }, { new: true });
    }

    const values = { username, email, password };
    const valuesToUpdate = Object.fromEntries(
        Object.entries(values).filter(([_, value]) => value !== "" && value !== undefined)
    );
    
    if (Object.keys(valuesToUpdate).length !== 0) user = await User.findByIdAndUpdate(id, valuesToUpdate, { new: true });
    
    res.status(200).json({ name: user?.username, email: user?.email, avatar: user?.avatar?.url });
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.body;

    if (!id) return res.sendStatus(400);

    const foundUser = await User.findById(id);

    if (!foundUser) return res.sendStatus(404);

    const public_id = foundUser.avatar?.public_id;

    if (public_id) {
        const response = await deleteAsset(public_id);

        if (response === 500) return res.sendStatus(500); 
    }

    await User.findByIdAndDelete(id);

    res.sendStatus(200);
};
