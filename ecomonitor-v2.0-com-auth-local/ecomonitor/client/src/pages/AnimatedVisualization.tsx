import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { increment3DViews } from '@/hooks/useBadgeTracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface AnimationState {
  isPlaying: boolean;
  speed: number;
  time: number;
  simulationType: 'fire' | 'water' | 'pollution';
}

export default function AnimatedVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [state, setState] = useState<AnimationState>({
    isPlaying: false,
    speed: 1,
    time: 0,
    simulationType: 'fire',
  });

  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    increment3DViews();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth - 40, 600);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    scene.add(ground);
    groundRef.current = ground;

    // Particles system
    const particleCount = 2000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80; // x
      positions[i + 1] = Math.random() * 50; // y
      positions[i + 2] = (Math.random() - 0.5) * 80; // z

      colors[i] = 0.8; // r
      colors[i + 1] = 0.2; // g
      colors[i + 2] = 0.1; // b

      velocities[i] = (Math.random() - 0.5) * 0.3;
      velocities[i + 1] = Math.random() * 0.5;
      velocities[i + 2] = (Math.random() - 0.5) * 0.3;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Animation loop
    let lastTime = Date.now();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (state.isPlaying && particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array;
        const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;

        for (let i = 0; i < positions.length; i += 3) {
          // Update positions
          positions[i] += velocities[i] * state.speed * deltaTime * 10;
          positions[i + 1] += velocities[i + 1] * state.speed * deltaTime * 10;
          positions[i + 2] += velocities[i + 2] * state.speed * deltaTime * 10;

          // Reset if out of bounds
          if (positions[i + 1] > 60) {
            positions[i] = (Math.random() - 0.5) * 80;
            positions[i + 1] = 0;
            positions[i + 2] = (Math.random() - 0.5) * 80;
          }

          // Update colors based on simulation type
          const progress = positions[i + 1] / 60;
          if (state.simulationType === 'fire') {
            colors[i] = 0.8 + progress * 0.2; // r increases
            colors[i + 1] = 0.2 - progress * 0.2; // g decreases
            colors[i + 2] = 0.1; // b stays low
          } else if (state.simulationType === 'water') {
            colors[i] = 0.1; // r low
            colors[i + 1] = 0.5 + progress * 0.3; // g increases
            colors[i + 2] = 0.9; // b high
          } else if (state.simulationType === 'pollution') {
            colors[i] = 0.4 + progress * 0.2; // r increases
            colors[i + 1] = 0.4 + progress * 0.2; // g increases
            colors[i + 2] = 0.4 + progress * 0.2; // b increases
          }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.geometry.attributes.color.needsUpdate = true;

        setState((prev) => ({
          ...prev,
          time: (prev.time + deltaTime * prev.speed) % 100,
        }));
      }

      // Rotate scene
      if (scene) {
        scene.rotation.y += 0.0001;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth - 40;
      const height = 600;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [state.isPlaying, state.speed, state.simulationType]);

  const togglePlay = () => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);

    if (!soundEnabled && !audioContextRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = state.simulationType === 'fire' ? 'sine' : 'triangle';
      oscillator.frequency.value = state.simulationType === 'fire' ? 400 : 300;

      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();

      oscillatorRef.current = oscillator;
      gainRef.current = gain;
    } else if (soundEnabled && oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
      gainRef.current = null;
    }
  };

  const reset = () => {
    setState((prev) => ({ ...prev, time: 0, isPlaying: false }));
  };

  const typeLabels = {
    fire: '🔥 Propagação de Fogo',
    water: '💧 Fluxo Hídrico',
    pollution: '💨 Dispersão de Poluentes',
  };

  const typeColors = {
    fire: 'from-red-600 to-orange-600',
    water: 'from-blue-600 to-cyan-600',
    pollution: 'from-purple-600 to-pink-600',
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader className={`bg-gradient-to-r ${typeColors[state.simulationType]} text-white rounded-t-lg`}>
          <CardTitle>Visualização 3D Animada</CardTitle>
          <CardDescription className="text-gray-100">
            Veja a propagação em tempo real com controles interativos
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Canvas Container */}
          <div
            ref={containerRef}
            className="w-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden mb-6 border border-slate-700"
            style={{ height: '600px' }}
          />

          {/* Controls */}
          <div className="space-y-4">
            {/* Simulation Type */}
            <div>
              <label className="font-semibold mb-3 block">Tipo de Simulação</label>
              <div className="grid grid-cols-3 gap-2">
                {(['fire', 'water', 'pollution'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={state.simulationType === type ? 'default' : 'outline'}
                    onClick={() => setState((prev) => ({ ...prev, simulationType: type }))}
                    className="w-full"
                  >
                    {typeLabels[type]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex gap-2">
              <Button
                onClick={togglePlay}
                variant="default"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                {state.isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Reproduzir
                  </>
                )}
              </Button>
              <Button
                onClick={reset}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
              <Button
                onClick={toggleSound}
                variant={soundEnabled ? 'default' : 'outline'}
                size="sm"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Speed Control */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">Velocidade: {state.speed.toFixed(1)}x</label>
                <Badge variant="outline">{state.speed < 1 ? 'Lenta' : state.speed < 2 ? 'Normal' : 'Rápida'}</Badge>
              </div>
              <Slider
                min={0.1}
                max={3}
                step={0.1}
                value={[state.speed]}
                onValueChange={(val) => setState((prev) => ({ ...prev, speed: val[0] }))}
              />
            </div>

            {/* Progress Indicator */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${typeColors[state.simulationType]} transition-all`}
                style={{ width: `${(state.time / 100) * 100}%` }}
              />
            </div>

            {/* Status */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Como funciona</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {state.simulationType === 'fire'
                  ? 'As partículas vermelhas representam o fogo propagando-se através da paisagem, expandindo-se conforme a temperatura aumenta.'
                  : state.simulationType === 'water'
                  ? 'As partículas azuis representam o fluxo de água, mostrando como a água se dispersa e se move pelo terreno.'
                  : 'As partículas cinzas representam poluentes sendo dispersos pela atmosfera, sob influência do vento e estabilidade atmosférica.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
          <CardTitle>Sobre a Visualização 3D</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">🔥 Fogo</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Partículas avançam para cima e para os lados, simulando a rápida propagação do fogo com aumento de temperatura.
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">💧 Água</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Partículas fluem para cima, representando infiltração e ciclo hidrológico com dispersão uniforme.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-2">💨 Poluição</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Partículas dispersam-se gradualmente, mostrando como contaminantes se distribuem pela atmosfera ao longo do tempo.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎮 Controles Interativos</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• <strong>Play/Pause:</strong> Controla a simulação</li>
              <li>• <strong>Reiniciar:</strong> Reseta a simulação para o início</li>
              <li>• <strong>Velocidade:</strong> Acelera ou desacelera a propagação (0.1x a 3x)</li>
              <li>• <strong>Som:</strong> Ativa/desativa feedback sonoro baseado no tipo de simulação</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
