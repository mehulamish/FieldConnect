import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.HOSTINGER_EMAIL || functions.config().hostinger.email,
        pass: process.env.HOSTINGER_PASSWORD || functions.config().hostinger.password,
    },
});

// Define the expected structure for report data
interface CustomerDetails {
    email?: string;
    name?: string;
    hospitalName?: string;
    poOrderNo?: string;

    department?: string;
}

interface ReportData {
    customerDetails?: CustomerDetails;
    createdAt?: number;
    pdfUrl?: string;
    [key: string]: unknown;
}

// Helper function to send installation confirmation email
async function sendInstallationConfirmationEmail(data: ReportData, email: string) {
    console.log(`Attempting to send installation email to: ${email}`);

    const mailOptions = {
        from: '"FieldConnect" <info@meditronixcorporation.com>',
        to: email,
        subject: "Installation Report Confirmation",
        html: `
            <div style="max-width:480px;margin:auto;padding:32px 24px;background:#fff;border-radius:18px;font-family:sans-serif;box-shadow:0 2px 8px #0001;">
              <div style="text-align:center;">
                <img src="https://static.wixstatic.com/media/f00688_e030aaec9f6440d68443da60165ac663~mv2.png" alt="Meditronix Logo" style="height:48px;margin-bottom:16px;" />
                <h2 style="margin:0 0 8px 0;font-size:1.5em;letter-spacing:1px;">INSTALLATION REPORT CONFIRMATION</h2>
              </div>
              <p>Hello ${data.customerDetails?.name || "Customer"},</p>
              <p>We're pleased to inform you that the equipment has been successfully installed. Below are the key details:</p>
              <table style="width:100%;border-collapse:collapse;margin:24px 0;">
                <tr><td style="padding:8px 0;font-weight:bold;">Hospital Name</td><td>${data.customerDetails?.hospitalName || ""}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;">Respected PO No</td><td>${data.customerDetails?.poOrderNo || ""}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;">Department</td><td>${data.customerDetails?.department || ""}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;">Contact Person</td><td>${data.customerDetails?.name || ""}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;">Date</td><td>${data.createdAt ? new Date(data.createdAt).toLocaleDateString() : ""}</td></tr>
              </table>
              <div style="text-align:center;margin:24px 0;">
                <a href="${data.pdfUrl}" style="background:#2056ae;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;display:inline-block;">View Report</a>
              </div>
              <div style="text-align:center;margin:24px 0;">
                <a href="mailto:info@meditronixcorporation.com" style="margin:0 8px;text-decoration:none;">📧</a>
                <a href="https://meditronixcorporation.com" style="margin:0 8px;text-decoration:none;">🌐</a>
                <a href="https://www.linkedin.com/company/meditronix-corporation/" style="margin:0 8px;text-decoration:none;">in</a>
              </div>
              <p style="font-size:0.95em;color:#555;">For any assistance, feel free to reach us at <a href="mailto:info@meditronixcorporation.com">info@meditronixcorporation.com</a> or visit our website: <a href="https://meditronixcorporation.com">meditronixcorporation.com</a></p>
              <p style="font-size:0.85em;color:#aaa;text-align:center;">© 2025 Meditronix Corporation. All rights reserved.</p>
            </div>
            `
    };

    console.log(`Mail options prepared for ${email}:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
    });

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email successfully sent to: ${email}`);
    } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error);
        throw error; // Re-throw to be caught by the calling function
    }
}

// Helper function to send 3-month department-specific feedback email
async function sendThreeMonthDepartmentFeedbackEmail(data: ReportData, email: string) {
    const department = data.customerDetails?.department;
    let subject = '';
    let body = '';

    if (department === 'Radiation Oncology') {
        subject = 'We Value Your Feedback on Our Radiation Oncology Solutions';
        body = `
        <p>Dear Valued Partner,</p>
        <p>We hope everything is working well at your end. At Meditronix Corporation, every successful installation in Radiation Oncology marks the start of a long-term partnership with you.</p>
        <p>We are reaching out to request your valuable feedback on the Radiation Oncology products or solutions our team has recently provided. Whether your experience has been seamless or there are areas where we can enhance our support, we would truly appreciate your insights.</p>
        <p>Your feedback drives our continuous improvement and helps us uphold the quality and service standards you expect. Please feel free to reply to this email with any thoughts, concerns, or appreciation. Everything you share will be received with care and prompt attention.</p>
        <p>Thank you for trusting Meditronix Corporation as your partner in advancing patient care through precision and safety in Radiation Oncology.</p>
        <p>Warm regards<br/>Team Meditronix Corporation<br/>📧 infomeditronixcorporation@gmail.com<br/>🌐 <a href="https://www.meditronixcorporation.com/contact">https://www.meditronixcorporation.com/contact</a></p>
        `;
    } else if (department === 'Nuclear Medicine') {
        subject = 'Share Your Experience with Our Nuclear Medicine Solutions';
        body = `
        <p>Dear Valued Partner,</p>
        <p>We hope everything is running smoothly at your facility. At Meditronix Corporation, each successful Nuclear Medicine installation signifies the beginning of a lasting collaboration with you.</p>
        <p>We are writing to request your feedback on the Nuclear Medicine products or services our team has recently supplied. Whether your experience has been positive or there are areas where you feel we can improve, your input is invaluable to us.</p>
        <p>Your insights guide our efforts to refine offerings and maintain the high standards you deserve. Please reply to this email with any comments or suggestions. All feedback will be treated with attention and respect.</p>
        <p>Thank you for choosing Meditronix Corporation as your partner in enhancing safety, accuracy, and efficiency in Nuclear Medicine.</p>
        <p>Warm regards<br/>Team Meditronix Corporation<br/>📧 infomeditronixcorporation@gmail.com<br/>🌐 <a href="https://www.meditronixcorporation.com/contact">https://www.meditronixcorporation.com/contact</a></p>
        `;
    } else {
        subject = 'We Value Your Feedback';
        body = `<p>Dear Valued Partner,</p><p>We would love to hear your feedback about our recent installation.</p>`;
    }

    const mailOptions = {
        from: '"FieldConnect" <info@meditronixcorporation.com>',
        to: email,
        subject,
        html: body
    };
    await transporter.sendMail(mailOptions);
}

