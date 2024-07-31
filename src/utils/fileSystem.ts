import fs from "fs";
import { join } from "path";

import { DIR } from "../constants.ts";

export const checkFileExistence = async (imgId: string) => {
    let foundImage;

    const files = await fs.promises.readdir(DIR);

    for (const file of files) {
        const fileExists = file.includes(imgId);

        if (fileExists) {
            foundImage = join(DIR, file);
            break;
        }
    }

    return foundImage;
};
