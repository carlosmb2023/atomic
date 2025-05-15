import React, { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  videoSource: string;
}

export default function VideoBackground({ videoSource }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Forçar o carregamento e reprodução do vídeo quando o componente montar
    if (videoRef.current) {
      const playVideo = async () => {
        try {
          // Carregar o vídeo
          videoRef.current?.load();
          // Iniciar a reprodução
          await videoRef.current?.play();
          console.log("🎥 Vídeo de fundo iniciado com sucesso");
        } catch (error) {
          console.error("❌ Erro ao reproduzir vídeo de fundo:", error);
        }
      };

      playVideo();
    }
    
    return () => {
      // Parar o vídeo quando o componente desmontar
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    };
  }, [videoSource]);

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[-10] overflow-hidden">
      <video
        ref={videoRef}
        className="absolute min-w-full min-h-full object-cover opacity-20"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={videoSource} type="video/mp4" />
        Seu navegador não suporta vídeos em HTML5.
      </video>
      {/* Overlay para escurecer o vídeo e melhorar a legibilidade do conteúdo */}
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-60"></div>
    </div>
  );
}