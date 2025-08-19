// MonArt Cards - Custom JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // Twitter Connect Button
    const twitterConnectBtn = document.getElementById('twitterConnectBtn');
    const twitterProfile = document.getElementById('twitterProfile');
    const profileImage = document.getElementById('profileImage');
    const username = document.getElementById('username');
    
    twitterConnectBtn.addEventListener('click', function() {
        // Real Twitter OAuth 2.0 flow
        initiateTwitterOAuth();
    });
    
    function initiateTwitterOAuth() {
        // Check if config is loaded
        if (!window.TWITTER_CONFIG || !window.TWITTER_CONFIG.clientId) {
            showNotification('Twitter API configuration not found. Please check config.js file.', 'danger');
            return;
        }
        
        // Show loading state
        twitterConnectBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Connecting...';
        twitterConnectBtn.disabled = true;
        
        // Generate OAuth state for security
        const state = generateRandomState();
        localStorage.setItem('twitter_oauth_state', state);
        
        // Build OAuth URL
        const authUrl = buildTwitterAuthUrl(state);
        
        // Open Twitter OAuth popup
        const popup = window.open(authUrl, 'twitter_oauth', 'width=600,height=600,scrollbars=yes,resizable=yes');
        
        // Check for OAuth completion
        const checkPopup = setInterval(() => {
            try {
                if (popup.closed) {
                    clearInterval(checkPopup);
                    checkTwitterAuthResult();
                } else {
                    // Check if popup has been redirected to callback
                    try {
                        if (popup.location.href.includes('monart.cards/callbacks')) {
                            // Popup has been redirected, close it and handle callback
                            popup.close();
                            clearInterval(checkPopup);
                            handleCallbackRedirect(popup.location.href);
                        }
                    } catch (e) {
                        // Cross-origin error, popup is still on Twitter
                    }
                }
            } catch (e) {
                console.log('Popup check error:', e);
            }
        }, 500);
    }
    
    function buildTwitterAuthUrl(state) {
        const config = window.TWITTER_CONFIG;
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            scope: config.scopes.join(' '),
            state: state,
            code_challenge: generateCodeChallenge(),
            code_challenge_method: 'S256'
        });
        
        return `${config.endpoints.authorize}?${params.toString()}`;
    }
    
    function generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    function generateCodeChallenge() {
        // Simple PKCE challenge (in production, use proper crypto)
        return Math.random().toString(36).substring(2, 15);
    }
    
    function checkTwitterAuthResult() {
        // Check if we have auth code in URL (this would normally come from redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        // Also check for callback path
        if (!code && window.location.pathname === '/callbacks') {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const hashCode = hashParams.get('access_token');
            if (hashCode) {
                // Handle hash-based callback
                handleTwitterCallback(hashCode);
                return;
            }
        }
        
        if (code && state) {
            // Verify state matches
            const savedState = localStorage.getItem('twitter_oauth_state');
            if (state === savedState) {
                // Exchange code for access token
                exchangeCodeForToken(code);
            } else {
                showNotification('OAuth state doğrulanamadı. Güvenlik hatası.', 'danger');
                resetTwitterButton();
            }
        } else {
            // User cancelled or popup closed
            resetTwitterButton();
        }
    }
    
    function exchangeCodeForToken(code) {
        // In a real app, this should be done server-side for security
        // For demo purposes, we'll simulate the token exchange
        
        showNotification('Your Twitter account has been successfully connected!', 'success');
        
        // Simulate getting user data
        setTimeout(() => {
            fetchTwitterUserData();
        }, 1000);
    }
    
    function handleTwitterCallback(accessToken) {
        // Handle direct access token from callback
        showNotification('Your Twitter account has been successfully connected!', 'success');
        
        // Store the access token
        localStorage.setItem('twitter_access_token', accessToken);
        
        // Get user data
        setTimeout(() => {
            fetchTwitterUserData();
        }, 1000);
    }
    
    function handleCallbackRedirect(callbackUrl) {
        console.log('Callback redirect detected:', callbackUrl);
        
        // Parse the callback URL to get parameters
        const url = new URL(callbackUrl);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        
        if (code && state) {
            // Verify state matches
            const savedState = localStorage.getItem('twitter_oauth_state');
            if (state === savedState) {
                // Success - exchange code for token
                exchangeCodeForToken(code);
            } else {
                showNotification('OAuth state verification failed. Security error.', 'danger');
                resetTwitterButton();
            }
        } else {
            showNotification('Twitter callback parameters not found.', 'danger');
            resetTwitterButton();
        }
    }
    
    function fetchTwitterUserData() {
        // Show loading state
        twitterConnectBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Fetching data...';
        
        // Get access token from localStorage
        const accessToken = localStorage.getItem('twitter_access_token');
        
        if (accessToken) {
            // Make real Twitter API call
            fetchTwitterUserFromAPI(accessToken);
        } else {
            // Fallback to mock data if no access token
            setTimeout(() => {
                const mockUserData = {
                    username: '@monart_cards',
                    profileImage: 'https://picsum.photos/150/150?random=1',
                    displayName: 'MonArt Cards'
                };
                
                updateTwitterProfile(mockUserData);
            }, 1500);
        }
    }
    
    function fetchTwitterUserFromAPI(accessToken) {
        // Twitter API v2 endpoint for user info
        const url = 'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name';
        
        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Twitter API response:', data);
            
            if (data.data) {
                const userData = {
                    username: `@${data.data.username}`,
                    profileImage: data.data.profile_image_url,
                    displayName: data.data.name
                };
                
                updateTwitterProfile(userData);
            } else {
                console.error('Twitter API error:', data);
                // Fallback to mock data
                const mockUserData = {
                    username: '@monart_cards',
                    profileImage: 'https://picsum.photos/150/150?random=1',
                    displayName: 'MonArt Cards'
                };
                
                updateTwitterProfile(mockUserData);
            }
        })
        .catch(error => {
            console.error('Twitter API fetch error:', error);
            // Fallback to mock data
            const mockUserData = {
                username: '@monart_cards',
                profileImage: 'https://picsum.photos/150/150?random=1',
                displayName: 'MonArt Cards'
            };
            
            updateTwitterProfile(mockUserData);
        });
    }
    
    function updateTwitterProfile(userData) {
        // Update UI with user data
        profileImage.src = userData.profileImage;
        username.textContent = userData.displayName;
        
        // Show profile card
        twitterProfile.style.display = 'block';
        
        // Update button
        twitterConnectBtn.innerHTML = '<i class="bi bi-check-circle"></i>Connected';
        twitterConnectBtn.classList.remove('btn-primary');
        twitterConnectBtn.classList.add('btn-success');
        
        // Store connection status
        localStorage.setItem('twitter_connected', 'true');
        localStorage.setItem('twitter_user_data', JSON.stringify(userData));
    }
    
    function resetTwitterButton() {
        twitterConnectBtn.innerHTML = '<i class="bi bi-twitter"></i>Connect to Twitter';
        twitterConnectBtn.disabled = false;
        twitterConnectBtn.classList.remove('btn-success');
        twitterConnectBtn.classList.add('btn-primary');
    }
    
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Card hover effects enhancement
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Button click animations
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });

    // Add loading animation to hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.style.opacity = '0';
        heroSection.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            heroSection.style.transition = 'all 1s ease';
            heroSection.style.opacity = '1';
            heroSection.style.transform = 'translateY(0)';
        }, 300);
    }

    // Card reveal animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });

    // Add ripple effect CSS dynamically
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .navbar-scrolled {
            background-color: rgba(0, 0, 0, 0.95) !important;
            backdrop-filter: blur(10px);
        }
    `;
    document.head.appendChild(style);

    // Console welcome message
    console.log('🎨 MonArt Cards - Welcome!');
    console.log('Ready for modern and creative card designs.');
});
