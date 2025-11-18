// Define currentLang in the global scope
        let currentLang = 'en';

        // 1. STICKY HEADER IMPLEMENTATION (UX Improvement)
        document.addEventListener('DOMContentLoaded', () => {
            const header = document.querySelector('.header');
            const observer = new IntersectionObserver( 
                ([entry]) => {
                    // entry.intersectionRatio < 1 means the header is scrolled off-screen
                    header.classList.toggle('is-scrolled', entry.intersectionRatio < 1);
                },
                { threshold: [0, 1] } 
            );

            // Observe the header itself. This is a simple way to detect scroll direction.
            // A more robust solution might observe a sentinel element below the header,
            // but for a fixed header, this class toggle approach is effective.
            // The padding-top on the body handles the initial offset.
            // A simpler approach is also just to check window.scrollY, but IntersectionObserver is cleaner.

            // Since the header is fixed, we can just check window.scrollY
            window.addEventListener('scroll', () => {
                if (window.scrollY > 10) {
                    header.classList.add('is-scrolled');
                } else {
                    header.classList.remove('is-scrolled');
                }
            });
        });
        
        // remove # from link and smooth scroll (original logic is good)
        const navLinks = document.querySelectorAll('nav a');

        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = link.getAttribute('href').substring(1); 
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    // Use standard scroll-margin-top CSS and smooth scroll
                    window.scrollTo({ 
                        top: targetElement.offsetTop - document.querySelector('.header').offsetHeight, // Adjust for fixed header height
                        behavior: 'smooth' 
                    });
                    // history.pushState is removed as it was unnecessary to push empty state
                }
            });
        });
        
        // animation and observer code remains unchanged
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, observerOptions);

        // Add animation classes to elements
        document.querySelectorAll('.country-card').forEach((el, index) => {
            el.classList.add('slide-in-left');
            el.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(el);
        });

        document.querySelectorAll('.stat-card').forEach((el, index) => {
            el.classList.add('scale-in');
            el.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(el);
        });

        document.querySelectorAll('.program-card').forEach((el, index) => {
            el.classList.add('fade-in');
            el.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(el);
        });

        document.querySelectorAll('section > .container > h2').forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
		
		function setupCountriesSlider() {
			const slider = document.getElementById('countriesSlider');
			let isAutoSliding = false;
			let slideInterval;

			function slideRight() {
				slider.scrollLeft += slider.offsetWidth;
				if (slider.scrollLeft >= (slider.scrollWidth - slider.offsetWidth)) {
					slider.scrollLeft = 0;
				}
			}

			function startAutoSlide() {
				if (!isAutoSliding) {
					isAutoSliding = true;
					slideInterval = setInterval(slideRight, 3000); // Slide every 3 seconds
				}
			}

			function stopAutoSlide() {
				if (isAutoSliding) {
					isAutoSliding = false;
					clearInterval(slideInterval);
				}
			}

			// Start auto-sliding when the section comes into view
			const observer = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						setTimeout(startAutoSlide, 3000); // Start sliding after 3 seconds
					} else {
						stopAutoSlide();
					}
				});
			}, { threshold: 0.5 }); // Trigger when 50% of the slider is visible

			observer.observe(slider);

			// Stop auto-sliding when user interacts with the slider
			slider.addEventListener('mouseenter', stopAutoSlide);
			slider.addEventListener('mouseleave', startAutoSlide);
			slider.addEventListener('touchstart', stopAutoSlide, { passive: true });
			slider.addEventListener('touchend', startAutoSlide);
		}

		// Call the setup function when the DOM is loaded
		document.addEventListener('DOMContentLoaded', setupCountriesSlider);

        // 2. MODIFIED NUMBER COUNTER ANIMATION (Reliability)
        function animateValue(obj, start, end, duration) {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                
                // Determine suffix from the original HTML text or use a default
                const suffix = obj.textContent.includes('%') ? '%' : 
                               obj.textContent.includes('+') ? '+' : '';

                let value = Math.floor(progress * (end - start) + start);
                
                // Special handling for 95% to show the final value correctly
                if (suffix === '%' && progress === 1) {
                    value = end; 
                }
                
                // Add comma separators for large numbers (UX)
                obj.textContent = value.toLocaleString() + suffix; 
                
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }

        // Animate stats when they come into view
        document.querySelectorAll('.stat-card h3[data-final]').forEach(el => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const finalValue = parseInt(el.getAttribute('data-final'));
                        // Get the current text to preserve the + or %
                        const originalText = el.textContent;
                        
                        // Set start text based on the presence of '+' or '%'
                        if (originalText.includes('+')) {
                            el.textContent = '0+';
                        } else if (originalText.includes('%')) {
                            el.textContent = '0%';
                        } else {
                            el.textContent = '0';
                        }

                        animateValue(el, 0, finalValue, 1500); // Reduced duration for faster perceived speed (UX)
                        observer.unobserve(el);
                    }
                });
            });
            observer.observe(el);
        });


        // Mobile menu functionality (no major change)
        document.addEventListener('DOMContentLoaded', function() {
            // Language switching functionality
            const languageSwitch = document.querySelectorAll('.language-switch');
            const enElements = document.querySelectorAll('.lang-en');
            const arElements = document.querySelectorAll('.lang-ar');
            const langText = document.querySelectorAll('.lang-text');

            // Mobile menu elements
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            const navMenu = document.querySelector('.nav-menu');
            const menuItems = navMenu.querySelectorAll('a');

            // Function to handle language switching logic
            function switchLanguage(targetLang) {
                if (targetLang === 'en') {
                    languageSwitch.forEach(button => button.setAttribute('data-lang', 'en'));
                    enElements.forEach(el => el.style.display = 'block');
                    arElements.forEach(el => el.style.display = 'none');
                    langText.forEach(text => text.textContent = 'عربي');
                    document.documentElement.setAttribute('dir', 'ltr');
                    currentLang = 'en';
                } else {
                    languageSwitch.forEach(button => button.setAttribute('data-lang', 'ar'));
                    enElements.forEach(el => el.style.display = 'none');
                    arElements.forEach(el => el.style.display = 'block');
                    langText.forEach(text => text.textContent = 'EN');
                    document.documentElement.setAttribute('dir', 'rtl');
                    currentLang = 'ar';
                }
            }


            // Mobile menu toggle
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent click from bubbling to document
                navMenu.classList.toggle('active');
            });

            // Close menu when clicking menu items
            menuItems.forEach(item => {
                item.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    navMenu.classList.remove('active');
                }
            });

            // Language switch functionality
            languageSwitch.forEach(button => {
                button.addEventListener('click', () => {
                    const nextLang = button.getAttribute('data-lang') === 'en' ? 'ar' : 'en';
                    switchLanguage(nextLang);
                });
            });

            // Set initial language text and direction
            switchLanguage('en'); 
        });

        // WhatsApp functionality - Updated version (No change needed, logic is clean)
        document.querySelector('.fab-button').addEventListener('click', () => {
            const phoneNumber = '+201096485440';
            const message = currentLang === 'en' ?
                'Hello! I would like to know more about your educational programs.' :
                'مرحباً! أود معرفة المزيد عن برامجكم التعليمية.';

            const encodedMessage = encodeURIComponent(message);

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            const whatsappUrl = isMobile ?
                `whatsapp://send?phone=${phoneNumber.replace('+', '')}&text=${encodedMessage}` :
                `https://web.whatsapp.com/send?phone=${phoneNumber.replace('+', '')}&text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');
        });

        // services animations starts here (No change needed)
        function createParticles(card) {
            const particlesContainer = card.querySelector('.particles');
            const numParticles = 5;

            for (let i = 0; i < numParticles; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particlesContainer.appendChild(particle);

                animateParticle(particle);
            }
        }

        function animateParticle(particle) {
            // Random position and movement
            const tx = (Math.random() - 0.5) * 100;
            const ty = -Math.random() * 100;

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);

            // Reset particle position
            particle.style.left = '50%';
            particle.style.top = '50%';

            // Apply animation
            particle.style.animation = 'particleFloat 2s ease-out forwards';

            // Remove and recreate particle after animation
            particle.addEventListener('animationend', () => {
                particle.remove();
                const card = particle.closest('.service-card');
                if (card && card.querySelector('.particles')) {
                    const newParticle = document.createElement('div');
                    newParticle.className = 'particle';
                    card.querySelector('.particles').appendChild(newParticle);
                    animateParticle(newParticle);
                }
            });
        }

        // Initialize particles for each card
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                createParticles(card);
            });
        });

        // Intersection Observer for scroll animations
        const servicesObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.style.opacity = '1';
                }
            });
        }, { threshold: 0.1 });

        // Apply scroll animations to service cards
        document.querySelectorAll('.service-card').forEach((card, index) => {
            card.style.transform = 'translateY(50px)';
            card.style.opacity = '0';
            card.style.transition = `all 0.6s ease ${index * 0.2}s`;
            servicesObserver.observe(card);
        });
        // end of services animation 
        // Handle form submission (No change needed)
        document.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
            fetch(this.action, {
                method: this.method,
                body: new FormData(this),
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    alert('Thank you for your submission!');
                    this.reset();
                } else {
                    alert('Oops! Something went wrong.');
                }
            }).catch(error => {
                alert('Oops! Something went wrong.');
            });
        });
        
