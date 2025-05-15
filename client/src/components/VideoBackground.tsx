import React from 'react';

interface VideoBackgroundProps {
  videoSource: string;
}

export default function VideoBackground({ videoSource }: VideoBackgroundProps) {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-[-10] overflow-hidden">
      <video
        className="absolute min-w-full min-h-full object-cover opacity-20"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={videoSource} type="video/mp4" />
        Seu navegador não suporta vídeos em HTML5.
      </video>
      {/* Overlay para escurecer o vídeo e melhorar a legibilidade do conteúdo */}
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-60"></div>
    </div>
  );
}