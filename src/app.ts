import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import authRoute from "./routes/auth.route.ts";
import userRoute from "./routes/user.route.ts";
import postRoute from "./routes/post.route.ts";
import commentRoute from "./routes/comment.route.ts";

dotenv.config({ path: './.env' });

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/post', postRoute);
app.use('/comment', commentRoute);

export default app;