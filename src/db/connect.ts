import mongooose from 'mongoose';
import { DB_NAME } from '../constants.ts';

const connectDB = async () => {
    try {
        const connectionInstance = await mongooose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        console.log(`MONGODB Connected !!! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONOGDB Connection Error: ", error);
    }
};

export default connectDB;