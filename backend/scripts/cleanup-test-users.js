const prisma = require('../src/config/database');

async function cleanupTestUsers() {
  console.log('Starting cleanup of test users...');
  
  try {
    // Get super admin ID to exclude
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'hassenomia@gmail.com' },
      select: { id: true }
    });
    
    if (!superAdmin) {
      console.error('Super admin not found!');
      process.exit(1);
    }
    
    console.log('Super admin ID:', superAdmin.id);
    console.log('Excluding super admin from cleanup...');
    
    // Delete related records in order of dependencies
    const userIdsToDelete = (await prisma.user.findMany({
      where: { id: { not: superAdmin.id } },
      select: { id: true }
    })).map(u => u.id);
    
    console.log(`Found ${userIdsToDelete.length} users to delete`);
    
    // Delete audit logs (actorId references)
    const auditLogs = await prisma.auditLog.deleteMany({
      where: { actorId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${auditLogs.count} audit logs`);
    
    // Delete messages
    const messages = await prisma.message.deleteMany({
      where: { OR: [{ senderId: { in: userIdsToDelete } }, { receiverId: { in: userIdsToDelete } }] }
    });
    console.log(`Deleted ${messages.count} messages`);
    
    // Delete matches
    const matches = await prisma.match.deleteMany({
      where: { OR: [{ userId: { in: userIdsToDelete } }, { matchedUserId: { in: userIdsToDelete } }] }
    });
    console.log(`Deleted ${matches.count} matches`);
    
    // Delete favorites
    const favorites = await prisma.favorite.deleteMany({
      where: { OR: [{ userId: { in: userIdsToDelete } }, { favoritedUserId: { in: userIdsToDelete } }] }
    });
    console.log(`Deleted ${favorites.count} favorites`);
    
    // Delete blocked users
    const blocked = await prisma.blockedUser.deleteMany({
      where: { OR: [{ blockerId: { in: userIdsToDelete } }, { blockedId: { in: userIdsToDelete } }] }
    });
    console.log(`Deleted ${blocked.count} blocked users`);
    
    // Delete profile views
    const profileViews = await prisma.profileView.deleteMany({
      where: { OR: [{ viewerId: { in: userIdsToDelete } }, { viewedId: { in: userIdsToDelete } }] }
    });
    console.log(`Deleted ${profileViews.count} profile views`);
    
    // Delete conversation requests
    const convRequests = await prisma.conversationRequest.deleteMany({
      where: { OR: [{ requesterId: { in: userIdsToDelete } }, { receiverId: { in: userIdsToDelete } }] }
    });
    console.log(`Deleted ${convRequests.count} conversation requests`);
    
    // Delete exclusive partnerships
    const partnerships = await prisma.exclusivePartnership.deleteMany({
      where: { OR: [{ userAId: { in: userIdsToDelete } }, { userBId: { in: userIdsToDelete } }] }
    });
    console.log(`Deleted ${partnerships.count} exclusive partnerships`);
    
    // Delete notifications
    const notifications = await prisma.notification.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${notifications.count} notifications`);
    
    // Delete complaints (userId field, not reporterId)
    const complaints = await prisma.complaint.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${complaints.count} complaints`);
    
    // Delete reports
    const reports = await prisma.report.deleteMany({
      where: { OR: [{ reporterId: { in: userIdsToDelete } }, { reportedUserId: { in: userIdsToDelete } }] }
    });
    console.log(`Deleted ${reports.count} reports`);
    
    // Delete verifications
    const verifications = await prisma.verification.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${verifications.count} verifications`);
    
    // Delete spouse preferences
    const spousePrefs = await prisma.spousePreference.deleteMany({
      where: { profile: { userId: { in: userIdsToDelete } } }
    });
    console.log(`Deleted ${spousePrefs.count} spouse preferences`);
    
    // Delete health info
    const healthInfo = await prisma.healthInfo.deleteMany({
      where: { profile: { userId: { in: userIdsToDelete } } }
    });
    console.log(`Deleted ${healthInfo.count} health info records`);
    
    // Delete wali records
    const walis = await prisma.wali.deleteMany({
      where: { femaleUserId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${walis.count} wali records`);
    
    // Delete profiles
    const profiles = await prisma.profile.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${profiles.count} profiles`);
    
    // Delete subscriptions
    const subscriptions = await prisma.subscription.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${subscriptions.count} subscriptions`);
    
    // Delete payments
    const payments = await prisma.payment.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${payments.count} payments`);
    
    // Delete wallets
    const wallets = await prisma.wallet.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${wallets.count} wallets`);
    
    // Delete contact credits
    const credits = await prisma.userContactCredit.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${credits.count} contact credits`);
    
    // Delete admin permissions
    const permissions = await prisma.adminPermission.deleteMany({
      where: { adminId: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${permissions.count} admin permissions`);
    
    // Finally delete users
    const users = await prisma.user.deleteMany({
      where: { id: { in: userIdsToDelete } }
    });
    console.log(`Deleted ${users.count} users`);
    
    console.log('\n✅ Cleanup complete! Only super admin remains.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

cleanupTestUsers();
