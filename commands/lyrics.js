// --------------------------------------------------------------
//  Nexray API (primary)
// --------------------------------------------------------------
async function fetchFromNexray(query) {
    const url = `https://api.nexray.eu.cc/search/lyrics?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;
    // Kufungua muundo: data.result.lyrics.plain_lyrics
    if (data && data.status === true && data.result && data.result.lyrics && data.result.lyrics.plain_lyrics) {
        return {
            title: data.result.lyrics.track_name || data.result.title,
            artist: data.result.lyrics.artist_name || data.result.artist,
            lyrics: data.result.lyrics.plain_lyrics,
            source: 'Nexray'
        };
    }
    throw new Error('No lyrics found in Nexray response');
}