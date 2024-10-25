module.exports = (bot, commands, db) => {
    // Listen for changes in chat member status
    // bot.on("chat_member", async (ctx) => {
    //   const member = ctx.chatMember;
      
    //   // Check if the member has just joined
    //   if (member.new_chat_member && member.new_chat_member.status === "member") {
    //     const groupId = ctx.chat.id;
  
    //     // Generate CAPTCHA for the new member
    //     const a = Math.floor(Math.random() * 10);
    //     const b = Math.floor(Math.random() * 10);
    //     const captchaAnswer = a + b;
  
    //     // Store CAPTCHA info in the session or database for later verification
    //     ctx.session.captchaAnswer = captchaAnswer;
  
    //     // Inform the group and send CAPTCHA challenge
    //     await ctx.reply(`Welcome ${member.new_chat_member.user.first_name}! Please solve this CAPTCHA: ${a} + ${b}`);
    //   }
    // });

    // bot.on('message:new_chat_members', async (ctx) => {
    //     if (ctx.chat.type == 'channel') {
    //         return;
    //     }
    //     console.log("message:new_chat_members");
    //     // Custom text and media
    //     const newUser = ctx.message.new_chat_members[0];
    //     const customText = `Welcome ${newUser},\n`;
  };
  