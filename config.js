// Twitter API Configuration
// ⚠️ IMPORTANT: Never commit this file to version control
// Add config.js to your .gitignore file

const TWITTER_CONFIG = {
    // Twitter API v2 Credentials
    apiKey: 'X29LZENZNWdvNkhiQ0NGQi1zVjM6MTpjaQ',
    apiSecret: 'qi9NAToPcOaGg31CxQcTq-jq9-U3r3owW2AMnXGhmCe2Nlze-a',
    bearerToken: '', // Bearer token gerekirse ekleyin
    
    // OAuth 2.0 Credentials (for user authentication)
    clientId: 'X29LZENZNWdvNkhiQ0NGQi1zVjM6MTpjaQ',
    clientSecret: 'qi9NAToPcOaGg31CxQcTq-jq9-U3r3owW2AMnXGhmCe2Nlze-a',
    
    // Redirect URI (must match your Twitter App settings)
    redirectUri: 'https://monart.cards/callbacks',
    
    // Scopes for user data access
    scopes: ['tweet.read', 'users.read', 'offline.access'],
    
    // Backend API URL (Vercel)
    backendUrl: 'https://monartcards.vercel.app/api',
    
    // API endpoints
    endpoints: {
        authorize: 'https://twitter.com/i/oauth2/authorize',
        token: 'https://api.twitter.com/2/oauth2/token',
        userInfo: 'https://api.twitter.com/2/users/me',
        userTweets: 'https://api.twitter.com/2/users/me/tweets'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TWITTER_CONFIG;
} else {
    window.TWITTER_CONFIG = TWITTER_CONFIG;
}
