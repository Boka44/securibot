const { createConversation } = require('@grammyjs/conversations');
const { Menu } = require('@grammyjs/menu');
const { Keyboard } = require('grammy');
const crypto = require('crypto');
const { on } = require('events');
const { create } = require('domain');

// function for access control 
// private chats only
function privateChat(ctx) {
    if (ctx.chat.type !== "private") {
        return ctx.reply("This command is only available in private chats.");
    }
}

// admins only
function adminOnly(ctx) {
    const owner = 1777752685;
    if (ctx.from.id !== owner) {
        return ctx.reply("You are not authorized to run this command.");
    }
}

module.exports = (bot, commands, db, imports, State) => {

    // Example: Insert data into another collection
    const portals = db.collection("portals");
    const adminData = db.collection("adminData");

    async function createPortal(portalName, chatId, channelId, customText, mediaType, mediaUrl, user) {
      const portalData = {
        portalName: portalName,
        chatId: chatId,
        channelId: channelId,
        customText: customText,
        mediaType: mediaType,
        mediaUrl: mediaUrl,
        createdAt: new Date(),
        createdBy: user,
        messageId: null
      };

        await portals.insertOne(portalData);
        // console.log("Portal created:", portalData);
        return portalData;
    }

    async function updatePortal(id, customText, mediaType, mediaUrl) {
        console.log("updatePortal");
        const portalData = {
            customText: customText,
            mediaType: mediaType,
            mediaUrl: mediaUrl,
        };

        await portals.updateOne({ _id: id }, { $set: portalData });
        // console.log("Portal updated:", portalData);
        return portalData;
    }

    async function createAdminData() {
        const data = {
            _id: 1,
            logo: null,
        };
        const res = await adminData.insertOne(data);
        
        return res;
    }

    async function updateAdminDataLogo(type, logo) {
        const data = {
            logoType: type,
            logo: logo,
        };
        await adminData.updateOne({ _id: 1 }, { $set: data });
        return data;
    }

    // check if adminData exists
    async function setupAdminData() {
        const adminDataExists = await adminData.findOne({ _id: 1 });
        if (!adminDataExists) {
            console.log("Admin data not found. Creating new data...");
            const res = await createAdminData();
            console.log("Admin data created:", res);
        }
    }

    setupAdminData();



    async function activatePortal(ctx, channelId, id) {
        // Trigger the /activate-portal command in the channel
        // await ctx.api.sendMessage(channelId, "/portal");

        // update ctx
        // ctx.chat.id = channelId;
        // ctx.chat.type = "channel";
        // console.log(channelId === ctx.chat.id);
        await imports.handlePortal(bot, ctx, db, channelId, id);
    }

    // const groupUrl = "https://t.me/SecuriTestBot?startgroup=c"
    // const url = "https://5e84-109-60-124-208.ngrok-free.app"
    // const portalKeyboard = new Keyboard()
    // .webApp("Select a group", url).row()
    // .text("Select a channel").row()
    // .oneTime(true)
    // .resized(true);

    // portalKeyboard.one_time_keyboard = true;
    // portalKeyboard.resize_keyboard = true;
    // portalKeyboard.text("Select a group").row();
    // portalKeyboard.text("Select a channel").row();

    async function setupPortal(conversation, ctx) { 
        if(State.isBotBroken) {
            State.isBotBroken = false;
            return;
        }
        // return;
        let portalName;

        // Step 0: Enter Portal Name
        await ctx.reply("Please enter the name of your portal (internal use only):", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Cancel', callback_data: 'cancel' }]
                ]
            }
        });
        const portalNameLoop = true;
        while (portalNameLoop) {
            const portalNameRes = await conversation.wait();
            if (portalNameRes.message && portalNameRes.message.text) {
                portalName = portalNameRes.message.text;
                await ctx.reply(`Portal name set to: ${portalName}`);
                break;
            } else if (portalNameRes.callbackQuery && portalNameRes.callbackQuery.data === "cancel") {
                await ctx.reply("Portal creation canceled.");
                return;
            } else {
                await ctx.reply("Invalid input. Please send text only.");
            }
        }


        // Step 1: Select Group
        let chatId;
        await ctx.reply(`Please select a group using the button below.`, {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: [
                    [{ text: 'Select a group', request_chat: {
                        request_id: 1,
                        chat_is_channel: false,
                        user_administrator_rights: { 
                            can_manage_chat: true,
                            can_post_messages: true,
                            can_edit_messages: true,
                            can_delete_messages: true,
                            can_pin_messages: true,
                            can_invite_users: true,
                         },
                        bot_administrator_rights: { 
                            can_manage_chat: true,
                            can_post_messages: true,
                            can_edit_messages: true,
                            can_delete_messages: true,
                            can_pin_messages: true,
                            can_invite_users: true,
                         }
                    } }],
                [{ text: 'Cancel', callback_data: 'cancel' }],
                ],
                resize_keyboard: true
            }
        });
    
        let chatSelected = false;
        
        do {
            const response = await conversation.wait();
            if (response.update.message.text === "Cancel") {
                await ctx.reply("Portal creation canceled.",
                { reply_markup: { remove_keyboard: true } });
                return;
            } else if (response.update.message.chat_shared) {
                
                chatId = response.update.message.chat_shared.chat_id;
                chatSelected = true;
                // Handle further logic for the selected channel here
            } else {
                // If not a channel selection, prompt the user again
                await ctx.reply(`Please select a valid group using the button below.`, {
                    parse_mode: "HTML",
                    reply_markup: {
                        keyboard: [
                            [{ text: 'Select a group', request_chat: {
                                request_id: 1,
                                chat_is_channel: false,
                                user_administrator_rights: { 
                                    can_manage_chat: true,
                                    can_post_messages: true,
                                    can_edit_messages: true,
                                    can_delete_messages: true,
                                    can_pin_messages: true,
                                    can_invite_users: true,
                                 },
                                bot_administrator_rights: { 
                                    can_manage_chat: true,
                                    can_post_messages: true,
                                    can_edit_messages: true,
                                    can_delete_messages: true,
                                    can_pin_messages: true,
                                    can_invite_users: true,
                                 }
                            } }],
                        [{ text: 'Cancel', callback_data: 'cancel' }],
                        ],
                        resize_keyboard: true
                    }
                });
            }
        
        } while (!chatSelected);
    
        let channelId;
        // Step 2: Select Channel
        await ctx.reply(`Please select a valid channel using the button below.`, {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: [
                    [{ text: 'Select a channel', request_chat: {
                        request_id: 2,
                        chat_is_channel: true,
                        user_administrator_rights: { 
                            can_manage_chat: true,
                            can_post_messages: true,
                            can_edit_messages: true,
                            can_delete_messages: true,
                            can_pin_messages: true,
                            can_invite_users: true,
                        },
                        bot_administrator_rights: { 
                            can_manage_chat: true,
                            can_post_messages: true,
                            can_edit_messages: true,
                            can_delete_messages: true,
                            can_pin_messages: true,
                            can_invite_users: true,
                        }
                    }}],
                    [{ text: 'Cancel', callback_data: 'cancel' }],
                ],
                resize_keyboard: true
            }
        });
        
        let channelSelected = false;
        
        do {
            const response = await conversation.wait();
            if (response.update.message.text === "Cancel") {
                await ctx.reply("Portal creation canceled.", 
                { reply_markup: { remove_keyboard: true } });
                return;
            } else if (response.update.message.chat_shared) {
                
                channelId = response.update.message.chat_shared.chat_id;
                channelSelected = true;
                // Handle further logic for the selected channel here
            } else {
                // If not a channel selection, prompt the user again
                await ctx.reply(`Please select a valid channel using the button below.`, {
                    parse_mode: "HTML",
                    reply_markup: {
                        keyboard: [
                            [{ text: 'Select a channel', request_chat: {
                                request_id: 2,
                                chat_is_channel: true,
                                user_administrator_rights: { 
                                    can_manage_chat: true,
                                    can_post_messages: true,
                                    can_edit_messages: true,
                                    can_delete_messages: true,
                                    can_pin_messages: true,
                                    can_invite_users: true,
                                },
                                bot_administrator_rights: { 
                                    can_manage_chat: true,
                                    can_post_messages: true,
                                    can_edit_messages: true,
                                    can_delete_messages: true,
                                    can_pin_messages: true,
                                    can_invite_users: true,
                                }
                            }}],
                            [{ text: 'Cancel', callback_data: 'cancel' }],
                        ],
                        resize_keyboard: true
                    }
                });
            }
        
        } while (!channelSelected);
        
        // console.log(res2.update.message.chat_shared);


        // Check if a portal already exists for the selected channel
        // const existingPortal = await portals.findOne({ channelId: channelId });
        // if (existingPortal) {
        //     await ctx.reply("A portal already exists for this channel. Run the command /update to update any portal",
        //     { reply_markup: { remove_keyboard: true } });
        //     return;
        // }

        await ctx.reply(`${ctx.me.name} has been added as an admin to both the selected group and channel!`, {
            reply_markup: {
                remove_keyboard: true
            }
        });
    
        let customizationComplete = false;
        let customText = null;
        let media = null;
        let mediaType = null;
    
        // Step 3: Customization Menu Loop
        do {
            await ctx.reply("Let's customize your portal. Please choose an option:", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Add custom text', callback_data: 'custom_text' }],
                        [{ text: 'Add media (image/video/gif)', callback_data: 'custom_media' }],
                        [{ text: 'Create Portal and Finish Setup', callback_data: 'create_portal' }]
                    ],
                    remove_keyboard: true
                }
            });
    
            const customization = await conversation.wait();
    
            if (customization.callbackQuery.data === 'custom_text') {
                // Step 4: Add Custom Text
                await ctx.reply(`Please send the updated custom text for your portal:`, 
                { parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Keep', callback_data: 'keep' }],
                            [{ text: 'Remove', callback_data: 'remove' }]
                        ]
                    }
                });
                let textLoop = true;
                while (textLoop) {
                    const customTextRes = await conversation.wait();
                    
                    if (customTextRes.callbackQuery && customTextRes.callbackQuery.data === "remove") {
                        customText = null;
                        await ctx.reply("Custom text removed!");
                        textLoop = false;
                    } else if (customTextRes.callbackQuery && customTextRes.callbackQuery.data === "keep") {
                        await ctx.reply("Custom text kept!");
                        textLoop = false;
                    // Check if the message contains text
                    } else if (customTextRes.message && customTextRes.message.text) {
                        customText = customTextRes.message.text;
                        // console.log('Custom text received:', customText);
                        await ctx.reply("Custom text updated!");
                        textLoop = false;  // Exit the loop after receiving valid text
                    } else {
                        // Ignore non-text messages and prompt the user again
                        await ctx.reply("Invalid input. Please send text only.");
                    }
                }
    
            } else if (customization.callbackQuery.data === 'custom_media') {
                // Step 5: Add Media (image/video/gif)
                await ctx.reply(`Please send the media file (image/video/gif) for your portal:`,
                { parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Keep', callback_data: 'keep' }],
                            [{ text: 'Remove', callback_data: 'remove' }]
                        ]
                    }
                });
                let mediaLoop = true;
                while (mediaLoop) {
                    const mediaRes = await conversation.wait();
                    const mediaData = mediaRes.message;

                    if (mediaRes.callbackQuery && mediaRes.callbackQuery.data === "remove") {
                        media = null;
                        mediaType = null;
                        await ctx.reply("Media removed!");
                        mediaLoop = false;
                    } else if (mediaRes.callbackQuery && mediaRes.callbackQuery.data === "keep") {
                        await ctx.reply("Media kept!");
                        mediaLoop = false;
                    } else if (mediaData && (mediaData.photo || mediaData.video || mediaData.animation)) {
                        // console.log("mediaType", mediaType);
                        // console.log("mediaData", mediaData);    
                        media = mediaData;

                        // console.log('Media received:', media);
                        // console.log('Media Type:', mediaType);
                        
                        await ctx.reply("Media updated!");
                        mediaLoop = false;  // Exit the loop after receiving valid media
                    } else {
                        // Ignore non-media messages and prompt the user again
                        await ctx.reply("Invalid file. Please send an image, video, or gif.");
                    }
                }
    
            } else if (customization.callbackQuery.data === 'create_portal') {
                // Step 6: Finalize the Portal Setup
                await ctx.reply("Creating your portal and finishing setup...");

                const user = ctx.from;
                mediaType = media ? media.photo ? "photo" : media.video ? "video" : media.animation ? "animation" : null : null;
                const mediaUrl = media ? media.photo ? media.photo[0].file_id : media.video ? media.video.file_id : media.animation ? media.animation.file_id : null : null;

                const portal = await createPortal(portalName, chatId, channelId, customText, mediaType, mediaUrl, user);

                // Send a message to the channel to activate the portal
                await ctx.reply("Your portal has been successfully created!");
                await activatePortal(ctx, channelId, portal._id);
                
                customizationComplete = true;
    
                // Add code to create the portal and store settings
                // Save the chatId, channelId, customText, and media to your database if needed
                // Example of saving to a database (pseudo code):
                // await savePortalToDB({ chatId, channelId, customText, media });
            }
        } while (!customizationComplete);
    
    };
    
    bot.use(createConversation(setupPortal));

    // Maybe list your portals?
    // commands.private.push({ command: "list", description: "List your portals" });
    // bot.command("list", async (ctx) => {
    //     if(State.isBotBroken) {
    //         State.isBotBroken = false;
    //         return;
    //     }
    //     const user = ctx.from;
    //     const userPortals = await portals.find({ createdBy: user }).toArray();
    //     console.log("User Portals:", userPortals);
    //     await ctx.reply(`You have ${userPortals.length} portals.`);
    // });

    // Update portal
    commands.private.push({ command: "update", description: "Update your portal" });
    async function updatePortalCommand(conversation, ctx) {
        privateChat(ctx);

        console.log("updatePortal");
        if(State.isBotBroken) {
            State.isBotBroken = false;
            return;
        }
        // return;

        // get portals by userId
        const user = ctx.from;
        const userPortals = await portals.find({ createdBy: user }).toArray();
        // console.log("User Portals:", userPortals);
        if (userPortals.length === 0) {
            await ctx.reply("You have no portals to update. Please run /setup to create one.");
            return;
        }

        // Step 0: Select Portal
        let keyboardMapping = userPortals.map((portal, index) => {
            return [{ text: portal.portalName, callback_data: `portal_${index}` }];
        });
        keyboardMapping.push([{ text: 'Cancel', callback_data: 'cancel'}]);
        // console.log("keyboardMapping", keyboardMapping);

        await ctx.reply("Please select a portal to update:", {
            reply_markup: {
                inline_keyboard: keyboardMapping
            }
        });

        let portalSelected = false;
        let portalIndex;

        do {
            const response = await conversation.wait();
            if (response.callbackQuery && response.callbackQuery.data === "cancel") {
                await ctx.reply("Portal update canceled.");
                return;
            } else if (response.callbackQuery && response.callbackQuery.data.startsWith("portal_")) {
                portalIndex = parseInt(response.callbackQuery.data.split("_")[1]);
                await ctx.reply(`Selected portal: ${userPortals[portalIndex].portalName}`);
                portalSelected = true;
            } else {
                await ctx.reply("Invalid input. Please select a valid portal.", {
                    reply_markup: {
                        inline_keyboard: keyboardMapping
                    }
                });
            }
        } while (!portalSelected);

        const existingPortal = userPortals[portalIndex];
        // console.log("existingPortal", existingPortal);

        // Check if a portal already exists for the selected channel
        // if not, tell the user to run /setup

        // const existingPortal = await portals.findOne({ channelId: channelId });
        // if (!existingPortal) {
        //     await ctx.reply("No portal exists for this channel. Please run /setup to create one.");
        //     return;
        // }

        // Step 2: Update Portal loop
        let customizationComplete = false;
        let customText = existingPortal.customText;
        let media = existingPortal.mediaUrl;
        let mediaType = existingPortal.mediaType;
        let oldMessageId = existingPortal.messageId;

        do {
            await ctx.reply("Let's customize your portal. Please choose an option:", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Update custom text', callback_data: 'update_custom_text' }],
                        [{ text: 'Update media (image/video/gif)', callback_data: 'update_media' }],
                        [{ text: 'Finish Update and Post', callback_data: 'finish_update' }]
                    ]
                }
            });

            const customization = await conversation.wait();

            if (customization.callbackQuery.data === 'update_custom_text') {
                // Step 3: Update Custom Text
                await ctx.reply(`Please send the updated custom text for your portal: \n
                <i>Current text: ${customText}</i>
                `, { parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Keep', callback_data: 'keep' }],
                            [{ text: 'Remove', callback_data: 'remove' }]
                        ]
                    }
                });
                let textLoop = true;
                while (textLoop) {
                    const customTextRes = await conversation.wait();
                    
                    if (customTextRes.callbackQuery && customTextRes.callbackQuery.data === "remove") {
                        customText = null;
                        await ctx.reply("Custom text removed!");
                        textLoop = false;
                    } else if (customTextRes.callbackQuery && customTextRes.callbackQuery.data === "keep") {
                        await ctx.reply("Custom text kept!");
                        textLoop = false;
                    // Check if the message contains text
                    } else if (customTextRes.message && customTextRes.message.text) {
                        customText = customTextRes.message.text;
                        await ctx.reply("Custom text updated!");
                        textLoop = false;  // Exit the loop after receiving valid text
                    } else {
                        // Ignore non-text messages and prompt the user again
                        await ctx.reply("Invalid input. Please send text only.");
                    }
                }

            } else if (customization.callbackQuery.data === 'update_media') {
                // Step 4: Update Media (image/video/gif)
                const customMedia = media ? true : false;
                let mediaMessage = null;
                if (customMedia) {
                    
                    // Send the current media in the reply message
                    switch (mediaType) {
                        case "photo":
                            mediaMessage = await ctx.api.sendPhoto(ctx.chat.id, media, {
                                caption: `<i>Current media file:</i>`,
                                parse_mode: "HTML"
                            });
                            break;
            
                        case "video":
                            mediaMessage = await ctx.api.sendVideo(ctx.chat.id, media, {
                                caption: `<i>Current media file:</i>`,
                                parse_mode: "HTML"
                            });
                            break;
            
                        case "animation":
                            mediaMessage = await ctx.api.sendAnimation(ctx.chat.id, media, {
                                caption: `<i>Current media file:</i>`,
                                parse_mode: "HTML"
                            });
                            break;
            
                        default:
                            mediaMessage = null; // Fallback if media type is not recognized
                            break;
                    }
                }

                await ctx.reply(`Please send the updated media file (image/video/gif) for your portal:`, { parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Keep', callback_data: 'keep' }],
                            [{ text: 'Remove', callback_data: 'remove' }]
                        ]
                    }
                });
                let mediaLoop = true;
                while (mediaLoop) {
                    const mediaRes = await conversation.wait();
                    const mediaData = mediaRes.message;

                    if (mediaRes.callbackQuery && mediaRes.callbackQuery.data === "remove") {
                        media = null;
                        mediaType = null;
                        await ctx.reply("Media removed!");
                        mediaLoop = false;
                    } else if (mediaRes.callbackQuery && mediaRes.callbackQuery.data === "keep") {
                        await ctx.reply("Media kept!");
                        mediaLoop = false;
                    } else if (mediaData && (mediaData.photo || mediaData.video || mediaData.animation)) {
                        mediaType = media.photo ? "photo" : media.video ? "video" : "animation";
                        media = mediaData ? mediaData.photo ? mediaData.photo[0].file_id : mediaData.video ? mediaData.video.file_id : mediaData.animation ? mediaData.animation.file_id : null : null;
                        
                        await ctx.reply("Media updated!");
                        mediaLoop = false;  // Exit the loop after receiving valid media
                    } else {
                        // Ignore non-media messages and prompt the user again
                        await ctx.reply("Invalid file. Please send an image, video, or gif.");
                    }
                }
            }
            else if (customization.callbackQuery.data === 'finish_update') {
                // Step 5: Finalize the Portal Update
                await ctx.reply("Updating your portal...");

                const id = existingPortal._id;
                await updatePortal(id, customText, mediaType, media);

                // Send a message to the channel to activate the portal
                await ctx.reply("Your portal has been successfully updated!");
                
                customizationComplete = true;
            }

        } while (!customizationComplete);
        // Step 3: Delete old portal with messageId
        // check if message exists in chat currently
        try {
            await ctx.api.deleteMessage(existingPortal.channelId, oldMessageId);
            // console.log(`Message with ID ${oldMessageId} deleted successfully.`);
        } catch (error) {
            if (error.error_code === 400) {
                console.log(`Message with ID ${oldMessageId} was not found or already deleted.`);
            } else {
                // Handle other types of errors
                console.error("Error deleting the message:", error);
            }
        }
        // Step 4: Create new portal
        await activatePortal(ctx, existingPortal.channelId, existingPortal._id);
    }

    bot.use(createConversation(updatePortalCommand));

    bot.command("update", async (ctx) => {
        await ctx.conversation.enter('updatePortalCommand');
    });

    // Delete portal conversation
    async function deletePortal(conversation, ctx) {
        if(State.isBotBroken) {
            State.isBotBroken = false;
            return;
        }
        // get portals by userId
        const user = ctx.from;
        const userPortals = await portals.find({ createdBy: user }).toArray();
        // console.log("User Portals:", userPortals);
        if (userPortals.length === 0) {
            await ctx.reply("You have no portals to delete. Please run /setup to create one.");
            return;
        }

        // Step 0: Select Portal
        let keyboardMapping = userPortals.map((portal, index) => {
            return [{ text: portal.portalName, callback_data: `portal_${index}` }];
        });
        keyboardMapping.push([{ text: 'Cancel', callback_data: 'cancel'}]);

        await ctx.reply("Please select a portal to delete:", {
            reply_markup: {
                inline_keyboard: keyboardMapping
            }
        });

        let portalSelected = false;

        do {
            const response = await conversation.wait();

            if (response.callbackQuery && response.callbackQuery.data === "cancel") {
                await ctx.reply("Portal deletion canceled.");
                return;
            } else if (response.callbackQuery && response.callbackQuery.data.startsWith("portal_")) {
                const portalIndex = parseInt(response.callbackQuery.data.split("_")[1]);
                await ctx.reply(`Selected portal: ${userPortals[portalIndex].portalName}`);
                // Step 1: Delete Portal
                await ctx.reply("Deleting your portal...");
                await portals.deleteOne({ _id: userPortals[portalIndex]._id });
                await ctx.reply("Your portal has been successfully deleted!");
                portalSelected = true;
            } else {
                await ctx.reply("Invalid input. Please select a valid portal.", {
                    reply_markup: {
                        inline_keyboard: userPortals.map((portal, index) => {
                            return [{ text: portal.portalName, callback_data: `portal_${index}` }];
                        }).concat([{ text: 'Cancel', callback_data: 'cancel'}])
                    }
                });
            }
        } while (!portalSelected);
    }

    bot.use(createConversation(deletePortal));

    // Delete portal
    commands.private.push({ command: "delete", description: "Delete your portal" });
    bot.command("delete", async (ctx) => {
        privateChat(ctx);
        console.log("delete");
        await ctx.conversation.enter('deletePortal');
    });

    function decryptData(encryptedData) {
        const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32-byte key
        const iv = Buffer.from(process.env.IV, 'hex'); // 16-byte IV
        const decipher = crypto.createDecipheriv('aes-256-ctr', encryptionKey, iv);
    
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');  // Must use 'hex' here
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted); // Convert back to object
    }

    async function generateMathCaptcha(conversation) {

        // Generate two random numbers between 1 and 10
        const num1 = Math.floor(await conversation.random() * 10) + 1;
        const num2 = Math.floor(await conversation.random() * 10) + 1;
    
        // Randomly choose between addition and subtraction
        const operator = await conversation.random() < 0.5 ? '+' : '-';
        
        let problem;
        let answer;
    
        if (operator === '+') {
            problem = `${num1} + ${num2}`;
            answer = num1 + num2;
        } else {
            // Ensure the first number is always greater than the second for subtraction
            const largerNum = Math.max(num1, num2);
            const smallerNum = Math.min(num1, num2);
            problem = `${largerNum} - ${smallerNum}`;
            answer = largerNum - smallerNum;
        }
    
        return {
            problem,
            answer
        };
    }

    async function captchaConversation(conversation, ctx) {
        if(State.isBotBroken) {
            State.isBotBroken = false;
            return;
        }
        console.log("captchaConversation --------------------------------------");
        // return;
        // Extract the 'start' payload safely
        const startPayload = ctx.message.text.split(' ')[1];
        
        
        const encodedData = startPayload.replace('verify_', '');
        const chatId = encodedData;
        
        // Track the verification status
        let isVerified = false;
        
        // Generate initial CAPTCHA
        let captcha = await generateMathCaptcha(conversation);
        let question = captcha.problem;
        let expectedAnswer = captcha.answer;
        // console.log("Generated CAPTCHA:", captcha);
        
        // Send the first CAPTCHA
        await ctx.reply(`Please solve this CAPTCHA: What is ${question}?`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Cancel', callback_data: 'cancel' }]
                ]
            }
        });
    
        do {
            try {
                // Wait for the user's response
                const answer = await conversation.wait();
                // console.log("User answer:", answer.message.text);
    
                // Handle user cancellation
                if (answer.callbackQuery && answer.callbackQuery.data === 'cancel') {
                    await ctx.reply("Verification canceled.");
                    return; // Exit the function
                }
    
                // Compare user input with the expected answer
                const userAnswer = answer.message.text.trim();
                if (userAnswer === expectedAnswer.toString()) {
                    isVerified = true; // Set verified flag to true
                    await ctx.reply("Correct! Here is your one-time link to join the group:");
                    
                    // Generate and send the one-time invite link
                    const link = await ctx.api.createChatInviteLink(chatId, { expire_date: Math.floor(Date.now() / 1000) + 300, member_limit: 1 });
                    await ctx.reply(link.invite_link);
                } else {
                    // Incorrect answer, generate new CAPTCHA
                    await ctx.reply("Incorrect CAPTCHA. Please try again.");
                    // console.log("Expected answer was:", expectedAnswer);
                    
                    captcha = await generateMathCaptcha(conversation); // Generate new CAPTCHA
                    expectedAnswer = captcha.answer; // Update expected answer
                    question = captcha.problem; // Update the new question
                    
                    // Ask the user again with the new CAPTCHA
                    await ctx.reply(`Please solve this CAPTCHA: What is ${question}?`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Cancel', callback_data: 'cancel' }]
                            ]
                        }
                    });
                }
            } catch (error) {
                console.error("Error during conversation:", error);
                await ctx.reply("An error occurred. Please try again later.");
                return;
            }
        } while (!isVerified); // Continue the loop until verified
    }
    
    
    
      
    bot.use(createConversation(captchaConversation));
      
      // Start button to trigger CAPTCHA
    bot.command("start", async (ctx) => {
        console.log("verify");

        if(ctx.message) {
                const startPayload = ctx.message.text.split(' ')[1];
            if (startPayload && startPayload.startsWith('verify_')) {
                await ctx.conversation.enter('captchaConversation');
                return;
            }
        }
        

        const text = "Welcome! Type /setup or click setup below to begin setting up your portal.";
        const options = {
            caption: text,
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Setup', callback_data: 'setup' }]
                ]
            }
        };

        const adminDataExists = await adminData.findOne({ _id: 1 });
        if (adminDataExists && adminDataExists.logo) {
            // await ctx.replyWithPhoto(adminDataExists.logo, { caption: helpText });
            let res;
            if(adminDataExists.logoType === "photo") {
                res = await ctx.replyWithPhoto(adminDataExists.logo, options);
            } else if(adminDataExists.logoType === "video") {
                res = await ctx.replyWithVideo(adminDataExists.logo, options);
            } else if(adminDataExists.logoType === "animation") {
                res = await ctx.replyWithAnimation(adminDataExists.logo, options);
            }

            // console.log("res", res);
            // if callbackData is setup, enter setupPortal
            // if(res.callbackQuery && res.callbackQuery.data === "setup") {
            //     await ctx.conversation.enter('setupPortal');
            // }

        }


    });

    bot.on('callback_query', async (ctx) => {
        // console.log("callback_query", ctx.callbackQuery.data);
        if (ctx.callbackQuery && ctx.callbackQuery.data === 'setup') {
            await ctx.conversation.enter('setupPortal');
        }
    });
      
    
    commands.private.push({ command: "setup", description: "Setup your portal" });
    bot.command("setup", async (ctx) => {
        privateChat(ctx);
        console.log("setup");
        await ctx.conversation.enter('setupPortal');
    });    
    

    commands.private.push({ command: "help", description: "Get help" });
    bot.command("help", async (ctx) => {
        privateChat(ctx);
        if(State.isBotBroken) {
            State.isBotBroken = false;
            return;
        }
        // console.log(ctx.from);
        let helpText = `Welcome to the Portal Bot! Here are the available commands:\n\n`;
        helpText += `/setup - Setup your portal\n`;
        helpText += `/update - Update your portal\n`;
        helpText += `/delete - Delete your portal\n`;

        // if adminData has a logo, send the logo
        const adminDataExists = await adminData.findOne({ _id: 1 });
        // console.log("adminDataExists", adminDataExists);
        // console.log("adminDataExists", adminDataExists);
        if (adminDataExists && adminDataExists.logo) {
            // await ctx.replyWithPhoto(adminDataExists.logo, { caption: helpText });
            if(adminDataExists.logoType === "photo") {
                await ctx.replyWithPhoto(adminDataExists.logo, { caption: helpText });
            } else if(adminDataExists.logoType === "video") {
                await ctx.replyWithVideo(adminDataExists.logo, { caption: helpText });
            } else if(adminDataExists.logoType === "animation") {
                await ctx.replyWithAnimation(adminDataExists.logo, { caption: helpText });
            }
        }
    });

    // update logo
    // commands.private.push({ command: "logo", description: "Update the logo" });
    // bot.command("logo", async (ctx) => {
    //     privateChat(ctx);
    //     adminOnly(ctx);
    //     console.log("logo");
    //     // return;
    //     if(State.isBotBroken) {
    //         State.isBotBroken = false;
    //         return;
    //     }
    //     // return;

    //     // Step 0: Request Logo
    //     await ctx.reply("Please send the updated logo for your portal:");
    //     let logo = null;
    //     let logoType = null;
    //     let logoUrl = null;

        
    //     const logoRes = await ctx.update.message;
    //     // console.log("logoRes", logoRes);
    //     if (logoRes && (logoRes.photo || logoRes.video_note || logoRes.animation)) {
    //         logo = logoRes;
    //         logoType = logo.photo ? "photo" : logo.video_note ? "video_note" : logo.animation ? "animation" : null;
    //         logoUrl = logo.photo ? logo.photo[0].file_id : logo.video_note ? logo.video_note.file_id : logo.animation ? logo.animation.file_id : null;
    //         // console.log('Logo received:', logo);
    //         // await ctx.reply("Logo updated!");
    //         console.log("logoUrl", logoUrl);
    //         // Step 1: Update Admin Data    
    //         await updateAdminDataLogo(logoType, logoUrl);
    //         console.log("Logo updated successfully!");
    //     } else {
    //         // Ignore non-logo messages and prompt the user again
    //         // await ctx.reply("Invalid file. Please send an image, video, or gif.");
    //     }
        
    //     // await ctx.reply("Logo updated successfully!");
    // });

    // recreate logo command setup but as a conversation
    async function updateLogo(conversation, ctx) {
        if(State.isBotBroken) {
            State.isBotBroken = false;
            return;
        }
        // return;
        // Step 0: Request Logo
        await ctx.reply("Please send the updated logo for your portal:");
        let logo = null;
        let logoType = null;
        let logoUrl = null;

        const logoRes = await conversation.wait();
        // console.log("logoRes", logoRes);
        if (logoRes.message && (logoRes.message.photo || logoRes.message.video || logoRes.message.animation)) {
            logo = logoRes.message;
            logoType = logo.photo ? "photo" : logo.video ? "video" : logo.animation ? "animation" : null;
            logoUrl = logo.photo ? logo.photo[0].file_id : logo.video ? logo.video.file_id : logo.animation ? logo.animation.file_id : null;
            // console.log('Logo received:', logo);
            // await ctx.reply("Logo updated!");
            console.log("logoUrl", logoUrl);
            // Step 1: Update Admin Data    
            await updateAdminDataLogo(logoType, logoUrl);
            console.log("Logo updated successfully!");
        } else {
            // Ignore non-logo messages and prompt the user again
            await ctx.reply("Invalid file. Please send an image, video, or gif.");
        }
    }

    bot.use(createConversation(updateLogo));

    // commands.private.push({ command: "logo", description: "Update the logo" });
    bot.command("logo", async (ctx) => {
        privateChat(ctx);
        adminOnly(ctx);
        console.log("logo");
        await ctx.conversation.enter('updateLogo');
    });


    // // Delete all portals
    // commands.private.push({ command: "reset", description: "Delete all portals" });
    // bot.command("reset", async (ctx) => {
    //     if(State.isBotBroken) {
    //         State.isBotBroken = false;
    //         return;
    //     }
    //     const result = await portals.deleteMany({});
    //     console.log("All portals deleted.");
    //     await ctx.reply(`Deleted ${result.deletedCount} portals from the database.`);
    // });
  
    // bot.on("message:text", async (ctx) => {
    //   const message = ctx.message.text;
  
    //   if (ctx.session.step === "select_group") {
    //     ctx.session.groupId = message;
    //     await ctx.reply(`Group '${message}' selected. Now, select a channel.`);
    //     ctx.session.step = "select_channel";
    //   } else if (ctx.session.step === "select_channel") {
    //     ctx.session.channelId = message;
    //     await ctx.reply(`Channel '${message}' selected. Portal setup complete.`);
    //     ctx.session.step = null;
    //   }
    // });
  
    // Other private-specific commands
  };
  