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

    // Create particles with different colors and sizes
    const particlesGeometry = new THREE.BufferGeometry();
    const count = 3000;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Professional placement company color palette
    const colorOptions = [
      new THREE.Color(0x0078D4), // Corporate blue
      new THREE.Color(0x004E8C), // Dark blue
      new THREE.Color(0x50C878), // Professional green
      new THREE.Color(0x696969), // Dim gray
      new THREE.Color(0x4682B4), // Steel blue
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

      // Random size
      sizes[i] = Math.random() * 0.05 + 0.01;
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

    // Custom shader material for particles
    const particlesMaterial = new THREE.ShaderMaterial({
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
          
          gl_FragColor = vec4(vColor, 1.0 - dist * 2.0);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Add orbital ring
    const ringGeometry = new THREE.RingGeometry(4, 4.2, 80);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x0078D4, // Corporate blue
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Add second orbital ring
    const ring2Geometry = new THREE.RingGeometry(6, 6.1, 90);
    const ring2Material = new THREE.MeshBasicMaterial({
      color: 0x50C878, // Professional green
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 6;
    scene.add(ring2);

    camera.position.z = 8;

    // Mouse movement effect
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    // Animate particles
    const clock = new THREE.Clock();
    
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      requestAnimationFrame(animate);

      // Smooth camera movement following mouse
      targetX = mouseX * 0.15;
      targetY = mouseY * 0.1;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Rotate particles
      particles.rotation.y = elapsedTime * 0.05;
      particles.rotation.x = elapsedTime * 0.025;
      
      // Rotate rings
      ring.rotation.z = elapsedTime * 0.2;
      ring2.rotation.z = -elapsedTime * 0.1;

      // Pulse effect for rings
      ring.scale.set(
        1 + Math.sin(elapsedTime) * 0.1,
        1 + Math.sin(elapsedTime) * 0.1,
        1
      );
      
      ring2.scale.set(
        1 + Math.sin(elapsedTime * 0.5) * 0.1,
        1 + Math.sin(elapsedTime * 0.5) * 0.1,
        1
      );

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

  // GSAP animations
  useEffect(() => {
    const tl = gsap.timeline();

    // Initial animations when page loads
    tl.from(welcomeTextRef.current, {
      duration: 1.2,
      y: -80,
      opacity: 0,
      ease: "back.out(1.4)",
      delay: 0.5,
    })
      .from(
        descriptionRef.current,
        {
          duration: 1,
          y: -30,
          opacity: 0,
          ease: "power3.out",
        },
        "-=0.7"
      )
      .from(
        loginBtnRef.current,
        {
          duration: 0.8,
          opacity: 0,
          ease: "power3.out",
        },
        "-=0.5"
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
    
    // Create subtle pulse for the welcome text
    gsap.to(welcomeTextRef.current, {
      duration: 2,
      filter: "brightness(1.05)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    
  }, []);

  const handleLoginClick = () => {
    // Navigate to jobs page
    router.push("/login");
  };

  // Remove button hover effects function
  const handleButtonHover = (isHovering) => {
    setIsHovering(isHovering);
    // No animations on hover
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-red-500">
      {/* Three.js Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-0"
      />

      {/* Overlay gradient for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-50 z-5"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1
          ref={welcomeTextRef}
          className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
        >
          Welcome to <span className="text-blue-400 font-extrabold">CareerConnect</span>
        </h1>

        <p
          ref={descriptionRef}
          className="text-xl md:text-2xl text-gray-300 max-w-xl mb-12"
        >
          Find your dream job and connect with top employers through our professional placement services.
        </p>

        <button
          ref={loginBtnRef}
          onClick={handleLoginClick}
          className="bg-blue-500 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg shadow-blue-500/30"
        >
          Explore Opportunities
        </button>

        <div ref={signupTextRef} className="mt-8 text-gray-300 text-lg">
          Are you an employer?{" "}
          <Link href="" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-300">
            Post a job opening
          </Link>
        </div>
      </div>
    </div>
  );
}