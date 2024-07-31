import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadOnCloud = async (localFilePath: string) => {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        if (!localFilePath) return null;

        // Uploading the image on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "image" });

        if (response?.url) fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // Removes the locally stored temporary image due the upload failure

        console.log(error);
    }
};

export const deleteAsset = async (public_id: string): Promise<void | number> => {
    if (!public_id) return;

    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        await cloudinary.uploader.destroy(public_id, { resource_type: "image" });
    } catch (error) {
        console.log("Error while deleting asset: ", error);
        
        return 500;
    }
};

        