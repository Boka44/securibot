const { Bot, session } = require("grammy");
const { conversations, createConversation } = require("@grammyjs/conversations");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { MongoDBAdapter } = require("@grammyjs/storage-mongodb");

const TG_BOT_API_KEY = process.env.TG_BOT_API_KEY;
const db_user = process.env.DB_USER;
const db_password = process.env.DB_PASSWORD;
const bot = new Bot(TG_BOT_API_KEY);

// MongoDB connection setup
const uri = `mongodb+srv://${db_user}:${db_password}@cluster0.pqumw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    tls: true,
    tlsAllowInvalidCertificates: true, // You may need this for local testing
    tlsVersion: 'TLSv1_2' // Use the highest TLS version supported
  }
});
const State = {
    isBotBroken: false,
};

async function main() {
  try {
    // Connect to MongoDB
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. Successfully connected to MongoDB!");

    // Database session storage
    const db = client.db("telegram_bot");
    const sessions = db.collection("sessions");

    // Use MongoDB for session storage
    bot.use(session({
      storage: new MongoDBAdapter({ collection: sessions }),
      initial: () => ({}) // Initialize empty session
    }));
    
    bot.use(conversations());

    const commands = {
      global: [],
      private: [],
      groups: [],
      channels: [], // Added channel-specific commands
    };

    const links = ``;

    const imports = require("./scopes/imports")
    // console.log("imports", imports);
    // Load scope-specific logic
    require("./scopes/global")(bot, commands, db);
    
    require("./scopes/private")(bot, commands, db, imports, State);
    require("./scopes/groups")(bot, commands, db);
    require("./scopes/channel")(bot, commands, db, imports, State); // Adding channel-specific scope
  

    // const rights = {
    //     can_post_messages: true,
    //     can_edit_messages: true,
    //     can_delete_messages: true,
    //     can_manage_chat: true,
    //     can_invite_to_channel: true,
    //     can_pin_messages: true,
    // };
    
    // await bot.api.callAPI() setBotBroadcastDefaultAdminRights(rights);

    // Setup bot commands
    async function setMyCommands() {
        // Commands for private chats (DMs)
        if (commands.global.length > 0 || commands.private.length > 0) {
          await bot.api.setMyCommands(
            [...commands.global, ...commands.private],
            { scope: { type: "all_private_chats" } } // Available only in private chats
          );
        }
      
        // Commands for group chats
        if (commands.global.length > 0 || commands.groups.length > 0 || commands.channels.length > 0) {
          await bot.api.setMyCommands(
            [...commands.global, ...commands.groups, ...commands.channels],
            { scope: { type: "all_group_chats" } } // Available only in group chats
          );
        }
      
    
      }
      
    setMyCommands();

    // Start the bot
    bot.start();

    // Error handling
    bot.catch((err, ctx) => {
      console.error(`Error for ${ctx}`, err);
      State.isBotBroken = true;
      return;
    //   ctx.reply("An error occurred. Please try again later.");
    });

    // Export external logic
    // module.exports = imports;
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

// Call main to start everything
main().catch(err => console.error("Failed to start bot:", err));
