const axios = require('axios');

exports.handler = async (event, context) => {
    const botToken = process.env.7618660728:AAGq-N1Y56LoBjIgQy3Y98n8XxHLFlB7Zds;
    const chatId = process.env.1538232799; // Replace with your chat ID

    try {
        const { message } = JSON.parse(event.body);

        if (!message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ reply: 'No message provided' })
            };
        }

        // Send message to Telegram bot
        const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: message
        });

        if (!response.data.ok) {
            return {
                statusCode: 400,
                body: JSON.stringify({ reply: 'Error sending message to bot' })
            };
        }

        // Simulate bot response (replace with actual bot response logic)
        const botReply = `Bot response to: ${message}`;

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ reply: botReply })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ reply: 'Server error' })
        };
    }
};
