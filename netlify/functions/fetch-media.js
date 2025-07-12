const axios = require('axios');

exports.handler = async (event, context) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelLink = event.queryStringParameters.channel;

    if (!channelLink || !channelLink.includes('t.me/')) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ success: false, error: 'Invalid Telegram Channel/Group link' })
        };
    }

    try {
        const channelName = channelLink.split('t.me/')[1].split('?')[0];
        const chatResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getChat?chat_id=@${channelName}`);
        if (!chatResponse.data.ok) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({ success: false, error: `Error fetching chat data: ${chatResponse.data.description}` })
            };
        }

        const chatId = chatResponse.data.result.id;
        const updatesResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates?chat_id=${chatId}`);
        if (!updatesResponse.data.ok) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({ success: false, error: `Error fetching messages: ${updatesResponse.data.description}` })
            };
        }

        const mediaItems = [];
        updatesResponse.data.result.forEach(update => {
            if (update.message) {
                if (update.message.photo) {
                    const photo = update.message.photo[update.message.photo.length - 1];
                    mediaItems.push({ type: 'photo', file_id: photo.file_id, name: `photo_${photo.file_id}.jpg` });
                }
                if (update.message.video) {
                    mediaItems.push({
                        type: 'video',
                        file_id: update.message.video.file_id,
                        thumbnail: update.message.video.thumb?.file_id,
                        name: `video_${update.message.video.file_id}.mp4`
                    });
                }
                if (update.message.audio) {
                    mediaItems.push({
                        type: 'audio',
                        file_id: update.message.audio.file_id,
                        name: update.message.audio.file_name || `audio_${update.message.audio.file_id}.mp3`
                    });
                }
                if (update.message.document) {
                    mediaItems.push({
                        type: 'document',
                        file_id: update.message.document.file_id,
                        name: update.message.document.file_name || `document_${update.message.document.file_id}`
                    });
                }
                if (update.message.text) {
                    mediaItems.push({ type: 'text', text: update.message.text });
                }
            }
        });

        for (const item of mediaItems.filter(item => item.type !== 'text')) {
            const fileResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${item.file_id}`);
            if (fileResponse.data.ok) {
                item.url = `https://api.telegram.org/file/bot${botToken}/${fileResponse.data.result.file_path}`;
            }
            if (item.type === 'video' && item.thumbnail) {
                const thumbResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${item.thumbnail}`);
                if (thumbResponse.data.ok) {
                    item.thumbnail = `https://api.telegram.org/file/bot${botToken}/${thumbResponse.data.result.file_path}`;
                }
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ success: true, media: mediaItems })
        };
    } catch (error) {
        console.error('Error:', error.message);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ success: false, error: `Server error: ${error.message}` })
        };
    }
};
