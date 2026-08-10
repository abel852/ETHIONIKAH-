const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearUsers() {
  try {
    console.log("Starting user cleanup...");
    
    // Find super admin(s) to preserve
    const superAdmins = await prisma.user.findMany({
      where: {
        role: "admin",
        adminRole: "super_admin",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (superAdmins.length === 0) {
      console.error("❌ No super admin found! Aborting to prevent data loss.");
      process.exit(1);
    }

    console.log(`\n✓ Found ${superAdmins.length} super admin(s) to preserve:`);
    superAdmins.forEach((admin) => {
      console.log(`  - ${admin.email} (${admin.firstName} ${admin.lastName})`);
    });

    const superAdminIds = superAdmins.map((admin) => admin.id);

    // Count users to be deleted
    const usersToDelete = await prisma.user.count({
      where: {
        id: {
          notIn: superAdminIds,
        },
      },
    });

    console.log(`\n⚠️  About to delete ${usersToDelete} users (keeping super admins)`);
    console.log("Press Ctrl+C within 5 seconds to cancel...\n");

    // Wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("Proceeding with deletion...\n");

    // Delete related data first (to avoid foreign key constraints)
    
    // Delete profiles (which will cascade to many related tables)
    const deletedProfiles = await prisma.profile.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedProfiles.count} profiles`);

    // Delete verification records
    const deletedVerifications = await prisma.verification.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedVerifications.count} verification records`);

    // Delete subscriptions
    const deletedSubscriptions = await prisma.subscription.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedSubscriptions.count} subscriptions`);

    // Delete notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedNotifications.count} notifications`);

    // Delete reports (where user is reporter)
    const deletedReports = await prisma.report.deleteMany({
      where: {
        reporterId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedReports.count} reports`);

    // Delete favorites/likes
    const deletedFavorites = await prisma.favorite.deleteMany({
      where: {
        OR: [
          { userId: { notIn: superAdminIds } },
          { favoritedUserId: { notIn: superAdminIds } },
        ],
      },
    });
    console.log(`✓ Deleted ${deletedFavorites.count} favorites`);

    // Delete blocked users
    const deletedBlocked = await prisma.blockedUser.deleteMany({
      where: {
        OR: [
          { blockerId: { notIn: superAdminIds } },
          { blockedId: { notIn: superAdminIds } },
        ],
      },
    });
    console.log(`✓ Deleted ${deletedBlocked.count} blocked users`);

    // Delete conversation requests
    const deletedConvRequests = await prisma.conversationRequest.deleteMany({
      where: {
        OR: [
          { requesterId: { notIn: superAdminIds } },
          { receiverId: { notIn: superAdminIds } },
        ],
      },
    });
    console.log(`✓ Deleted ${deletedConvRequests.count} conversation requests`);

    // Delete messages
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: { notIn: superAdminIds } },
          { receiverId: { notIn: superAdminIds } },
        ],
      },
    });
    console.log(`✓ Deleted ${deletedMessages.count} messages`);

    // Delete exclusive partnerships
    const deletedPartnerships = await prisma.exclusivePartnership.deleteMany({
      where: {
        OR: [
          { userAId: { notIn: superAdminIds } },
          { userBId: { notIn: superAdminIds } },
        ],
      },
    });
    console.log(`✓ Deleted ${deletedPartnerships.count} exclusive partnerships`);

    // Delete exclusive partnership requests
    const deletedPartnershipReqs = await prisma.exclusivePartnershipRequest.deleteMany({
      where: {
        OR: [
          { requesterId: { notIn: superAdminIds } },
          { receiverId: { notIn: superAdminIds } },
        ],
      },
    });
    console.log(`✓ Deleted ${deletedPartnershipReqs.count} partnership requests`);

    // Delete profile views
    const deletedProfileViews = await prisma.profileView.deleteMany({
      where: {
        OR: [
          { viewerId: { notIn: superAdminIds } },
          { viewedId: { notIn: superAdminIds } },
        ],
      },
    });
    console.log(`✓ Deleted ${deletedProfileViews.count} profile views`);

    // Delete matches
    const deletedMatches = await prisma.match.deleteMany({
      where: {
        OR: [
          { userId: { notIn: superAdminIds } },
          { matchedUserId: { notIn: superAdminIds } },
        ],
      },
    });
    console.log(`✓ Deleted ${deletedMatches.count} matches`);

    // Delete user restrictions
    const deletedRestrictions = await prisma.userRestriction.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedRestrictions.count} restrictions`);

    // Delete wali records
    const deletedWali = await prisma.wali.deleteMany({
      where: {
        femaleUserId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedWali.count} wali records`);

    // Delete admin permissions (for non-super admins)
    const deletedPermissions = await prisma.adminPermission.deleteMany({
      where: {
        adminId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedPermissions.count} admin permissions`);

    // Delete audit logs (for non-super admins)
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        actorId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedAuditLogs.count} audit logs`);

    // Delete payments
    const deletedPayments = await prisma.payment.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedPayments.count} payments`);

    // Delete wallets
    const deletedWallets = await prisma.wallet.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedWallets.count} wallets`);

    // Delete boosts
    const deletedBoosts = await prisma.boost.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedBoosts.count} boosts`);

    // Delete user contact credits
    const deletedContactCredits = await prisma.userContactCredit.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedContactCredits.count} contact credits`);

    // Delete complaints
    const deletedComplaints = await prisma.complaint.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedComplaints.count} complaints`);

    // Delete push subscriptions
    const deletedPushSubs = await prisma.pushSubscription.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedPushSubs.count} push subscriptions`);

    // Delete book purchases
    const deletedBookPurchases = await prisma.bookPurchase.deleteMany({
      where: {
        userId: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedBookPurchases.count} book purchases`);

    // Finally, delete the users themselves
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          notIn: superAdminIds,
        },
      },
    });
    console.log(`✓ Deleted ${deletedUsers.count} users\n`);

    console.log("✅ User cleanup completed successfully!");
    console.log(`\nRemaining users: ${superAdmins.length} (super admin(s) only)`);
    
  } catch (error) {
    console.error("❌ Error during user cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers();
