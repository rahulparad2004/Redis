import express from "express";
import Redis from "ioredis";

const app = express();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.use(express.json());


function otpKey(phone) {
    return `otp:${phone}`;
}

app.post("/otp", async (req, res) => {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

    await redis.set(otpKey(phone), otp, "EX", 30); // Store OTP in Redis with a TTL of 30 seconds
    res.json({ message: "OTP sent successfully", otp }); // In a real application, you would send the OTP via SMS or email
});

app.post("/otp/verify", async (req, res) => {
    const { phone, otp } = req.body;
    const savedOtp = await redis.get(otpKey(phone));

    if (!savedOtp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if(savedOtp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    await redis.del(otpKey(phone)); // Delete the OTP after successful verification
    res.json({ message: "OTP verified successfully" });
})

app.get("/otp/:phone/ttl", async (req, res) => {
    const { phone } = req.params;
    const ttl = await redis.ttl(otpKey(phone));

    res.json({ ttl });
})

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});