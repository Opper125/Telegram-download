const axios = require('axios');

exports.handler = async (event, context) => {
    const botToken = process.env.7618660728:AAGq-N1Y56LoBjIgQy3Y98n8XxHLFlB7Zds;

    try {
        if (event.queryStringParameters && event.queryStringParameters.poll) {
            // Polling mode: Fetch new messages from Telegram
            const updatesResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`);
            if (!updatesResponse.data.ok) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ messages: [], error: 'Error fetching updates' })
                };
            }

            const messages = updatesResponse.data.result.map(update => ({
                chatId: update.message?.chat.id.toString(),
                text: update.message?.text || 'No text'
            }));

            // Clear processed updates
            if (messages.length > 0) {
                const lastUpdateId = updatesResponse.data.result[updatesResponse.data.result.length - 1].update_id;
                await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateId + 1}`);
            }

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({ messages })
            };
        } else {
            // Webhook mode: Handle incoming messages from website
            const { message, chatId } = JSON.parse(event.body);

            if (!message || !chatId) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ reply: 'No message or chatId provided' })
                };
            }

            // Send message to Telegram
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

            // Simulate bot response (replace with actual bot logic if needed)
            const botReply = `Bot received: ${message}`;

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({ reply: botReply })
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ reply: 'Server error' })
        };
    }
};
