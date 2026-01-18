import { db } from '@/db';
import { callLogs } from '@/db/schema';

async function main() {
    const sampleCallLogs = [
        // Employee 2 - 5 calls
        {
            employeeId: 2,
            callDate: '2024-12-28',
            callTime: '09:15:00',
            status: 'connected',
            duration: 245,
            customerPhone: '+1-555-0101',
            notes: 'Customer inquired about product pricing and availability',
            createdAt: new Date('2024-12-28T09:15:00').toISOString(),
        },
        {
            employeeId: 2,
            callDate: '2024-12-29',
            callTime: '14:30:00',
            status: 'connected',
            duration: 480,
            customerPhone: '+1-555-0102',
            notes: 'Technical support provided, issue resolved successfully',
            createdAt: new Date('2024-12-29T14:30:00').toISOString(),
        },
        {
            employeeId: 2,
            callDate: '2024-12-30',
            callTime: '11:45:00',
            status: 'not_answered',
            duration: 0,
            customerPhone: '+1-555-0103',
            notes: 'Customer did not pick up, voicemail left',
            createdAt: new Date('2024-12-30T11:45:00').toISOString(),
        },
        {
            employeeId: 2,
            callDate: '2025-01-02',
            callTime: '16:20:00',
            status: 'connected',
            duration: 325,
            customerPhone: '+1-555-0104',
            notes: 'Follow-up call scheduled for next week',
            createdAt: new Date('2025-01-02T16:20:00').toISOString(),
        },
        {
            employeeId: 2,
            callDate: '2025-01-05',
            callTime: '10:00:00',
            status: 'not_connected',
            duration: 0,
            customerPhone: '+1-555-0105',
            notes: 'Line was busy, will retry later',
            createdAt: new Date('2025-01-05T10:00:00').toISOString(),
        },

        // Employee 3 - 4 calls
        {
            employeeId: 3,
            callDate: '2024-12-27',
            callTime: '13:15:00',
            status: 'connected',
            duration: 180,
            customerPhone: '+1-555-0106',
            notes: 'Order placement and confirmation completed',
            createdAt: new Date('2024-12-27T13:15:00').toISOString(),
        },
        {
            employeeId: 3,
            callDate: '2024-12-31',
            callTime: '09:45:00',
            status: 'connected',
            duration: 420,
            customerPhone: '+1-555-0107',
            notes: 'Customer complaint resolved, compensation offered',
            createdAt: new Date('2024-12-31T09:45:00').toISOString(),
        },
        {
            employeeId: 3,
            callDate: '2025-01-03',
            callTime: '15:30:00',
            status: 'not_answered',
            duration: 0,
            customerPhone: '+1-555-0108',
            notes: 'No answer, customer unavailable',
            createdAt: new Date('2025-01-03T15:30:00').toISOString(),
        },
        {
            employeeId: 3,
            callDate: '2025-01-06',
            callTime: '11:00:00',
            status: 'connected',
            duration: 290,
            customerPhone: '+1-555-0109',
            notes: 'Product demonstration scheduled for next Monday',
            createdAt: new Date('2025-01-06T11:00:00').toISOString(),
        },

        // Employee 4 - 4 calls
        {
            employeeId: 4,
            callDate: '2024-12-26',
            callTime: '14:00:00',
            status: 'connected',
            duration: 550,
            customerPhone: '+1-555-0110',
            notes: 'Detailed product explanation provided, high interest shown',
            createdAt: new Date('2024-12-26T14:00:00').toISOString(),
        },
        {
            employeeId: 4,
            callDate: '2024-12-30',
            callTime: '10:30:00',
            status: 'not_connected',
            duration: 0,
            customerPhone: '+1-555-0111',
            notes: 'Number not in service, need to update contact',
            createdAt: new Date('2024-12-30T10:30:00').toISOString(),
        },
        {
            employeeId: 4,
            callDate: '2025-01-04',
            callTime: '16:45:00',
            status: 'connected',
            duration: 210,
            customerPhone: '+1-555-0112',
            notes: 'Payment issue resolved, transaction completed',
            createdAt: new Date('2025-01-04T16:45:00').toISOString(),
        },
        {
            employeeId: 4,
            callDate: '2025-01-07',
            callTime: '09:00:00',
            status: 'not_answered',
            duration: 0,
            customerPhone: '+1-555-0113',
            notes: 'Customer not available, callback requested',
            createdAt: new Date('2025-01-07T09:00:00').toISOString(),
        },

        // Employee 5 - 4 calls
        {
            employeeId: 5,
            callDate: '2024-12-28',
            callTime: '15:15:00',
            status: 'connected',
            duration: 380,
            customerPhone: '+1-555-0114',
            notes: 'Contract renewal discussed, customer interested',
            createdAt: new Date('2024-12-28T15:15:00').toISOString(),
        },
        {
            employeeId: 5,
            callDate: '2025-01-01',
            callTime: '10:45:00',
            status: 'not_connected',
            duration: 0,
            customerPhone: '+1-555-0115',
            notes: 'Line disconnected immediately, technical issue suspected',
            createdAt: new Date('2025-01-01T10:45:00').toISOString(),
        },
        {
            employeeId: 5,
            callDate: '2025-01-05',
            callTime: '13:20:00',
            status: 'connected',
            duration: 195,
            customerPhone: '+1-555-0116',
            notes: 'Quick inquiry about service hours and location',
            createdAt: new Date('2025-01-05T13:20:00').toISOString(),
        },
        {
            employeeId: 5,
            callDate: '2025-01-08',
            callTime: '14:50:00',
            status: 'not_answered',
            duration: 0,
            customerPhone: '+1-555-0117',
            notes: 'Sent to voicemail, awaiting callback',
            createdAt: new Date('2025-01-08T14:50:00').toISOString(),
        },

        // Employee 6 - 3 calls
        {
            employeeId: 6,
            callDate: '2024-12-29',
            callTime: '11:30:00',
            status: 'connected',
            duration: 600,
            customerPhone: '+1-555-0118',
            notes: 'Extensive consultation provided, follow-up needed',
            createdAt: new Date('2024-12-29T11:30:00').toISOString(),
        },
        {
            employeeId: 6,
            callDate: '2025-01-02',
            callTime: '09:30:00',
            status: 'not_connected',
            duration: 0,
            customerPhone: '+1-555-0119',
            notes: 'Wrong number, need to verify customer contact',
            createdAt: new Date('2025-01-02T09:30:00').toISOString(),
        },
        {
            employeeId: 6,
            callDate: '2025-01-06',
            callTime: '16:00:00',
            status: 'connected',
            duration: 340,
            customerPhone: '+1-555-0120',
            notes: 'Customer feedback collected, satisfaction survey completed',
            createdAt: new Date('2025-01-06T16:00:00').toISOString(),
        },
    ];

    await db.insert(callLogs).values(sampleCallLogs);
    
    console.log('✅ Call logs seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});