import { db } from '@/db';
import { dataSharing } from '@/db/schema';

async function main() {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const sampleDataSharing = [
        {
            adminId: 1,
            employeeId: 2,
            sharedDataType: 'call_logs',
            sharedData: {
                totalCalls: 45,
                connectedCalls: 30,
                missedCalls: 15,
                avgDuration: 245
            },
            message: 'Your weekly call logs summary',
            isRead: false,
            createdAt: twoDaysAgo.toISOString(),
        },
        {
            adminId: 1,
            employeeId: 3,
            sharedDataType: 'reports',
            sharedData: {
                reportType: 'performance',
                metrics: {
                    successRate: 85,
                    avgCallDuration: 320,
                    totalContacts: 120
                }
            },
            message: 'Monthly performance report attached',
            isRead: true,
            createdAt: fiveDaysAgo.toISOString(),
        },
        {
            adminId: 1,
            employeeId: 4,
            sharedDataType: 'announcement',
            sharedData: {
                title: 'New Call Script Available',
                priority: 'high',
                category: 'training'
            },
            message: 'Please review the new call handling procedures',
            isRead: false,
            createdAt: oneDayAgo.toISOString(),
        },
        {
            adminId: 1,
            employeeId: 5,
            sharedDataType: 'call_logs',
            sharedData: {
                date: '2024-01-15',
                calls: 12,
                duration: 2400,
                status: 'good'
            },
            message: 'Daily call summary for review',
            isRead: false,
            createdAt: threeDaysAgo.toISOString(),
        },
        {
            adminId: 1,
            employeeId: 6,
            sharedDataType: 'announcement',
            sharedData: {
                title: 'Team Meeting Scheduled',
                date: '2024-01-20',
                time: '10:00 AM'
            },
            message: 'Mandatory team meeting next week',
            isRead: true,
            createdAt: fourDaysAgo.toISOString(),
        }
    ];

    await db.insert(dataSharing).values(sampleDataSharing);
    
    console.log('✅ Data sharing seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});