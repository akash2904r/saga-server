import dontenv from "dotenv";

import connectDB from "./db/connect.ts";
import app from "./app.ts";

dontenv.config({ path: '../.env' });

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server running on: http://localhost:${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log("MONGODB Connection Failed !!! ", error);
    });