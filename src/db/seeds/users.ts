import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const employeePasswordHash = await bcrypt.hash('emp123', 10);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const sampleUsers = [
        {
            username: 'admin',
            password: adminPasswordHash,
            role: 'admin',
            isActive: true,
            createdAt: thirtyDaysAgo.toISOString(),
        },
        {
            username: 'employee1',
            password: employeePasswordHash,
            role: 'employee',
            isActive: true,
            createdAt: twentyDaysAgo.toISOString(),
        },
        {
            username: 'employee2',
            password: employeePasswordHash,
            role: 'employee',
            isActive: true,
            createdAt: fifteenDaysAgo.toISOString(),
        },
        {
            username: 'employee3',
            password: employeePasswordHash,
            role: 'employee',
            isActive: true,
            createdAt: tenDaysAgo.toISOString(),
        },
        {
            username: 'employee4',
            password: employeePasswordHash,
            role: 'employee',
            isActive: true,
            createdAt: fiveDaysAgo.toISOString(),
        },
        {
            username: 'employee5',
            password: employeePasswordHash,
            role: 'employee',
            isActive: false,
            createdAt: threeDaysAgo.toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});