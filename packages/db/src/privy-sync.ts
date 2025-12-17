import { randomUUID } from "crypto";
import { db } from "..";
import { user } from "../schema";
import { eq } from "drizzle-orm";

export interface PrivyLinkedAccount {
    type: string;
    address?: string;
    verifiedAt?: Date | null;
}

export interface PrivyUserData {
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
        chainType?: string;
    }>;
    metadata?: Record<string, any>;
}

export type SyncResult = {
    success: boolean;
    user?: {
        id: string;
        privyId: string;
        email: string;
        name: string;
    };
    action?: "created" | "updated";
    error?: string;
    details?: any;
};

/**
 * Sync Privy user data to the database
 */
export async function syncPrivyUser(
    privyUserData: PrivyUserData,
    walletAddress?: string
): Promise<SyncResult> {
    try {
        // 1. Basic Validation
        if (!privyUserData || !privyUserData.privyId) {
            return { success: false, error: "Invalid request. Privy user data is required." };
        }

        // 2. Extract Data
        const emailAccount = privyUserData.linkedAccounts?.find(
            (account) => account.type === "email"
        );
        const userEmail = emailAccount?.address;
        const userName =
            (privyUserData.metadata?.name as string) ||
            userEmail?.split("@")[0] ||
            "User";

        if (userEmail && !userEmail.includes("@")) {
            console.warn("Invalid email format from Privy", { email: userEmail });
        }

        // 3. Find Existing User
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
            console.error("Database query failed when checking for existing user", dbError);
            return { success: false, error: "Database connection error", details: dbError };
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
                console.error("Database query failed when checking for existing user by wallet", dbError);
            }
        }

        // 4. Update Existing User
        if (existingUser) {
            const isEmailVerified =
                emailAccount?.verifiedAt !== undefined &&
                    emailAccount?.verifiedAt !== null
                    ? true
                    : existingUser.emailVerified;

            // Extract generated email logic for fallback to keep typescript happy if userEmail is undefined
            const sanitizedPrivyId = privyUserData.privyId
                .replace(/[^a-zA-Z0-9]/g, "")
                .substring(0, 20);
            const generatedEmail = `privy-${sanitizedPrivyId}@privy.local`;
            const finalEmail = userEmail || existingUser.email || generatedEmail;

            await db
                .update(user)
                .set({
                    name: userName || existingUser.name,
                    email: finalEmail,
                    emailVerified: isEmailVerified,
                    walletAddress: walletAddress || existingUser.walletAddress,
                    updatedAt: now,
                })
                .where(eq(user.id, existingUser.id));

            console.log("Updated existing user with Privy data", {
                userId: existingUser.id,
                privyId: privyUserData.privyId,
            });

            return {
                success: true,
                user: {
                    id: existingUser.id,
                    privyId: privyUserData.privyId,
                    email: finalEmail,
                    name: userName,
                },
                action: "updated",
            };
        }

        // 5. Create New User
        const sanitizedPrivyId = privyUserData.privyId
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, 20);
        let finalEmail = userEmail || `privy-${sanitizedPrivyId}@privy.local`;

        if (!finalEmail.includes("@")) {
            return { success: false, error: "Invalid email format generated" };
        }

        if (finalEmail.length > 255) {
            const [localPart, domain] = finalEmail.split("@");
            const maxLocalLength = 255 - domain.length - 1;
            const truncatedLocal = localPart.substring(0, maxLocalLength);
            finalEmail = `${truncatedLocal}@${domain}`;
        }

        // Double-check race condition
        let existingByEmail = null;
        try {
            const foundUsers = await db
                .select()
                .from(user)
                .where(eq(user.email, finalEmail))
                .limit(1);
            existingByEmail = foundUsers[0] || null;
        } catch (dbError: any) {
            return { success: false, error: "Database connection error", details: dbError };
        }

        if (existingByEmail) {
            // Recurse or just handle update here? Simplicity: Update here.
            // Actually let's just use the update block above by calling recursively or copy-paste?
            // Copy-paste safely to avoid recursion depth issues, or just re-assign existingUser and goto?
            // Let's just update.
            const isEmailVerified =
                emailAccount?.verifiedAt !== undefined &&
                    emailAccount?.verifiedAt !== null
                    ? true
                    : existingByEmail.emailVerified;

            await db
                .update(user)
                .set({
                    name: userName || existingByEmail.name,
                    email: finalEmail,
                    emailVerified: isEmailVerified,
                    walletAddress: walletAddress || existingByEmail.walletAddress,
                    updatedAt: now,
                })
                .where(eq(user.id, existingByEmail.id));

            return {
                success: true,
                user: {
                    id: existingByEmail.id,
                    privyId: privyUserData.privyId,
                    email: finalEmail,
                    name: userName,
                },
                action: "updated",
            };
        }

        // Insert new
        const newUserId = randomUUID();
        const isEmailVerified =
            emailAccount?.verifiedAt !== undefined &&
            emailAccount?.verifiedAt !== null;

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

            return {
                success: true,
                user: {
                    id: newUser.id,
                    privyId: privyUserData.privyId,
                    email: newUser.email,
                    name: newUser.name,
                },
                action: "created",
            };

        } catch (insertError: any) {
            // Unique constraint retry
            if (
                insertError?.code === "23505" ||
                insertError?.message?.includes("unique")
            ) {
                // One last try to find it
                const foundUsers = await db
                    .select()
                    .from(user)
                    .where(eq(user.email, finalEmail))
                    .limit(1);
                const verifyUser = foundUsers[0];

                if (verifyUser) {
                    // Update
                    await db
                        .update(user)
                        .set({
                            updatedAt: now,
                            walletAddress: walletAddress || verifyUser.walletAddress
                        })
                        .where(eq(user.id, verifyUser.id));

                    return {
                        success: true,
                        user: {
                            id: verifyUser.id,
                            privyId: privyUserData.privyId,
                            email: verifyUser.email,
                            name: verifyUser.name
                        },
                        action: "updated"
                    }
                }
            }
            throw insertError;
        }

    } catch (error: any) {
        console.error("Failed to sync Privy user data", error);
        return {
            success: false,
            error: error?.message || "Failed to sync user data",
            details: error
        };
    }
}
