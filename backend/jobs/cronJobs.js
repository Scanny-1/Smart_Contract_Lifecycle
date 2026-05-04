const cron = require('node-cron');
const Contract = require('../models/Contract');
const Notification = require('../models/Notification');

const initCronJobs = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily contract expiry check...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const sevenDaysFromNow = new Date(today);
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

            const oneDayFromNow = new Date(today);
            oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

            // 1. Mark as Expired
            const expiredContracts = await Contract.find({ 
                status: 'Active', 
                endDate: { $lt: today } 
            });

            for (const contract of expiredContracts) {
                contract.status = 'Expired';
                await contract.save();

                await Notification.create({
                    userId: contract.createdBy,
                    companyId: contract.companyId,
                    message: `Your contract "${contract.title}" has expired.`,
                    type: 'Expiry',
                    relatedContractId: contract._id
                });
            }
            console.log(`Updated ${expiredContracts.length} contracts to Expired.`);

            // 2. Notify for 7 days expiry
            // We need to find contracts whose end date is exactly 7 days from now (or within that day)
            const nextWeekStart = new Date(sevenDaysFromNow);
            const nextWeekEnd = new Date(sevenDaysFromNow);
            nextWeekEnd.setDate(nextWeekEnd.getDate() + 1);

            const expiringIn7Days = await Contract.find({
                status: 'Active',
                endDate: { $gte: nextWeekStart, $lt: nextWeekEnd }
            });

            for (const contract of expiringIn7Days) {
                await Notification.create({
                    userId: contract.createdBy,
                    companyId: contract.companyId,
                    message: `Reminder: Your contract "${contract.title}" is expiring in 7 days.`,
                    type: 'Expiry',
                    relatedContractId: contract._id
                });
            }

            // 3. Notify for 1 day expiry
            const tomorrowStart = new Date(oneDayFromNow);
            const tomorrowEnd = new Date(oneDayFromNow);
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

            const expiringIn1Day = await Contract.find({
                status: 'Active',
                endDate: { $gte: tomorrowStart, $lt: tomorrowEnd }
            });

            for (const contract of expiringIn1Day) {
                await Notification.create({
                    userId: contract.createdBy,
                    companyId: contract.companyId,
                    message: `URGENT: Your contract "${contract.title}" is expiring tomorrow.`,
                    type: 'Expiry',
                    relatedContractId: contract._id
                });
            }

        } catch (error) {
            console.error('Error in cron job:', error);
        }
    });
};

module.exports = initCronJobs;
