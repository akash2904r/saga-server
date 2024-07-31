import fs from "fs";
import path from "path";

const DIR = '../server/src/public/temp';

export const checkFileExistence = async (imgId: string) => {
    let foundImage;

    const files = await fs.promises.readdir(DIR);

    for (const file of files) {
        const fileExists = file.includes(imgId);

        if (fileExists) {
            foundImage = path.join(DIR, file);
            break;
        }
    }

    return foundImage;
};
