const axios = require('axios');

exports.handler = async (event, context) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = '1538232799';

    try {
        if (event.queryStringParameters && event.queryStringParameters.poll) {
            const updatesResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`);
            if (!updatesResponse.data.ok) {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    body: JSON.stringify({ messages: [], error: `Error fetching updates: ${updatesResponse.data.description}` })
                };
            }

            const messages = updatesResponse.data.result
                .filter(update => update.message && update.message.chat.id.toString() === defaultChatId)
                .map(update => {
                    const msg = { chatId: update.message.chat.id.toString() };
                    if (update.message.text) {
                        msg.text = update.message.text;
                    }
                    if (update.message.photo) {
                        msg.photo = `https://api.telegram.org/file/bot${botToken}/${update.message.photo[update.message.photo.length - 1].file_path}`;
                    }
                    if (update.message.video) {
                        msg.video = `https://api.telegram.org/file/bot${botToken}/${update.message.video.file_path}`;
                    }
                    if (update.message.voice) {
                        msg.voice = `https://api.telegram.org/file/bot${botToken}/${update.message.voice.file_path}`;
                    }
                    return msg;
                });

            if (updatesResponse.data.result.length > 0) {
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
            const { message, chatId = defaultChatId } = JSON.parse(event.body || '{}');

            if (!message) {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    body: JSON.stringify({ reply: 'No message provided' })
                };
            }

            const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                chat_id: chatId,
                text: message
            });

            if (!response.data.ok) {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    body: JSON.stringify({ reply: `Error sending message: ${response.data.description}` })
                };
            }

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({ reply: `Message sent: ${message}` })
            };
        }
    } catch (error) {
        console.error('Error:', error.message);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ reply: `Server error: ${error.message}` })
        };
    }
};
