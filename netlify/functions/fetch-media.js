const axios = require('axios');

exports.handler = async (event, context) => {
    const botToken = '7618660728:AAF0gDnzq3tR5SOvCQlCowZlyzoBLE_bQVY';
    const channelLink = event.queryStringParameters.channel;

    if (!channelLink || !channelLink.includes('t.me/')) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, error: 'Invalid Telegram Channel link' })
        };
    }

    try {
        const channelName = channelLink.split('t.me/')[1];
        const chatResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getChat?chat_id=@${channelName}`);
        if (!chatResponse.data.ok) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: 'Error fetching channel data' })
            };
        }

        const chatId = chatResponse.data.result.id;
        const updatesResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates?chat_id=${chatId}`);
        if (!updatesResponse.data.ok) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: 'Error fetching messages' })
            };
        }

        const mediaItems = [];
        updatesResponse.data.result.forEach(update => {
            if (update.message) {
                if (update.message.photo) {
                    const photo = update.message.photo[update.message.photo.length - 1]; // Highest quality
                    mediaItems.push({ type: 'photo', file_id: photo.file_id });
                }
                if (update.message.video) {
                    mediaItems.push({
                        type: 'video',
                        file_id: update.message.video.file_id,
                        thumbnail: update.message.video.thumb?.file_id
                    });
                }
            }
        });

        // Fetch file URLs
        for (const item of mediaItems) {
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
            body: JSON.stringify({ success: true, media: mediaItems })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: 'Server error' })
        };
    }
};
