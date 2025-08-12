import dotenv from 'dotenv';
dotenv.config();

export const TOKEN_SECRET = process.env.TOKEN_SECRET || "some_secret_key";

export const DB_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

export const PORT = process.env.PORT || 4000;