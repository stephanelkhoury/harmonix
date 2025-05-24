// Test YouTube ID extraction function
function extractYoutubeId(url) {
    if (!url) {
        console.error("No YouTube URL provided");
        return null;
    }
    
    const trimmedUrl = url.trim();
    console.log("Extracting YouTube ID from:", trimmedUrl);
    
    const regExps = [
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
        /(?:youtube\.com\/|youtu\.be\/)([^"&?\/\s]{11})/i
    ];
    
    for (const regExp of regExps) {
        const match = trimmedUrl.match(regExp);
        if (match && match[1]) {
            const videoId = match[1];
            console.log("Successfully extracted YouTube ID:", videoId);
            return videoId;
        }
    }
    
    if (trimmedUrl.length === 11) {
        console.log("Input appears to be a direct video ID:", trimmedUrl);
        return trimmedUrl;
    }
    
    console.error("Failed to extract YouTube video ID from:", trimmedUrl);
    return null;
}

// Test cases
console.log("=== Testing YouTube ID Extraction ===");

const testUrls = [
    "https://youtu.be/VkH3aMIWntw?si=hnFqRclEvIP8kwu5",
    "https://www.youtube.com/watch?v=VkH3aMIWntw",
    "https://www.youtube.com/watch?v=VkH3aMIWntw&t=123",
    "https://www.youtube.com/embed/VkH3aMIWntw",
    "https://youtu.be/VkH3aMIWntw",
    "VkH3aMIWntw"
];

testUrls.forEach((url, index) => {
    console.log(`\nTest ${index + 1}:`);
    const result = extractYoutubeId(url);
    console.log(`Input: ${url}`);
    console.log(`Result: ${result}`);
    console.log(`Expected: VkH3aMIWntw`);
    console.log(`Status: ${result === 'VkH3aMIWntw' ? '✅ PASS' : '❌ FAIL'}`);
});
