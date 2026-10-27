import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import User from "../src/models/User.js";

dotenv.config();

const rl = readline.createInterface({ input, output });

async function createAdmin() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from your .env file.");
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from your .env file.");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB.");

        const email = (
            await rl.question("Enter admin email: ")
        ).trim().toLowerCase();

        const password = await rl.question(
            "Enter admin password (minimum 12 characters): "
        );

        if (!email || password.length < 12) {
            throw new Error(
                "Enter a valid email and a password of at least 12 characters."
            );
        }

        const existingAdmin = await User.findOne({
            role: "admin"
        });

        if (existingAdmin) {
            throw new Error(
                "An admin already exists. This script will not create another."
            );
        }

        const existingEmail = await User.findOne({ email });

        if (existingEmail) {
            throw new Error(
                "This email already belongs to an account. Use a different email."
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await User.create({
            name: "System Administrator",
            email,
            password: hashedPassword,
            role: "admin",
            isActive: true
        });

        console.log("Admin account created successfully.");
    } catch (error) {
        console.error("Admin setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        rl.close();
        await mongoose.disconnect().catch(() => { });
    }
}

createAdmin();