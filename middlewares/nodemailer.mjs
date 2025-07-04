import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'Gmail', // or another email service
    auth: {
        user: 'support@stockverse.com',
        pass: 'puwm qxgn rjqe xoip',
    },
});

export default transporter;
