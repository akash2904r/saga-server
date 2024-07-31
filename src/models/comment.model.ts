import mongoose, { Schema } from "mongoose";

import { IComment } from "../constants.ts";

const ObjectId = Schema.Types.ObjectId;

const commentSchema: Schema<IComment> = new Schema(
    {
        comment: {
            type: String,
            required: true
        },
        commentedBy: {
            type: ObjectId,
            required: true
        },
        commentedOn: {
            type: ObjectId,
            required: true
        },
        likes: {
            type: [String],
            default: [],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Comment = mongoose.model<IComment>("Comment", commentSchema);