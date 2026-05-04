const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // Use Ethereal Email for testing if no real SMTP is provided
        let transporter;
        if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.mailtrap.io') {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                auth: {
                    user: process.env.SMTP_EMAIL,
                    pass: process.env.SMTP_PASSWORD
                }
            });
        } else {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
        }

        const message = {
            from: `${process.env.FROM_NAME || 'Smart Contracts'} <${process.env.FROM_EMAIL || 'noreply@smartcontracts.com'}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
        };

        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email: ', error);
    }
};

module.exports = sendEmail;
