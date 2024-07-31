import mongoose, { Schema } from "mongoose";

import { IPost } from "../constants.ts";

const postSchema: Schema<IPost> = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        image: {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        },
    },
    {
        timestamps: true
    }
);

export const Post = mongoose.model<IPost>("Post", postSchema);