// NOTE: When creating a new report, set installationEmailSent: false and syncedAt: FieldValue.serverTimestamp() (or a Firestore timestamp)

// Extracted logic for installation emails
async function runSendInstallationEmailsLogic() {
    const db = admin.firestore();
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000);

    console.log(`🔍 Searching for reports synced between ${fourMinutesAgo.toISOString()} and ${twoMinutesAgo.toISOString()}`);
    console.log(`⏰ Current time: ${now.toISOString()}`);

    try {
        // Query reports where syncedAt is in the 2-4 minute window and installationEmailSent is false
        const reportsSnapshot = await db.collection("Reports")
            .where("syncedAt", ">=", fourMinutesAgo)
            .where("syncedAt", "<=", twoMinutesAgo)
            .where("installationEmailSent", "==", false)
            .get();

        console.log(`📊 Found ${reportsSnapshot.docs.length} reports to send installation emails`);

        if (reportsSnapshot.docs.length === 0) {
            console.log(`ℹ️ No reports found in the time window. This could mean:
            - No reports were synced 2-4 minutes ago
            - All reports in that window already have installationEmailSent: true
            - Reports are outside the time window`);
        }

        for (const doc of reportsSnapshot.docs) {
            const data = doc.data() as ReportData;
            const email = data.customerDetails?.email;
            const syncedAt = data.syncedAt;

            console.log(`📄 Processing report ${doc.id}:`);
            console.log(`   - Email: ${email}`);
            console.log(`   - Synced at: ${syncedAt}`);
            console.log(`   - Installation email sent: ${data.installationEmailSent}`);

            if (!email) {
                console.log(`❌ No email found for report ${doc.id}, skipping`);
                continue;
            }

            try {
                await sendInstallationConfirmationEmail(data, email);
                console.log(`✅ Installation confirmation email sent to: ${email} for report ${doc.id}`);

                await doc.ref.update({
                    installationEmailSent: true,
                    installationEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
                });

                await db.collection("EmailResponses").add({
                    reportId: doc.id,
                    email,
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    type: "installationConfirmation",
                    hospitalName: data.customerDetails?.hospitalName || "",
                    customerName: data.customerDetails?.name || ""
                });

                console.log(`✅ Report ${doc.id} marked as sent and logged to EmailResponses`);

            } catch (error) {
                console.error(`❌ Error sending installation email to ${email}:`, error);
            }
        }
    } catch (error) {
        console.error("❌ Error in sendInstallationEmails function:", error);
    }
}

export const sendInstallationEmails = functions.pubsub
    .schedule("every 2 minutes")
    .onRun(async (context) => {
        await runSendInstallationEmailsLogic();
        return null;
    });

// Scheduled function to send 3-month feedback emails
export const sendThreeMonthFeedbackEmails = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async (context) => {
        const db = admin.firestore();
        const now = Date.now();
        // 3-month window: 91-89 days ago (±1 day for safety)
        const ninetyOneDaysAgo = now - (91 * 24 * 60 * 60 * 1000);
        const eightyNineDaysAgo = now - (89 * 24 * 60 * 60 * 1000);

        try {
            // Fetch all reports with installedThreeMonth == false
            const reportsSnapshot = await db.collection("Reports")
                .where("installedThreeMonth", "==", false)
                .get();

            let eligibleCount = 0;
            for (const doc of reportsSnapshot.docs) {
                const data = doc.data() as ReportData;
                const email = data.customerDetails?.email;
                const department = data.customerDetails?.department;
                let createdAtMs = 0;
                if (typeof data.createdAt === 'string') {
                    createdAtMs = Date.parse(data.createdAt);
                } else if (typeof data.createdAt === 'number') {
                    createdAtMs = data.createdAt;
                } else if (data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === 'function') {
                    createdAtMs = (data.createdAt as { toDate: () => Date }).toDate().getTime();
                }

                if (createdAtMs >= ninetyOneDaysAgo && createdAtMs <= eightyNineDaysAgo) {
                    eligibleCount++;
                    if (!email) {
                        console.log(`❌ No email found for report ${doc.id}, skipping`);
                        continue;
                    }

                    try {
                        await sendThreeMonthDepartmentFeedbackEmail(data, email);
                        console.log(`✅ 3-month feedback email sent to: ${email} for report ${doc.id} (Department: ${department})`);

                        await doc.ref.update({
                            installedThreeMonth: true,
                            installedThreeMonthAt: admin.firestore.FieldValue.serverTimestamp()
                        });

                        await db.collection("EmailResponses").add({
                            reportId: doc.id,
                            email,
                            sentAt: admin.firestore.FieldValue.serverTimestamp(),
                            type: "threeMonthFeedback",
                            department: department || "",
                            hospitalName: data.customerDetails?.hospitalName || "",
                            customerName: data.customerDetails?.name || ""
                        });

                    } catch (error) {
                        console.error(`❌ Error sending 3-month feedback email to ${email}:`, error);
                    }
                }
            }
            console.log(`📊 Found ${eligibleCount} eligible reports to send 3-month feedback emails`);
        } catch (error) {
            console.error("❌ Error in sendThreeMonthFeedbackEmails function:", error);
        }
        return null;
    });