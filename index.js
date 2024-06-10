const { ChatClient } = require("@twurple/chat");
const { default: OpenAI } = require("openai");
const { promises: fs, existsSync } = require("fs");
const config = require("./config.json");

require("dotenv").config(); // Charger le .env

if (!existsSync("response.txt")) fs.writeFile("response.txt", "", "utf-8"); // Créer le fichier response.txt s'il n'existe pas

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let messages = [];

const chatClient = new ChatClient({ channels: [config.twitchUsername] });
chatClient.onMessage(async (channel, username, content) => {

    console.log("Received message !");
    messages.push(content);

    if (messages.length === 10) {

        console.log("Asking chatgpt...");

        // Créer un message à partir des 10 derniers messages puis vider la liste
        const message = messages.map((message) => "- " + message).join("\n");
        messages = [];

        // Récupérer le dernier programme généré
        const old = await fs.readFile("response.txt", "utf-8");

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system", // (Je suis nul en prompt)
                    content: [
                        "Tu est branché à un tchat twitch",
                        "Tu vas recevoir 10 messages du tchat",
                        "Tu devras effectuer un programme politique à partir des opinions des messages",
                        "Tu devras ignorer les messages qui ne sont pas politiques",
                        "Tu auras aussi le dernier programme que tu as écrit et tu devras donc le compléter",
                        "Donne toujours ta réponse en français et directement"
                    ].join("\n")
                },
                {
                    role: "system",
                    content: [
                        "Voici le dernier programme généré :",
                        (old || "Aucun, c'est la première génération")
                    ].join("\n")
                },
                {
                    role: "system",
                    content: [
                        "Voici les 10 derniers messages :",
                        message
                    ].join("\n")
                }
            ], model: "gpt-4-turbo"
        });

        // Sauvegarder la réponse
        await fs.writeFile("response.txt", completion.choices[0].message.content + "\n");

        console.log("Response saved !");
    }
});
chatClient.connect();
