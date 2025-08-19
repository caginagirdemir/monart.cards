// MonArt Cards - Custom JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // Twitter Connect Button
    const twitterConnectBtn = document.getElementById('twitterConnectBtn');
    const twitterProfile = document.getElementById('twitterProfile');
    const profileImage = document.getElementById('profileImage');
    const username = document.getElementById('username');
    
    // Check if all required elements exist
    if (!twitterConnectBtn || !twitterProfile || !profileImage || !username) {
        console.error('Required DOM elements not found. Please check HTML structure.');
        return;
    }
    
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
                    // User cancelled or popup closed
                    resetTwitterButton();
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
            response_type: 'code', // Back to authorization code flow
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            scope: config.scopes.join(' '),
            state: state,
            code_challenge: generateCodeChallenge(),
            code_challenge_method: 'plain'
        });
        
        return `${config.endpoints.authorize}?${params.toString()}`;
    }
    
    function generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    function generateCodeChallenge() {
        // Generate PKCE code verifier and challenge
        const codeVerifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        // Store code verifier for later use
        localStorage.setItem('twitter_code_verifier', codeVerifier);
        
        // For now, use a simple challenge (not cryptographically secure but will work)
        // In production, you should use proper PKCE with SHA256 hash
        return codeVerifier;
    }
    
    // Removed checkTwitterAuthResult function - not needed for implicit flow
    
    function exchangeCodeForToken(code) {
        // Use backend API for token exchange
        const config = window.TWITTER_CONFIG;
        const codeVerifier = localStorage.getItem('twitter_code_verifier');
        

        
        fetch(`${config.backendUrl}/twitter/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                code_verifier: codeVerifier
            })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(data => {
            console.log('Backend token exchange response:', data);
            
            if (data && data.success && data.access_token) {
                // Store access token
                localStorage.setItem('twitter_access_token', data.access_token);
                showNotification('Your Twitter account has been successfully connected!', 'success');
                
                // Get user data with real access token
                setTimeout(() => {
                    fetchTwitterUserData();
                }, 1000);
            } else {
                console.error('Backend token exchange failed:', data);
                showNotification('Token exchange failed. Using mock data.', 'warning');
                
                // Fallback to mock data
                setTimeout(() => {
                    fetchTwitterUserData();
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Backend API error:', error);
            
            // Show user-friendly error message
            if (error.message.includes('Rate limit exceeded')) {
                showNotification('API rate limit exceeded (429). Too many requests. Using demo data. Please wait a few minutes and try again.', 'danger');
            } else if (error.message.includes('Server error')) {
                showNotification('Server temporarily unavailable (5xx error). Using demo data. Please try again later.', 'danger');
            } else {
                showNotification('Connection failed. This may be due to rate limiting or server issues. Using demo data. Please try again later.', 'danger');
            }
            
            // Fallback to mock data
            setTimeout(() => {
                fetchTwitterUserData();
            }, 1000);
        });
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
        // console.log('Callback redirect detected:', callbackUrl);
        
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
            // Use backend API to get user data
            fetchTwitterUserFromBackend(accessToken);
        } else {
            // Fallback to mock data if no access token
            setTimeout(() => {
                const mockUserData = {
                    username: '@monart_cards',
                    profileImage: 'https://picsum.photos/300/300?random=1',
                    displayName: 'MonArt Cards'
                };
                
                updateTwitterProfile(mockUserData);
            }, 1500);
        }
    }
    
    function fetchTwitterUserFromBackend(accessToken) {
        // Use backend API to get Twitter user data
        const config = window.TWITTER_CONFIG;
        
        fetch(`${config.backendUrl}/twitter/user`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access_token': accessToken
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(data => {
            console.log('Backend user data response:', data);
            
            if (data && data.success && data.user) {
                // Get higher quality profile image by replacing _normal with _400x400
                let profileImageUrl = data.user.profile_image_url;
                if (profileImageUrl && profileImageUrl.includes('_normal')) {
                    profileImageUrl = profileImageUrl.replace('_normal', '_400x400');
                }
                
                const userData = {
                    username: `@${data.user.username || 'monart_cards'}`,
                    profileImage: profileImageUrl || 'https://picsum.photos/300/300?random=1',
                    displayName: data.user.name || 'MonArt Cards'
                };
                
                updateTwitterProfile(userData);
            } else {
                console.error('Backend user data failed:', data);
                // Fallback to mock data
                const mockUserData = {
                    username: '@monart_cards',
                    profileImage: 'https://picsum.photos/300/300?random=1',
                    displayName: 'MonArt Cards'
                };
                
                updateTwitterProfile(mockUserData);
            }
        })
        .catch(error => {
            console.error('Backend user data error:', error);
            
            // Show user-friendly error message
            if (error.message.includes('Rate limit exceeded')) {
                showNotification('API rate limit exceeded (429). Too many requests. Using demo data. Please wait a few minutes and try again.', 'danger');
            } else if (error.message.includes('Server error')) {
                showNotification('Server temporarily unavailable (5xx error). Using demo data. Please try again later.', 'danger');
            } else {
                showNotification('Connection failed. This may be due to rate limiting or server issues. Using demo data. Please try again later.', 'danger');
            }
            
            // Fallback to mock data
            const mockUserData = {
                username: '@monart_cards',
                profileImage: 'https://picsum.photos/300/300?random=1',
                displayName: 'MonArt Cards'
            };
            
            updateTwitterProfile(mockUserData);
        });
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
                    profileImage: 'https://picsum.photos/300/300?random=1',
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
                profileImage: 'https://picsum.photos/300/300?random=1',
                displayName: 'MonArt Cards'
            };
            
            updateTwitterProfile(mockUserData);
        });
    }
    
    function updateTwitterProfile(userData) {
        // Check if DOM elements exist before updating
        if (!profileImage || !username || !twitterProfile || !twitterConnectBtn) {
            console.error('Required DOM elements not found');
            return;
        }
        
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
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
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

    // Share X Button functionality
    const shareXBtn = document.getElementById('shareXBtn');
    if (shareXBtn) {
        shareXBtn.addEventListener('click', shareOnTwitter);
    }

    // Copy Image Button functionality
    const copyImageBtn = document.getElementById('copyImageBtn');
    if (copyImageBtn) {
        copyImageBtn.addEventListener('click', copyImageToClipboard);
    }

    // Download Image Button functionality
    const downloadImageBtn = document.getElementById('downloadImageBtn');
    if (downloadImageBtn) {
        downloadImageBtn.addEventListener('click', downloadImage);
    }

    function shareOnTwitter() {
        // Show loading state
        shareXBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Preparing...';
        shareXBtn.disabled = true;

        // Take screenshot of the card with better image handling
        const cardElement = document.querySelector('.css-card');
        
        // Wait for all images to load before taking screenshot
        const profileImg = cardElement.querySelector('#profileImage');
        if (profileImg && profileImg.src) {
            // Create a new image to ensure it's loaded
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                takeScreenshot(cardElement);
            };
            img.onerror = function() {
                // If image fails to load, take screenshot anyway
                takeScreenshot(cardElement);
            };
            img.src = profileImg.src;
        } else {
            takeScreenshot(cardElement);
        }
        
        function takeScreenshot(element) {
            html2canvas(element, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 2,
                logging: false,
                imageTimeout: 15000
            }).then(canvas => {
                // Convert canvas to blob and download the image
                canvas.toBlob(function(blob) {
                    // Create download link for the image
                    const downloadLink = document.createElement('a');
                    downloadLink.href = URL.createObjectURL(blob);
                    downloadLink.download = 'monart-card.png';
                    
                    // Download the image automatically
                    downloadLink.click();
                    
                    // Show success notification
                    showNotification('Card image downloaded! Add it to your tweet manually.', 'success');
                    
                    // Prepare Twitter share URL with text
                    const tweetText = encodeURIComponent(`This is my Monart Card and I'm part of the Monad community! If you want to print your Monart Cards, do it now! https://monart.cards/\n\nMonad belongs to the people! @monad 💜\n\n📸 Image downloaded - add it to your tweet!`);
                    
                    // Open Twitter compose in new window
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
                    window.open(twitterUrl, '_blank', 'width=600,height=400');

                    // Reset button
                    setTimeout(() => {
                        shareXBtn.innerHTML = '<i class="bi bi-twitter-x"></i>Share on X';
                        shareXBtn.disabled = false;
                    }, 2000);
                    
                    // Clean up
                    setTimeout(() => {
                        URL.revokeObjectURL(downloadLink.href);
                    }, 1000);
                    
                }, 'image/png');
            }).catch(error => {
                console.error('Screenshot error:', error);
                // Fallback: just open Twitter with text
                const tweetText = encodeURIComponent(`This is my Monart Card and I'm part of the Monart Cards community! If you want to print your Monart Cards, do it now! https://monart.cards/\n\nMonad belongs to the people! @monad 💜`);
                const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
                window.open(twitterUrl, '_blank', 'width=600,height=400');
                
                // Reset button
                shareXBtn.innerHTML = '<i class="bi bi-twitter-x"></i>Share on X';
                shareXBtn.disabled = false;
            });
        }
    }

    function copyImageToClipboard() {
        // Show loading state
        copyImageBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Copying...';
        copyImageBtn.disabled = true;

        // Take screenshot of the card with better image handling
        const cardElement = document.querySelector('.css-card');
        
        // Wait for all images to load before taking screenshot
        const profileImg = cardElement.querySelector('#profileImage');
        if (profileImg && profileImg.src) {
            // Create a new image to ensure it's loaded
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                takeScreenshotForCopy(cardElement);
            };
            img.onerror = function() {
                // If image fails to load, take screenshot anyway
                takeScreenshotForCopy(cardElement);
            };
            img.src = profileImg.src;
        } else {
            takeScreenshotForCopy(cardElement);
        }
        
        function takeScreenshotForCopy(element) {
            html2canvas(element, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 2,
                logging: false,
                imageTimeout: 15000
            }).then(canvas => {
                // Convert canvas to blob and copy to clipboard
                canvas.toBlob(function(blob) {
                    // Create a ClipboardItem for the image
                    const clipboardItem = new ClipboardItem({
                        'image/png': blob
                    });
                    
                    // Copy to clipboard
                    navigator.clipboard.write([clipboardItem]).then(() => {
                        // Show success notification
                        showNotification('Card image copied to clipboard! You can now paste it anywhere.', 'success');
                        
                        // Reset button
                        setTimeout(() => {
                            copyImageBtn.innerHTML = '<i class="bi bi-clipboard"></i>Copy Image';
                            copyImageBtn.disabled = false;
                        }, 2000);
                        
                    }).catch(err => {
                        console.error('Failed to copy to clipboard:', err);
                        // Fallback: download the image
                        const downloadLink = document.createElement('a');
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.download = 'monart-card.png';
                        downloadLink.click();
                        
                        showNotification('Image copied to clipboard failed. Image downloaded instead.', 'warning');
                        
                        // Reset button
                        setTimeout(() => {
                            copyImageBtn.innerHTML = '<i class="bi bi-clipboard"></i>Copy Image';
                            copyImageBtn.disabled = false;
                        }, 2000);
                        
                        // Clean up
                        setTimeout(() => {
                            URL.revokeObjectURL(downloadLink.href);
                        }, 1000);
                    });
                    
                }, 'image/png');
            }).catch(error => {
                console.error('Screenshot error:', error);
                showNotification('Failed to capture card image.', 'danger');
                
                // Reset button
                copyImageBtn.innerHTML = '<i class="bi bi-clipboard"></i>Copy Image';
                copyImageBtn.disabled = false;
            });
        }
    }

    function downloadImage() {
        // Show loading state
        downloadImageBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Downloading...';
        downloadImageBtn.disabled = true;

        // Take screenshot of the card with better image handling
        const cardElement = document.querySelector('.css-card');
        
        // Wait for all images to load before taking screenshot
        const profileImg = cardElement.querySelector('#profileImage');
        if (profileImg && profileImg.src) {
            // Create a new image to ensure it's loaded
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                takeScreenshotForDownload(cardElement);
            };
            img.onerror = function() {
                // If image fails to load, take screenshot anyway
                takeScreenshotForDownload(cardElement);
            };
            img.src = profileImg.src;
        } else {
            takeScreenshotForDownload(cardElement);
        }
        
        function takeScreenshotForDownload(element) {
            html2canvas(element, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 2,
                logging: false,
                imageTimeout: 15000
            }).then(canvas => {
                // Convert canvas to blob and download
                canvas.toBlob(function(blob) {
                    // Create download link
                    const downloadLink = document.createElement('a');
                    downloadLink.href = URL.createObjectURL(blob);
                    downloadLink.download = 'monart-card.png';
                    
                    // Trigger download
                    downloadLink.click();
                    
                    // Show success notification
                    showNotification('Card image downloaded successfully!', 'success');
                    
                    // Reset button
                    setTimeout(() => {
                        downloadImageBtn.innerHTML = '<i class="bi bi-download"></i>Download Image';
                        downloadImageBtn.disabled = false;
                    }, 2000);
                    
                    // Clean up
                    setTimeout(() => {
                        URL.revokeObjectURL(downloadLink.href);
                    }, 1000);
                    
                }, 'image/png');
            }).catch(error => {
                console.error('Screenshot error:', error);
                showNotification('Failed to capture card image.', 'danger');
                
                // Reset button
                downloadImageBtn.innerHTML = '<i class="bi bi-download"></i>Download Image';
                downloadImageBtn.disabled = false;
            });
        }
    }

    // Console welcome message
    // console.log('🎨 MonArt Cards - Welcome!');
    // console.log('Ready for modern and creative card designs.');
});
