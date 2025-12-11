import { AppDataSource } from './database.config';
import { seedDatabase } from './seeds/seed';

async function runCli() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const command = process.argv[2];

    if (command === 'seed') {
      console.log('Seeding database...');
      await seedDatabase(AppDataSource);
      console.log('Database seeding completed');
    } else {
      console.log('Unknown command. Available commands: seed');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

runCli();
