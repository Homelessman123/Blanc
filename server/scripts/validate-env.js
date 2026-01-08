import 'dotenv/config';

const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
];

const optionalVars = [
    'REDIS_URL',
    'OTP_EMAIL_URL',
    'OPENROUTER_API_KEY',
    'OTP_SECRET_KEY',
];

console.log('🔍 Environment Validation:\n');

let hasError = false;

// Check required variables
requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
        console.error(`❌ ${varName}: MISSING (REQUIRED)`);
        hasError = true;
    } else if (value.includes('${{') || value.includes('}}')) {
        console.error(`❌ ${varName}: PLACEHOLDER NOT REPLACED`);
        console.error(`   Value: ${value.substring(0, 50)}...`);
        hasError = true;
    } else if (value.includes('<') && value.includes('>')) {
        console.error(`❌ ${varName}: CONTAINS PLACEHOLDER BRACKETS`);
        console.error(`   Value: ${value.substring(0, 50)}...`);
        hasError = true;
    } else {
        console.log(`✅ ${varName}: OK (length: ${value.length})`);
    }
});

// Check optional variables
console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
        console.warn(`⚠️  ${varName}: Not set (optional)`);
    } else {
        console.log(`✅ ${varName}: OK`);
    }
});

// Check NODE_ENV
console.log('\n🌍 Environment:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   PORT: ${process.env.PORT || '4000'}`);

if (hasError) {
    console.error('\n❌ Environment validation failed!');
    console.error('Fix Railway variables and redeploy.');
    process.exit(1);
}

console.log('\n✅ Environment validation passed!');
