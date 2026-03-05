
const ENDPOINT = 'http://localhost:4321/api/upload-remote-image';
const TEST_IMAGE = 'https://placehold.co/400x400.png'; // Simple reliable image

console.log(`Testing Remote Upload API: ${ENDPOINT}`);
console.log(`Payload Image: ${TEST_IMAGE}`);

async function runtest() {
    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageUrl: TEST_IMAGE,
                filename: 'test-api-upload.png'
            })
        });

        const text = await res.text();
        
        console.log(`\nStatus: ${res.status}`);
        try {
            const json = JSON.parse(text);
            console.log('Response:', JSON.stringify(json, null, 2));
            
            if (json.success) {
                console.log('\n✅ UPDATE SUCCESSFUL! The API is working.');
            } else {
                console.log('\n❌ API returned failure.');
            }
        } catch (e) {
            console.log('Raw Response:', text);
        }

    } catch (e) {
        console.error('❌ Network Error:', e.message);
        console.log('Make sure your Astro server is running on localhost:4321');
    }
}

runtest();
