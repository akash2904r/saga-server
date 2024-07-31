import fs from "fs";
import { join } from "path";

import { DIR } from "../constants.ts";

export const checkFileExistence = async (imgId: string) => {
    let foundImage;

    console.log("Check File Existence ", DIR)
    const files = await fs.promises.readdir(DIR);
    console.log("Files ", files)
    for (const file of files) {
        const fileExists = file.includes(imgId);

        if (fileExists) {
            foundImage = join(DIR, file);
            break;
        }
    }

    return foundImage;
};
