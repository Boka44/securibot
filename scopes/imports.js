const crypto = require('crypto');
const { Bot } = require('grammy');

// Utility to encrypt data for use in the verification link
function encryptData(data) {
    const cipher = crypto.createCipheriv(
        'aes-256-ctr',
        Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), 
        Buffer.from(process.env.IV, 'hex')
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;  // Returns a hex-encoded string
}

function decryptData(encryptedData) {
    const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32-byte key
    const iv = Buffer.from(process.env.IV, 'hex'); // 16-byte IV
    const decipher = crypto.createDecipheriv('aes-256-ctr', encryptionKey, iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');  // Must use 'hex' here
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted); // Convert back to object
}

// Add more global commands if needed
// Retrieve and decrypt portal data from the database
async function retrievePortalData(id, db) {
    try {
        const portals = db.collection('portals');
        // console.log("channelId", channelId);
        // get all portals
        // const portalsArray = await portals.find({}).toArray();
        // console.log("portals", portalsArray);

        // Fetch the encrypted data
        // const result = await portals.findOne({ channelId });
        // find by _id
        const result = await portals.findOne({ _id: id });
        if (!result) {
            throw new Error('No portal data found.');
        }

        return result;
    } catch (err) {
        console.error("Error retrieving portal data:", err);
    }
}

async function updatePortal(channelId, messageId, db) {
    const portalData = {
        messageId: messageId,
    };
    const portals = db.collection('portals');
    await portals.updateOne({ channelId: channelId }, { $set: portalData });
    // console.log("Portal updated:", portalData);
    return portalData;
}


// chat_join_request was the old event name

async function handlePortal(bot, ctx, db, channelId, id) {
    // return;
    const portalData = await retrievePortalData(id, db);

    const inviteLink = await bot.api.createChatInviteLink(channelId);

    // Custom text and media
    let customText = portalData.customText || `This group is protected by ${ctx.me.username}.`;
    customText += `\n\nShare this channel using the invite link below:\n${inviteLink.invite_link}`;
    customText += "\n\nPlease verify to join the group.";

    const customMedia = portalData.mediaUrl || null;  // Fetch media from session or database
    // console.log("customMedia", customMedia);
    // console.log("portalData", portalData);
    // Create encrypted data for verification
    // const encryptedData = await encryptData(JSON.stringify(portalData.chatId));
    // console.log("encryptedData", encryptedData);

    // const decryptedData = await decryptData(encryptedData);
    // console.log("decryptedData", decryptedData);


    // Verification link (replace 'start=verify' with encrypted data)
    const verificationLink = `https://t.me/${ctx.me.username}?start=verify_${portalData.chatId}`;
    // console.log("verificationLink", verificationLink);

    let message;

    if (customMedia) {
        // Determine the media type
        const media = customMedia; // Assuming this is the media object you received
        const mediaType = portalData.mediaType; // Assuming this is the media type you received
    
    
        switch (mediaType) {
            case "photo":
                // Send photo
                message = await bot.api.sendPhoto(channelId, media, {
                    caption: customText,
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: 'Tap to verify', 
                                url: verificationLink
                            }]
                        ],
                        resize_keyboard: true,
                    }
                });
                break;
    
            case "video":
                // Send video
                message = await bot.api.sendVideo(channelId, media, {
                    caption: customText,
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: 'Tap to verify', 
                                url: verificationLink
                            }]
                        ],
                        resize_keyboard: true,
                    }
                });
                break;
    
            case "animation":
                // Send animation (GIF)
                message = await bot.api.sendAnimation(channelId, media, {
                    caption: customText,
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: 'Tap to verify', 
                                url: verificationLink
                            }]
                        ],
                        resize_keyboard: true,
                    }
                });
                break;
    
            default:
                // Fallback if media type is not recognized
                // await ctx.reply("Unsupported media type or media is missing.");
                break;
        }
    } else {
        // Fallback to sending just the text and the button if no media is available
        message = await bot.api.sendMessage(channelId, customText, {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: 'Tap to verify',
                        url: verificationLink
                    }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }
    
    // console.log("message", message);

    // Update the portal data with the message ID
    // await ctx.api.deleteMessage(ctx.chat.id, message.message_id - 1);
    await updatePortal(channelId, message.message_id, db);
    return;
}
module.exports = {
    handlePortal,
    retrievePortalData,
    updatePortal,
    encryptData,
    decryptData
}