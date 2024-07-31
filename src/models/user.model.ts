import mongoose, { Schema, UpdateQuery } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { IUser } from "../constants.ts";

const userSchema: Schema<IUser> = new Schema(
    {
        sub: {
            type: String,
            unique: true
        },
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: function () {
                return !this.isGoogleId
            },
        },
        avatar: {
            public_id: String,
            url: String
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        isGoogleId: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        }
    }, 
    { 
        timestamps: true 
    }
);

userSchema.pre("save", async function (next) {
    if (this.isModified("password"))
        this.password = await bcrypt.hash(this.password, 12);

    next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate() as mongoose.UpdateQuery<IUser>;

    if (update?.password) {
        update.password = await bcrypt.hash(update.password, 12);
        this.setUpdate(update);
    }

    next();
});

userSchema.methods.isPasswordValid = async function (password: string) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const User = mongoose.model("User", userSchema);