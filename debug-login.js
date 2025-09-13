// Debug script to test login functionality
const API_URL = 'https://site--quant-platform--lt5sgl89h54n.code.run';

async function testLogin() {
    console.log('Testing login functionality...');
    console.log('API URL:', API_URL);

    const loginData = {
        email: 'test@quantrade.com',
        password: 'test123456'
    };

    try {
        console.log('Attempting login with:', loginData.email);

        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Login failed:', errorText);
            return;
        }

        const data = await response.json();
        console.log('Login successful!');
        console.log('User data:', data.user);
        console.log('Token received:', data.token ? 'Yes' : 'No');

        // Test token validation
        if (data.token) {
            console.log('\nTesting token validation...');
            const profileResponse = await fetch(`${API_URL}/api/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Profile response status:', profileResponse.status);
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log('Profile data:', profileData);
            } else {
                const profileError = await profileResponse.text();
                console.error('Profile fetch failed:', profileError);
            }
        }

    } catch (error) {
        console.error('Network error:', error);
    }
}

testLogin();