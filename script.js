document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signup-form');
    const message = document.getElementById('form-message');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        if (email) {
            message.textContent = 'Thank you! You will be notified soon.';
            form.reset();
        } else {
            message.textContent = 'Please enter a valid email address.';
        }
    });

    const subtitlesBtn = document.getElementById('get-subtitles');
    const urlInput = document.getElementById('youtube-url');
    const subtitleMessage = document.getElementById('subtitle-message');

    if (subtitlesBtn && urlInput) {
        subtitlesBtn.addEventListener('click', async function() {
            const url = urlInput.value.trim();
            const videoId = extractVideoId(url);
            subtitleMessage.textContent = '';
            if (!videoId) {
                alert('Please enter a valid YouTube URL.');
                return;
            }
            try {
                const text = await fetchTranscript(videoId);
                if (!text) {
                    alert('No subtitles found for this video.');
                    return;
                }
                downloadText(text, 'subtitles.txt');
                subtitleMessage.textContent = 'Subtitles downloaded.';
            } catch (err) {
                alert('Error fetching subtitles: ' + err.message);
            }
        });
    }
});

function extractVideoId(url) {
    try {
        const u = new URL(url);
        if (u.hostname === 'youtu.be') {
            return u.pathname.slice(1);
        }
        if (u.hostname.endsWith('youtube.com')) {
            return u.searchParams.get('v');
        }
    } catch (e) {
        return null;
    }
    return null;
}

async function fetchTranscript(videoId) {
    const apiUrl = 'https://youtubetranscript.com/?server_vid2=' + videoId;
    const res = await fetch(apiUrl);
    if (!res.ok) {
        throw new Error('Failed to fetch transcript');
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.transcript) || data.transcript.length === 0) {
        throw new Error('No subtitles found');
    }
    return data.transcript.map(part => part.text).join('\n');
}

function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}
