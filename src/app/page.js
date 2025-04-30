"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { gsap } from "gsap";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const welcomeTextRef = useRef(null);
  const descriptionRef = useRef(null);
  const loginBtnRef = useRef(null);
  const signupTextRef = useRef(null);
  
  const [isHovering, setIsHovering] = useState(false);

  // Three.js setup
  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create particles with enhanced colors and sizes
    const particlesGeometry = new THREE.BufferGeometry();
    const count = 3000;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Enhanced color palette - more vibrant and cohesive
    const colorOptions = [
      new THREE.Color(0x007FFF), // Azure blue - more vibrant
      new THREE.Color(0x00BFFF), // Deep sky blue
      new THREE.Color(0x1E90FF), // Dodger blue
      new THREE.Color(0x6495ED), // Cornflower blue
      new THREE.Color(0x4169E1), // Royal blue
      new THREE.Color(0x38B0DE), // Ice blue
      new THREE.Color(0x0BB5FF), // High blue
    ];

    for (let i = 0; i < count; i++) {
      // Position
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 15;
      positions[i3 + 1] = (Math.random() - 0.5) * 15;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;

      // Random color from options
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Enhanced variable sizes
      sizes[i] = Math.random() * 0.07 + 0.02;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particlesGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );
    particlesGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(sizes, 1)
    );

    // Enhanced shader material for particles with better glow
    const particlesMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (350.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Enhanced glow effect
          float glow = 1.0 - dist * 1.8;
          gl_FragColor = vec4(vColor, glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Enhanced starfield background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 6000; // More stars
    
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starColors = new Float32Array(starCount * 3);
    
    // Star color variations
    const starColorOptions = [
      new THREE.Color(0xFFFFFF), // Pure white
      new THREE.Color(0xF8F7FF), // Snow white
      new THREE.Color(0xF0FFFF), // Azure white
      new THREE.Color(0xE6E6FA), // Lavender hint
      new THREE.Color(0xB0E0E6), // Powder blue hint
    ];
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      // Place stars farther away in a spherical distribution
      const radius = 50 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = radius * Math.cos(phi);
      
      // Enhanced variable star sizes
      starSizes[i] = Math.random() * 0.02 + 0.004;
      
      // Add subtle color variations to stars
      const starColor = starColorOptions[Math.floor(Math.random() * starColorOptions.length)];
      starColors[i3] = starColor.r;
      starColors[i3 + 1] = starColor.g;
      starColors[i3 + 2] = starColor.b;
    }
    
    starGeometry.setAttribute(
      "position", 
      new THREE.BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute(
      "size", 
      new THREE.BufferAttribute(starSizes, 1)
    );
    starGeometry.setAttribute(
      "color", 
      new THREE.BufferAttribute(starColors, 3)
    );
    
    const starMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Enhanced star glow
          float brightness = 1.0 - dist * 1.7;
          gl_FragColor = vec4(vColor, brightness);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    camera.position.z = 8;

    // Mouse movement effect with slightly enhanced sensitivity
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    // Animate particles and stars
    const clock = new THREE.Clock();
    
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      requestAnimationFrame(animate);

      // Smooth camera movement following mouse
      targetX = mouseX * 0.18; // Slightly more responsive
      targetY = mouseY * 0.12;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Rotate particles
      particles.rotation.y = elapsedTime * 0.05;
      particles.rotation.x = elapsedTime * 0.025;
      
      // Enhanced star animation
      stars.rotation.y = elapsedTime * 0.01;
      stars.rotation.x = Math.sin(elapsedTime * 0.005) * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Enhanced GSAP animations
  useEffect(() => {
    const tl = gsap.timeline();

    // Initial animations when page loads
    tl.from(welcomeTextRef.current, {
      duration: 1.4,
      y: -80,
      opacity: 0,
      ease: "back.out(1.6)",
      delay: 0.5,
    })
      .from(
        descriptionRef.current,
        {
          duration: 1.1,
          y: -30,
          opacity: 0,
          ease: "power3.out",
        },
        "-=0.8"
      )
      .from(
        loginBtnRef.current,
        {
          duration: 0.9,
          scale: 0.9,
          opacity: 0,
          ease: "power3.out",
        },
        "-=0.6"
      )
      .from(
        signupTextRef.current,
        {
          duration: 0.8,
          y: 20,
          opacity: 0,
          ease: "power2.out",
        },
        "-=0.5"
      );
    
    // Enhanced welcome text animation
    gsap.to(welcomeTextRef.current, {
      duration: 2.5,
      filter: "brightness(1.08)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    
    // Removed button pulse animation
    
  }, []);

  const handleLoginClick = () => {
    // Navigate to jobs page
    router.push("/login");
  };

  // Simplified button hover state handler without GSAP
  const handleButtonHover = (isHovering) => {
    setIsHovering(isHovering);
    // No GSAP animations here
  };

  return (
    <div className="relative min-h-screen  bg-black w-full overflow-hidden">
      {/* Three.js Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-0"
      />

      {/* Enhanced overlay gradient for better text visibility */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/20 to-black/60 opacity-60 z-5"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1
          ref={welcomeTextRef}
          className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg"
        >
          Welcome to <span className="text-blue-300 font-extrabold">Career Path</span>
        </h1>

        <p
          ref={descriptionRef}
          className="text-xl md:text-2xl text-white max-w-xl mb-12 drop-shadow-md"
        >
          Find your dream job and connect with top employers through our professional placement services.
        </p>

        <button
          
          onClick={handleLoginClick}
          onMouseEnter={() => handleButtonHover(true)}
          onMouseLeave={() => handleButtonHover(false)}
          className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-full text-lg shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300"
        >
          Explore Opportunities
        </button>

        <div ref={signupTextRef} className="mt-8 text-gray-300 text-lg">
        </div>
      </div>
    </div>
  );
}