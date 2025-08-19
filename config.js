// Twitter API Configuration
const TWITTER_CONFIG = {
    clientId: 'X29LZENZNWdvNkhiQ0NGQi1zVjM6MTpjaQ',
    clientSecret: 'qi9NAToPcOaGg31CxQcTq-jq9-U3r3owW2AMnXGhmCe2Nlze-a',
    redirectUri: 'https://monart.cards/callbacks',
    scopes: ['tweet.read', 'users.read', 'offline.access'],
    backendUrl: 'https://monartcards.vercel.app/api',
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
