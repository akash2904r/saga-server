export const DB_NAME = "BlogSaga";


import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const DIR = join(__dirname, 'server', 'src', 'public', 'temp');


export type MongoProject = { username: number, avatar: string } 
    | { image: string, title: number, content: number } 
    | { comment: number, likes: { $size: string } };


/**********   MODELS   **********/

import { Document, ObjectId } from "mongoose";

export interface IUser extends Document {
    sub?: string,
    username: string,
    email: string,
    password: string,
    avatar?: {
        public_id: string,
        url: string
    },
    isAdmin: boolean,
    isGoogleId: boolean,
    refreshToken?: string,
    isPasswordValid: (password: string) => boolean,
    generateAccessToken: () => string,
    generateRefreshToken: () => string,
};

export interface IPost extends Document {
    title: string,
    category: string,
    content: string,
    image: {
        public_id: string,
        url: string
    },
};

export interface IComment extends Document {
    comment: string,
    commentedBy: ObjectId,
    commentedOn: ObjectId,
    likes: Array<string>
};


/**********   AUTH CONTROLLERS   **********/

export type signUpReqBody = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};

export type signInReqBody = {
    email: string;
    password: string;
};

export type returnARTokens = {
    accessToken: string;
    refreshToken: string;
} | string;

export type decodedRT = {
    _id: string;
    iat: number;
    exp: number;
};


/**********   USER CONTROLLERS   **********/

export type addPostReqBody = {
    title: string;
    category: string;
    content: string;
    imgId: string;
};

export type updatePostReqBody = {
    id: string,
    title: string;
    category: string;
    content: string;
    imgId?: string;
};

export type changeProfileReqBody = {
    id: string,
    username: string,
    email: string,
    password: string,
};


/**********   COMMENT CONTROLLERS   **********/

export type addCommentReqBody = {
    comment: string,
    commentedBy: string,
    commentedOn: string
};

export type likeReqBody = {
    id: string,
    commentId: string
};
