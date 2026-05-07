import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET!;

export const signToken = (payload: object): string => jwt.sign(payload, SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string): jwt.JwtPayload => jwt.verify(token, SECRET) as jwt.JwtPayload;

