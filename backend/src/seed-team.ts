import prisma from './db';

/**
 * Legacy team seeding script placeholder.
 * The original data relied on chat/channel tables that have been removed.
 * Keeping this stub avoids build failures while clearly indicating the script is deprecated.
 */
async function main() {
  console.warn('seed-team.ts is deprecated because the chat/channel schema has been removed.');
  console.warn('If you need to seed team data, please implement a new script using the current schema.');
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('seed-team failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default main;
