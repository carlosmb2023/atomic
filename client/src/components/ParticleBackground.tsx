import { useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

export default function ParticleBackground() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      className="fixed top-0 left-0 w-full h-full z-[-10] overflow-hidden pointer-events-none"
      options={{
        fullScreen: false,
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 60,
        particles: {
          color: {
            value: ["#1677ff", "#e600ff", "#00ffe7", "#00e68a"],
          },
          links: {
            color: "#1677ff",
            distance: 150,
            enable: true,
            opacity: 0.3,
            width: 1,
          },
          collisions: {
            enable: false,
          },
          move: {
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: true,
            speed: 1,
            direction: "none",
            straight: false,
          },
          number: {
            density: {
              enable: true,
              value_area: 800,
            },
            value: 40,
          },
          opacity: {
            value: 0.5,
            random: true,
            animation: {
              enable: true,
              speed: 0.5,
              min_value: 0.1,
              sync: false,
            },
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 4 },
            random: true,
            animation: {
              enable: true,
              speed: 2,
              min_value: 0.1,
              sync: false,
            },
          },
        },
        detectRetina: true,
      }}
    />
  );
}
