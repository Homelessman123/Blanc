import { connectToDatabase, getCollection } from '../lib/db.js';

/**
 * Fix critical platform settings that may cause session/connection issues
 */
async function fixPlatformSettings() {
  console.log('🔧 Fixing platform settings...\n');

  try {
    await connectToDatabase();
    const settings = getCollection('platform_settings');

    // Get current settings
    const current = await settings.findOne({ _id: 'platform_config' });
    
    console.log('📋 Current settings:');
    console.log('   Maintenance mode:', current?.general?.maintenanceMode);
    console.log('   Session timeout:', current?.security?.sessionTimeout, 'minutes');
    
    // Fix settings
    const result = await settings.updateOne(
      { _id: 'platform_config' },
      {
        $set: {
          'general.maintenanceMode': false,
          'security.sessionTimeout': 1440,  // 24 hours to match AUTH_COOKIE_MAX_AGE_MS
          'security.maxLoginAttempts': 5,
          'security.lockoutDuration': 15,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log('\n✅ Settings updated:');
    console.log('   Modified count:', result.modifiedCount || 'Created new');
    console.log('   Maintenance mode: OFF');
    console.log('   Session timeout: 1440 minutes (24 hours)');
    console.log('   Max login attempts: 5');
    console.log('   Lockout duration: 15 minutes');

    // Verify
    const updated = await settings.findOne({ _id: 'platform_config' });
    console.log('\n📊 Verified settings:');
    console.log(JSON.stringify(updated, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixPlatformSettings();
