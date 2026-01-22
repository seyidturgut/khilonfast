/**
 * Next-Generation Interactive Features for Khilonfast
 * Handles animations, scroll effects, and user interactions
 */

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Debounce function to limit execution rate
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if element is in viewport
 */
function isInViewport(element, offset = 100) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
    rect.bottom >= offset
  );
}

// ==========================================================================
// Header Scroll Effect
// ==========================================================================

function initHeaderScroll() {
  const header = document.querySelector('.header');
  
  window.addEventListener('scroll', debounce(() => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, 10));
}

// ==========================================================================
// Mobile Menu Toggle
// ==========================================================================

function initMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (!menuToggle) return;
  
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
  });
  
  // Close menu when clicking on a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// ==========================================================================
// Scroll Reveal Animations
// ==========================================================================

function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  
  function checkReveal() {
    revealElements.forEach(element => {
      if (isInViewport(element, 100)) {
        element.classList.add('active');
      }
    });
  }
  
  // Check on scroll
  window.addEventListener('scroll', debounce(checkReveal, 50));
  
  // Check on load
  checkReveal();
}

// ==========================================================================
// Smooth Scrolling for Anchor Links
// ==========================================================================

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      
      // Skip if href is just "#"
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ==========================================================================
// Animated Counter for Stats
// ==========================================================================

function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  const speed = 200; // Animation speed
  
  let hasRun = false;
  
  function runCounters() {
    if (hasRun) return;
    
    const statsSection = document.querySelector('.stats-section');
    if (!statsSection || !isInViewport(statsSection, 200)) return;
    
    hasRun = true;
    
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const increment = target / speed;
      let current = 0;
      
      const updateCounter = () => {
        current += increment;
        
        if (current < target) {
          counter.textContent = Math.ceil(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };
      
      updateCounter();
    });
  }
  
  window.addEventListener('scroll', debounce(runCounters, 50));
  runCounters(); // Check on load
}

// ==========================================================================
// FAQ Accordion
// ==========================================================================

function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      // Close other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      
      // Toggle current item
      item.classList.toggle('active');
    });
  });
}

// ==========================================================================
// Service Card 3D Tilt Effect
// ==========================================================================

function initCardTilt() {
  const cards = document.querySelectorAll('.service-card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * 5;
      const rotateY = ((centerX - x) / centerX) * 5;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ==========================================================================
// Particle Background Animation
// ==========================================================================

function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', debounce(resizeCanvas, 250));
  
  // Particle class
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.speedY = Math.random() * 0.5 - 0.25;
      this.opacity = Math.random() * 0.5 + 0.2;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      // Wrap around edges
      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }
    
    draw() {
      ctx.fillStyle = `rgba(212, 255, 55, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Create particles
  const particles = [];
  const particleCount = 80;
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  // Animation loop
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    // Draw connections between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          ctx.strokeStyle = `rgba(0, 245, 255, ${0.2 * (1 - distance / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    
    requestAnimationFrame(animateParticles);
  }
  
  animateParticles();
}

// ==========================================================================
// Cursor Glow Effect (Optional - for desktop)
// ==========================================================================

function initCursorGlow() {
  // Only on desktop
  if (window.innerWidth < 1024) return;
  
  const cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow';
  cursorGlow.style.cssText = `
    position: fixed;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212, 255, 55, 0.15), transparent 70%);
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s ease;
    opacity: 0;
  `;
  
  document.body.appendChild(cursorGlow);
  
  let mouseX = 0;
  let mouseY = 0;
  let glowX = 0;
  let glowY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorGlow.style.opacity = '1';
  });
  
  document.addEventListener('mouseleave', () => {
    cursorGlow.style.opacity = '0';
  });
  
  // Smooth follow animation
  function animateGlow() {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';
    
    requestAnimationFrame(animateGlow);
  }
  
  animateGlow();
}

// ==========================================================================
// Intersection Observer for Better Performance
// ==========================================================================

function initIntersectionObserver() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, observerOptions);
  
  // Observe all reveal elements
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ==========================================================================
// Initialize All Features
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Khilonfast Next-Gen Features...');
  
  // Initialize all features
  initHeaderScroll();
  initMobileMenu();
  initSmoothScroll();
  initScrollReveal();
  initCounters();
  initFAQ();
  initCardTilt();
  initParticles();
  initCursorGlow();
  initIntersectionObserver();
  
  console.log('✅ All features initialized successfully!');
});

// Handle resize events
window.addEventListener('resize', debounce(() => {
  // Reinitialize features that need to adapt to screen size
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow && window.innerWidth < 1024) {
    cursorGlow.remove();
  } else if (!cursorGlow && window.innerWidth >= 1024) {
    initCursorGlow();
  }
}, 250));
