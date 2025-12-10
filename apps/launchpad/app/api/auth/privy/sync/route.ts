import { randomUUID } from "crypto";
import { db } from "@sim/db";
import { user } from "@sim/db/schema";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

interface PrivyLinkedAccount {
  type: string;
  address?: string;
  verifiedAt?: Date | null;
}

interface PrivyUserData {
  privyId: string;
  createdAt: Date;
  updatedAt: Date;
  linkedAccounts?: PrivyLinkedAccount[];
  wallet?: {
    address: string;
    walletClientType?: string;
    chainType?: string;
  };
  wallets?: Array<{
    address: string;
    walletClientType?: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * POST /api/auth/privy/sync
 * Sync Privy user data to the database
 */
export async function POST(request: NextRequest) {
  let privyUserData: PrivyUserData | null = null;

  try {
    // Test database connection first
    try {
      await db.select().from(user).limit(1);
    } catch (dbTestError: any) {
      console.error("Database connection test failed", dbTestError);

      // Check if it's a "relation does not exist" error (table doesn't exist)
      const isTableMissing =
        dbTestError?.message?.includes("does not exist") ||
        dbTestError?.message?.includes("relation") ||
        dbTestError?.code === "42P01";

      if (isTableMissing) {
        return NextResponse.json(
          {
            error: "Database tables not found. Please run migrations first.",
            details:
              process.env.NODE_ENV === "development"
                ? "Run: cd packages/db && bunx drizzle-kit push --config=./drizzle.config.ts"
                : undefined,
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        {
          error: "Database connection failed",
          details:
            process.env.NODE_ENV === "development"
              ? dbTestError?.message
              : undefined,
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    privyUserData = body.user;
    const walletAddress = body.walletAddress as string | undefined;

    if (!privyUserData || !privyUserData.privyId) {
      return NextResponse.json(
        { error: "Invalid request. Privy user data is required." },
        { status: 400 },
      );
    }

    // Extract email from linked accounts
    const emailAccount = privyUserData.linkedAccounts?.find(
      (account) => account.type === "email",
    );
    const userEmail = emailAccount?.address;

    // Validate email format if provided
    if (userEmail && !userEmail.includes("@")) {
      console.warn("Invalid email format from Privy", { email: userEmail });
    }

    // Extract name from metadata or use email as fallback
    const userName =
      (privyUserData.metadata?.name as string) ||
      userEmail?.split("@")[0] ||
      "User";

    // Check if user already exists by email
    let existingUser = null;

    try {
      if (userEmail) {
        const foundUsers = await db
          .select()
          .from(user)
          .where(eq(user.email, userEmail))
          .limit(1);
        existingUser = foundUsers[0] || null;
      } else {
        // If no email, check if a user with the generated email already exists
        const sanitizedPrivyId = privyUserData.privyId
          .replace(/[^a-zA-Z0-9]/g, "")
          .substring(0, 20);
        const generatedEmail = `privy-${sanitizedPrivyId}@privy.local`;

        const foundUsers = await db
          .select()
          .from(user)
          .where(eq(user.email, generatedEmail))
          .limit(1);

        existingUser = foundUsers[0] || null;
      }
    } catch (dbError: any) {
      console.error(
        "Database query failed when checking for existing user",
        dbError,
      );
      throw new Error(
        `Database connection error: ${dbError?.message || "Unknown database error"}`,
      );
    }

    const now = new Date();

    // Check if user already exists by wallet address (if provided)
    if (!existingUser && walletAddress) {
      try {
        const foundUsers = await db
          .select()
          .from(user)
          .where(eq(user.walletAddress, walletAddress))
          .limit(1);
        if (foundUsers.length > 0) {
          existingUser = foundUsers[0];
          console.log("Found existing user by wallet address", {
            userId: existingUser.id,
            walletAddress,
          });
        }
      } catch (dbError: any) {
        console.error(
          "Database query failed when checking for existing user by wallet",
          dbError,
        );
      }
    }

    if (existingUser) {
      // Update existing user with Privy data
      const isEmailVerified =
        emailAccount?.verifiedAt !== undefined &&
        emailAccount?.verifiedAt !== null
          ? true
          : existingUser.emailVerified;

      await db
        .update(user)
        .set({
          name: userName || existingUser.name,
          email: userEmail || existingUser.email,
          emailVerified: isEmailVerified,
          walletAddress: walletAddress || existingUser.walletAddress,
          updatedAt: now,
        })
        .where(eq(user.id, existingUser.id));

      console.log("Updated existing user with Privy data", {
        userId: existingUser.id,
        privyId: privyUserData.privyId,
      });

      // Set a cookie with the user ID for Privy authentication
      const response = NextResponse.json({
        success: true,
        user: {
          id: existingUser.id,
          privyId: privyUserData.privyId,
          email: userEmail || existingUser.email,
          name: userName,
        },
        action: "updated",
      });

      // Set cookie for Privy authentication (expires in 30 days)
      response.cookies.set("privy-user-id", existingUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });

      return response;
    }

    // Create new user
    const sanitizedPrivyId = privyUserData.privyId
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 20);
    let finalEmail = userEmail || `privy-${sanitizedPrivyId}@privy.local`;

    // Ensure email is valid and not too long (max 255 chars for most databases)
    if (!finalEmail.includes("@")) {
      throw new Error("Invalid email format generated");
    }

    if (finalEmail.length > 255) {
      const [localPart, domain] = finalEmail.split("@");
      const maxLocalLength = 255 - domain.length - 1;
      const truncatedLocal = localPart.substring(0, maxLocalLength);
      finalEmail = `${truncatedLocal}@${domain}`;
      console.warn("Email truncated due to length", {
        original: userEmail || `privy-${sanitizedPrivyId}@privy.local`,
        truncated: finalEmail,
      });
    }

    // Double-check that email doesn't already exist (race condition protection)
    let existingByEmail = null;
    try {
      const foundUsers = await db
        .select()
        .from(user)
        .where(eq(user.email, finalEmail))
        .limit(1);
      existingByEmail = foundUsers[0] || null;
    } catch (dbError: any) {
      console.error(
        "Database query failed when checking for existing email",
        dbError,
      );
      throw new Error(
        `Database connection error: ${dbError?.message || "Unknown database error"}`,
      );
    }

    if (existingByEmail) {
      console.log("User already exists with this email, updating instead", {
        userId: existingByEmail.id,
        email: finalEmail,
      });
      existingUser = existingByEmail;
    } else {
      const newUserId = randomUUID();

      // Determine email verified status
      const isEmailVerified =
        emailAccount?.verifiedAt !== undefined &&
        emailAccount?.verifiedAt !== null;

      console.log("Creating new user", {
        userId: newUserId,
        email: finalEmail,
        name: userName,
        emailVerified: isEmailVerified,
      });

      try {
        const [newUser] = await db
          .insert(user)
          .values({
            id: newUserId,
            name: userName || "User",
            email: finalEmail,
            emailVerified: isEmailVerified,
            walletAddress: walletAddress || undefined,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        console.log("Created new user from Privy data", {
          userId: newUser.id,
          privyId: privyUserData.privyId,
        });

        // Set a cookie with the user ID for Privy authentication
        const response = NextResponse.json({
          success: true,
          user: {
            id: newUser.id,
            privyId: privyUserData.privyId,
            email: newUser.email,
            name: newUser.name,
          },
          action: "created",
        });

        // Set cookie for Privy authentication (expires in 30 days)
        response.cookies.set("privy-user-id", newUser.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: "/",
        });

        return response;
      } catch (insertError: any) {
        // If insert fails due to unique constraint, try to find existing user
        if (
          insertError?.code === "23505" ||
          insertError?.message?.includes("unique")
        ) {
          console.warn(
            "Insert failed due to unique constraint, checking for existing user",
            {
              email: finalEmail,
            },
          );

          let existingByEmailAfterError = null;
          try {
            const foundUsers = await db
              .select()
              .from(user)
              .where(eq(user.email, finalEmail))
              .limit(1);

            existingByEmailAfterError = foundUsers[0] || null;
          } catch (dbError: any) {
            console.error(
              "Database query failed when checking for existing user after insert error",
              dbError,
            );
            throw insertError;
          }

          if (existingByEmailAfterError) {
            existingUser = existingByEmailAfterError;
          } else {
            throw insertError;
          }
        } else {
          throw insertError;
        }
      }
    }

    // If we reach here, existingUser was set
    if (existingUser) {
      const isEmailVerified =
        emailAccount?.verifiedAt !== undefined &&
        emailAccount?.verifiedAt !== null
          ? true
          : existingUser.emailVerified;

      await db
        .update(user)
        .set({
          name: userName || existingUser.name,
          email: finalEmail || existingUser.email,
          emailVerified: isEmailVerified,
          walletAddress: walletAddress || existingUser.walletAddress,
          updatedAt: now,
        })
        .where(eq(user.id, existingUser.id));

      console.log(
        "Updated existing user with Privy data (after insert conflict)",
        {
          userId: existingUser.id,
          privyId: privyUserData.privyId,
        },
      );

      const response = NextResponse.json({
        success: true,
        user: {
          id: existingUser.id,
          privyId: privyUserData.privyId,
          email: finalEmail || existingUser.email,
          name: userName,
        },
        action: "updated",
      });

      response.cookies.set("privy-user-id", existingUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }
  } catch (error: any) {
    console.error("Failed to sync Privy user data", {
      error,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorCode: error?.code,
      privyUserData: privyUserData ? { privyId: privyUserData.privyId } : null,
    });

    // Handle unique constraint violation (email already exists)
    if (error?.code === "23505" || error?.message?.includes("unique")) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    const errorMessage =
      process.env.NODE_ENV === "development"
        ? error?.message || "Failed to sync user data"
        : "Failed to sync user data";

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 },
    );
  }

  // Fallback return (should never reach here)
  return NextResponse.json(
    { error: "Unexpected error occurred" },
    { status: 500 },
  );
}
