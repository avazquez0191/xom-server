import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    mongoUser: string;
    mongoPassword: string;
    mongoHost: string;
    mongoDB: string;
    mongoURI: string;
}

const config: Config = {
    port: Number(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUser: process.env.MONGO_USER || 'xom-app',
    mongoPassword: process.env.MONGO_PASSWORD || 'xom-password',
    mongoHost: process.env.MONGO_HOST || 'xom-cluster.mongodb.net',
    mongoDB: process.env.MONGO_DB || 'xom',
    mongoURI: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DB}?retryWrites=true&w=majority`
};

export default config;