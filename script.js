window.addEventListener('load', () => {
  document.documentElement.classList.add('js-enabled');

  try {
    Splitting();
  } catch (e) {
    console.error("Splitting failed:", e);
  }

  const isMobile = window.innerWidth < 768;

  
  let scroller;
  if (!isMobile) {
    try {
      gsap.registerPlugin(ScrollTrigger);

      scroller = new LocomotiveScroll({
        el: document.querySelector('[data-scroll-container]'),
        smooth: true,
        tablet: { smooth: false },
        smartphone: { smooth: false }
      });

      scroller.on('scroll', ScrollTrigger.update);

      ScrollTrigger.proxy('[data-scroll-container]', {
        scrollTop(value) {
          return arguments.length ? scroller.scrollTo(value, 0, 0) : scroller.scroll.instance.scroll.y;
        },
        getBoundingClientRect() {
          return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
        pinType: 'transform'
      });

      ScrollTrigger.addEventListener('refresh', () => scroller.update());
      
      setTimeout(() => {
        scroller.update();
        ScrollTrigger.refresh();
      }, 800);

      let updates = 0;
      const updateInterval = setInterval(() => {
        if (scroller) {
          scroller.update();
          ScrollTrigger.refresh();
        }
        updates++;
        if (updates > 6) clearInterval(updateInterval);
      }, 600);

    } catch (e) {
      console.error("Locomotive Scroll initialization failed:", e);
      document.documentElement.classList.remove('has-scroll-smooth');
      document.body.classList.remove('has-scroll-smooth');
    }
  }

  const activeScroller = isMobile ? window : '[data-scroll-container]';

  
  let scene, camera, renderer, particlesGeometry, particlesMaterial, particleSystem;
  const mouse = { x: 0, y: 0 };
  const particleCount = isMobile ? 500 : 1200;

  function initWebGL() {
    const canvas = document.getElementById('webgl-canvas');
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const randomSpeeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 12;
      positions[i + 1] = (Math.random() - 0.5) * 12;
      positions[i + 2] = (Math.random() - 0.5) * 6;

      originalPositions[i] = positions[i];
      originalPositions[i + 1] = positions[i + 1];
      originalPositions[i + 2] = positions[i + 2];

      randomSpeeds[i] = (Math.random() - 0.5) * 0.1;
      randomSpeeds[i + 1] = Math.random() * 0.05 + 0.01;
      randomSpeeds[i + 2] = (Math.random() - 0.5) * 0.1;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvasTexture = document.createElement('canvas');
    canvasTexture.width = 16;
    canvasTexture.height = 16;
    const ctx = canvasTexture.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const texture = new THREE.CanvasTexture(canvasTexture);

    particlesMaterial = new THREE.PointsMaterial({
      size: 0.045,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);

    if (!isMobile) {
      window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      });
    }

    animateParticles(originalPositions, randomSpeeds);
  }

  let clock = new THREE.Clock();
  function animateParticles(originalPositions, randomSpeeds) {
    requestAnimationFrame(() => animateParticles(originalPositions, randomSpeeds));

    const time = clock.getElapsedTime();
    const positions = particlesGeometry.attributes.position.array;

    const mouseWorldX = mouse.x * 6;
    const mouseWorldY = mouse.y * 4;

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i + 1] += randomSpeeds[i + 1] * 0.1;
      
      if (isMobile) {
        positions[i] = originalPositions[i] + Math.sin(time + positions[i + 1]) * 0.25;
      } else {
        positions[i] += Math.sin(time + originalPositions[i]) * 0.0015;
      }

      if (positions[i + 1] > 6) {
        positions[i + 1] = -6;
      }

      if (!isMobile) {
        const dx = positions[i] - mouseWorldX;
        const dy = positions[i + 1] - mouseWorldY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1.8) {
          const force = (1.8 - dist) * 0.08;
          positions[i] += (dx / dist) * force;
          positions[i + 1] += (dy / dist) * force;
        } else {
          positions[i] += (originalPositions[i] - positions[i]) * 0.02;
        }
      }
    }

    particlesGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }

  try {
    initWebGL();
  } catch (e) {
    console.error("Three.js WebGL initialization failed:", e);
  }

  window.addEventListener('resize', () => {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });

  
  const heroTl = gsap.timeline();
  const splitChars = document.querySelectorAll('#hero-name .char');
  
  heroTl.to('#hero-greeting', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 })
        .to(splitChars, {
          opacity: 1,
          y: 0,
          stagger: 0.03,
          duration: 0.6,
          ease: 'power3.out'
        }, '-=0.4')
        .to('#hero-status', { opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.2')
        .to('#hero-ctas', { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' }, '-=0.4');

  
  
  
  gsap.to('#scroll-progress', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: isMobile ? 'body' : '[data-scroll-container]',
      start: 'top top',
      end: 'bottom bottom',
      scroller: activeScroller,
      scrub: true
    }
  });

  gsap.to('#header', {
    scrollTrigger: {
      trigger: '#home',
      start: 'bottom top+=100',
      scroller: activeScroller,
      toggleActions: 'play none none reverse'
    },
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '1rem',
    paddingBottom: '1rem'
  });


      // Experience timeline animations
      const timelineLine = document.querySelector('.timeline-line');
      if (timelineLine) {
        gsap.to(timelineLine, {
          scaleY: 1,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#experience',
            start: 'top 75%',
            scroller: activeScroller
          }
        });
      }

      const timelineItems = document.querySelectorAll('.timeline-item');
      timelineItems.forEach(item => {
        const marker = item.querySelector('.timeline-marker');
        const cardWrapper = item.querySelector('.timeline-card-wrapper');

        gsap.fromTo(marker, 
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
              scroller: activeScroller
            }
          }
        );

        gsap.to(cardWrapper, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 75%',
            scroller: activeScroller
          }
        });
      });



      
      const skillCategories = document.querySelectorAll('.skills-category-wrapper');
      skillCategories.forEach((cat, index) => {
        const title = cat.querySelector('h3');
        const marquee = cat.querySelector('.marquee-container');
        const line = cat.querySelector('.hr-line');
        const slideDir = index % 2 === 0 ? -50 : 50;

        gsap.from(title, {
          scrollTrigger: {
            trigger: cat,
            start: 'top 90%',
            scroller: activeScroller
          },
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out'
        });

        gsap.to(line, {
          scrollTrigger: {
            trigger: cat,
            start: 'top 90%',
            scroller: activeScroller
          },
          scaleX: 1,
          duration: 0.8,
          ease: 'power2.out'
        });

        gsap.from(marquee, {
          scrollTrigger: {
            trigger: cat,
            start: 'top 90%',
            scroller: activeScroller
          },
          x: slideDir,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out'
        });
      });

      gsap.to('#projects-header', {
        scrollTrigger: {
          trigger: '#projects',
          start: 'top 85%',
          end: 'top 40%',
          scroller: activeScroller,
          scrub: true
        },
        color: '#ffffff',
        webkitTextStroke: '1px transparent'
      });

      gsap.to('#footer-line', {
        scrollTrigger: {
          trigger: 'footer',
          start: 'top 99%',
          scroller: activeScroller
        },
        scaleX: 1,
        duration: 0.8,
        ease: 'power2.inOut'
      });

  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  sections.forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      scroller: activeScroller,
      start: 'top 30%',
      end: 'bottom 30%',
      onToggle: (self) => {
        if (self.isActive) {
          const currentId = section.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
          });
        }
      }
    });
  });

  
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  let menuOpen = false;

  function toggleMenu() {
    menuOpen = !menuOpen;
    if (menuOpen) {
      mobileMenu.classList.remove('translate-x-full');
      
      menuBtn.children[0].style.transform = 'rotate(45deg) translateY(2px)';
      menuBtn.children[1].style.opacity = '0';
      menuBtn.children[2].style.transform = 'rotate(-45deg) translateY(-2px)';

      gsap.fromTo(mobileNavLinks, 
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out', delay: 0.2 }
      );
    } else {
      mobileMenu.classList.add('translate-x-full');
      
      menuBtn.children[0].style.transform = 'none';
      menuBtn.children[1].style.opacity = '1';
      menuBtn.children[2].style.transform = 'none';
    }
  }

  menuBtn.addEventListener('click', toggleMenu);
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu();
      const target = link.getAttribute('href');
      
      if (isMobile) {
        document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
      } else {
        scroller.scrollTo(document.querySelector(target));
      }
    });
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href');
      if (isMobile) {
        document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
      } else {
        scroller.scrollTo(document.querySelector(target));
      }
    });
  });

  
  if (!isMobile && scroller) {
    setTimeout(() => {
      scroller.update();
      ScrollTrigger.refresh();
    }, 500);
  }

});

