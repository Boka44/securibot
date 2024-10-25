


// Channel scope logic
module.exports = function(bot, commands, db, imports, State) {


    
    

    // commands.channels.push({ command: "portal", description: "Activate the portal" });
    bot.command('portal', async (ctx) => {
        if(State.isBotBroken) {
            State.isBotBroken = false;
            return;
        }
        // return;
        if (ctx.chat.type !== 'channel') {
            return;
        }
        // console.log(ctx);
        // command must be called by an admin
        // const chatMember = await ctx.getChatMember(ctx.message.from.id);
        
        // // Check if the user is an admin
        // if (chatMember.status !== 'administrator' && chatMember.status !== 'creator') {
        //     return;
        // }
        console.log("activate-portal"); 
        await imports.handlePortal(bot, ctx, db, ctx.chat.id);
    });

    // bot.on('my_chat_member', async (ctx) => {
    //     console.log("my_chat_member");  
    //     // return;
    //     // Triggered when the bot is added to a group/channel as an administrator
    //     if (ctx.myChatMember.new_chat_member.status === 'administrator') {
    //         const customText = ctx.session.customText || "Portal setup initiated! Please verify to join the group.";
    //         const customMedia = ctx.session.customMedia || null;  // Fetch media from your session or database

    //         // Create encrypted data for verification
    //         const portalData = retrievePortalData(ctx.chat.id);
    //         const encryptedData = encryptData(JSON.stringify(portalData));

    //         // Verification link
    //         const verificationLink = `https://t.me/${ctx.me.username}?start=verify_${encryptedData}`;

    //         if (customMedia) {
    //             // Send media with custom text and a 'Tap to verify' button
    //             await ctx.replyWithPhoto(customMedia, {
    //                 caption: customText,
    //                 reply_markup: {
    //                     keyboard: [
    //                         [{
    //                             text: 'Tap to verify', 
    //                             url: verificationLink
    //                         }]
    //                     ],
    //                     resize_keyboard: true,
    //                     one_time_keyboard: true
    //                 }
    //             });
    //         } else {
    //             // Fallback to sending just text and button if no media is provided
    //             await ctx.reply(customText, {
    //                 reply_markup: {
    //                     keyboard: [
    //                         [{
    //                             text: 'Tap to verify',
    //                             url: verificationLink
    //                         }]
    //                     ],
    //                     resize_keyboard: true,
    //                     one_time_keyboard: true
    //                 }
    //             });
    //         }
    //     }
    // });
};
