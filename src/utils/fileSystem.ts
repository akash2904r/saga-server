import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIR = join(__dirname, 'server', 'src', 'public', 'temp');

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
