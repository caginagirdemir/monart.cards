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
            showNotification('Twitter API yapılandırması bulunamadı. config.js dosyasını kontrol edin.', 'danger');
            return;
        }
        
        // Show loading state
        twitterConnectBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Bağlanıyor...';
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
            if (popup.closed) {
                clearInterval(checkPopup);
                checkTwitterAuthResult();
            }
        }, 1000);
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
        
        showNotification('Twitter hesabınız başarıyla bağlandı!', 'success');
        
        // Simulate getting user data
        setTimeout(() => {
            fetchTwitterUserData();
        }, 1000);
    }
    
    function handleTwitterCallback(accessToken) {
        // Handle direct access token from callback
        showNotification('Twitter hesabınız başarıyla bağlandı!', 'success');
        
        // Store the access token
        localStorage.setItem('twitter_access_token', accessToken);
        
        // Get user data
        setTimeout(() => {
            fetchTwitterUserData();
        }, 1000);
    }
    
    function fetchTwitterUserData() {
        // Show loading state
        twitterConnectBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Veri alınıyor...';
        
        // In a real app, you would make an API call here
        // For demo, we'll use mock data
        setTimeout(() => {
            const mockUserData = {
                username: '@monart_cards',
                profileImage: 'https://via.placeholder.com/150/1DA1F2/FFFFFF?text=MC',
                displayName: 'MonArt Cards'
            };
            
            updateTwitterProfile(mockUserData);
        }, 1500);
    }
    
    function updateTwitterProfile(userData) {
        // Update UI with user data
        profileImage.src = userData.profileImage;
        username.textContent = userData.displayName;
        
        // Show profile card
        twitterProfile.style.display = 'block';
        
        // Update button
        twitterConnectBtn.innerHTML = '<i class="bi bi-check-circle"></i>Bağlandı';
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
    console.log('🎨 MonArt Cards - Hoş Geldiniz!');
    console.log('Modern ve yaratıcı kart tasarımları için hazır.');
});
