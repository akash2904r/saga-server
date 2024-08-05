import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { jwtDecode as decode } from "jwt-decode";
import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";

import { User } from "../models/user.model.ts";
import { signUpReqBody, signInReqBody, returnARTokens, decodedRT } from "../constants.ts";
import { deleteAsset } from "../utils/cloudinary.ts";

const generateAccessAndRefreshToken = async (id: string): Promise<returnARTokens> => {
    try {
        const user = await User.findById(id);

        if (!user) throw new Error("User not found !!!");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error: any) {
        console.log("Error while generating access and refresh tokens \n", error);

        return error.message;
    }
};

export const signUp = async (req: Request, res: Response) => {
    const { firstName, lastName, email, password }: signUpReqBody = req.body;

    const userExists = await User.findOne({ email });
    
    if (userExists) return res.sendStatus(409);

    const username = `${firstName} ${lastName}`;

    const user = await User.create({
        username,
        email,
        password,
    });

    const userCreated = await User.findById(user._id).select("-password -refreshToken");

    if (!userCreated) return res.sendStatus(500);

    res.sendStatus(201);
};

export const signIn = async (req: Request, res: Response) => {
    const { email, password }: signInReqBody = req.body;

    if (!email || !password) return res.sendStatus(400);

    const user = await User.findOne({ email });

    if (!user) return res.sendStatus(404);

    const isPassword = await user.isPasswordValid(password);

    if (!isPassword) return res.sendStatus(401);

    const generatedTokens = await generateAccessAndRefreshToken(user._id);

    if (typeof generatedTokens === "string") return res.sendStatus(500);
    
    const loggedInUser = await User.findById(user._id).select("-sub -refreshToken -password -__v -updatedAt -createdAt").lean();
    
    res
        .status(200)
        .cookie("refreshToken", generatedTokens.refreshToken, { secure: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
        .json({ user: { ...loggedInUser, avatar: loggedInUser?.avatar?.url }, accessToken: generatedTokens.accessToken });
};

export const signOut = async (req: Request, res: Response) => {
    const cookies = req.cookies;

    if (!cookies.refreshToken) return res.sendStatus(204);

    const refreshToken = cookies.refreshToken;
    const userWithRT = await User.findOne({ refreshToken });

    if (!userWithRT) {
        res.clearCookie("refreshToken", { secure: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        return res.sendStatus(204);
    }

    userWithRT.refreshToken = "";
    await userWithRT.save();

    res
        .clearCookie("refreshToken", { secure: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
        .sendStatus(204);
};

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const oAuth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "postmessage"
        );
    
        const { tokens } = await oAuth2Client.getToken(req.body.code);
    
        let decodedToken;
    
        if(tokens.id_token)
            decodedToken = await decode(tokens.id_token);

        const user = await User.findOne({ sub: decodedToken.sub });

        if (!user) {
            const userCreated = await User.create({
                sub: decodedToken.sub,
                username: decodedToken.name,
                email: decodedToken.email,
                avatar: { url: decodedToken.picture },
                isGoogleId: true,
                isAdmin: false,
            });

            if (!userCreated) return res.sendStatus(500);

            const generatedTokens = await generateAccessAndRefreshToken(userCreated._id);

            if (typeof generatedTokens === "string") return res.sendStatus(500);
            
            const loggedInUser = await User.findById(userCreated._id).select("-sub -refreshToken -password -__v -updatedAt -createdAt").lean();
            
            res
                .status(200)
                .cookie("refreshToken", generatedTokens.refreshToken, { secure: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
                .json({ user: { ...loggedInUser, avatar: loggedInUser?.avatar?.url }, accessToken: generatedTokens.accessToken });
        } else {
            const generatedTokens = await generateAccessAndRefreshToken(user._id);
    
            if (typeof generatedTokens === "string") return res.sendStatus(500);

            const loggedInUser = await User.findById(user._id).select("-sub -refreshToken -password -__v -updatedAt -createdAt").lean();
            
            res
                .status(200)
                .cookie("refreshToken", generatedTokens.refreshToken, { secure: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
                .json({ user: { ...loggedInUser, avatar: loggedInUser?.avatar?.url }, accessToken: generatedTokens.accessToken });
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(404);
    }  
};

export const handleRefreshToken = async (req: Request, res: Response) => {
    const cookies = req.cookies;

    if (!cookies?.refreshToken) return res.sendStatus(204);

    const refreshToken: string = cookies.refreshToken;
    const userWithRT = await User.findOne({ refreshToken }).select("-sub -refreshToken -password -__v -updatedAt -createdAt");

    if (!userWithRT) return res.sendStatus(403);
    
    jwt.verify(
        refreshToken, 
        process.env.REFRESH_TOKEN_SECRET!,
        undefined,
        (err: VerifyErrors | null, decoded: decodedRT | string | JwtPayload | undefined ) => {
            if (err || !decoded || userWithRT._id.toString() !== (decoded as decodedRT)._id) return res.sendStatus(403);
            
            const accessToken = userWithRT.generateAccessToken();
            const user = userWithRT.toObject();
            
            res.json({ user: { ...user, avatar: user.avatar?.url }, accessToken });
        }
    );

};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.body;
    const { refreshToken } = req.cookies;

    if (!id) return res.sendStatus(400);

    const foundUser = await User.findById(id);

    if (!foundUser) return res.sendStatus(404);

    const public_id = foundUser.avatar?.public_id;

    if (public_id) await deleteAsset(public_id);

    await User.findByIdAndDelete(id);

    if (!refreshToken) return res.sendStatus(204);

    res
        .clearCookie("refreshToken", { secure: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
        .sendStatus(204);
};
