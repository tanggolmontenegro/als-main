import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { LoginLog } from "@/types/auth";

export async function GET(req: Request) {
  try {
    // Get user ID from query parameters or headers
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    let client;
    try {
      client = await clientPromise;
      if (!client) {
        throw new Error("MongoDB client is not initialized");
      }
    } catch (dbError) {
      console.error("MongoDB connection error:", dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database connection failed. Please check your MongoDB configuration."
        },
        { status: 500 }
      );
    }

    const db = client.db("main");

    // Fetch login logs for the user, sorted by most recent first
    const loginLogs = await db
      .collection("login_logs")
      .find({ userId: userId })
      .sort({ loginAt: -1 })
      .limit(50) // Limit to last 50 logins
      .toArray();

    // Convert MongoDB _id to string
    const formattedLogs: LoginLog[] = loginLogs.map((log) => ({
      _id: log._id.toString(),
      userId: log.userId,
      email: log.email,
      device: log.device,
      browser: log.browser,
      os: log.os,
      ipAddress: log.ipAddress,
      loginAt: log.loginAt,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({ 
      success: true, 
      data: formattedLogs 
    });
  } catch (error) {
    console.error("Error fetching login history:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch login history";
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

