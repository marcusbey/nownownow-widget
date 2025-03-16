// Simple script to test the API endpoints with org-id
const testOrgId = '67tiEuEkC3G';
const testToken = 'Njd0aUV1RWtDM0cuMTc0MjE1NDU0NTE3OC5kZWZhdWx0LXdpZGdldC1zZWNyZXQ=';

// Try different base URLs to find the correct API endpoint
const baseUrls = [
  'http://localhost:3000',
  'https://api.nownownow.io',
  'https://nownownow.io'
];

async function testEndpoint(baseUrl, endpoint, orgId, token) {
  // Use the correct endpoint paths that match the API implementation
  const url = `${baseUrl}/api/v1/widget/${endpoint}?orgId=${encodeURIComponent(orgId)}`;
  console.log(`Testing ${url}...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    console.log(`Status: ${response.status}`);
    
    let responseText;
    try {
      const data = await response.json();
      responseText = JSON.stringify(data, null, 2);
    } catch (e) {
      responseText = await response.text();
    }
    
    if (response.ok) {
      console.log(`Success: ${responseText}`);
      
      // Log the structure of the response for analysis
      try {
        const data = JSON.parse(responseText);
        console.log('\nResponse Structure:');
        if (endpoint === 'org-info') {
          console.log('Organization Info Keys:', Object.keys(data));
          if (data.organization) {
            console.log('- Organization Object Keys:', Object.keys(data.organization));
          }
          if (data.user) {
            console.log('- User Object Keys:', Object.keys(data.user));
          }
        } else if (endpoint === 'org-posts') {
          console.log('Posts Response Keys:', Object.keys(data));
          if (data.posts && data.posts.length > 0) {
            console.log('- First Post Object Keys:', Object.keys(data.posts[0]));
          }
        }
      } catch (e) {
        console.log('Could not parse response for structure analysis');
      }
      
      return true;
    } else {
      console.error(`Error: ${responseText}`);
      return false;
    }
  } catch (error) {
    console.error(`Network error: ${error.message}`);
    return false;
  }
}

async function testApi() {
  console.log('Testing API endpoints with org-id...');
  
  // Try each base URL
  for (const baseUrl of baseUrls) {
    console.log(`\n\nTrying base URL: ${baseUrl}`);
    
    // Test org-info endpoint
    console.log('\nTesting org-info endpoint:');
    const infoSuccess = await testEndpoint(baseUrl, 'org-info', testOrgId, testToken);
    
    // Test org-posts endpoint
    console.log('\nTesting org-posts endpoint:');
    const postsSuccess = await testEndpoint(baseUrl, 'org-posts', testOrgId, testToken);
    
    if (infoSuccess || postsSuccess) {
      console.log(`\n✅ Found working API at ${baseUrl}`);
      // Update the API configuration file with the working URL
      console.log(`To fix the API integration, update the baseUrl in src/config/api.ts to: ${baseUrl}`);
      break;
    }
  }
}

testApi();
