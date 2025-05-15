// Este arquivo ajuda a criar um som de erro sintético através do Web Audio API
// Execute este script no console do navegador para gerar e salvar o arquivo de áudio de erro

function generateErrorSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const duration = 0.5;  // duração em segundos
  
  // Osciladores para criar um som de erro característico
  const oscillator1 = audioContext.createOscillator();
  oscillator1.type = 'sine';
  oscillator1.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator1.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + duration);
  
  const oscillator2 = audioContext.createOscillator();
  oscillator2.type = 'sawtooth';
  oscillator2.frequency.setValueAtTime(380, audioContext.currentTime);
  oscillator2.frequency.exponentialRampToValueAtTime(180, audioContext.currentTime + duration);
  
  // Ganho para controlar o volume
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  
  // Conectar nós
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Iniciar osciladores
  oscillator1.start();
  oscillator2.start();
  
  // Parar osciladores após a duração
  oscillator1.stop(audioContext.currentTime + duration);
  oscillator2.stop(audioContext.currentTime + duration);
  
  // Converter para arquivo de áudio
  const offlineContext = new OfflineAudioContext(2, duration * audioContext.sampleRate, audioContext.sampleRate);
  
  const oscillator1Offline = offlineContext.createOscillator();
  oscillator1Offline.type = 'sine';
  oscillator1Offline.frequency.setValueAtTime(400, 0);
  oscillator1Offline.frequency.exponentialRampToValueAtTime(200, duration);
  
  const oscillator2Offline = offlineContext.createOscillator();
  oscillator2Offline.type = 'sawtooth';
  oscillator2Offline.frequency.setValueAtTime(380, 0);
  oscillator2Offline.frequency.exponentialRampToValueAtTime(180, duration);
  
  const gainNodeOffline = offlineContext.createGain();
  gainNodeOffline.gain.setValueAtTime(0.2, 0);
  gainNodeOffline.gain.exponentialRampToValueAtTime(0.001, duration);
  
  oscillator1Offline.connect(gainNodeOffline);
  oscillator2Offline.connect(gainNodeOffline);
  gainNodeOffline.connect(offlineContext.destination);
  
  oscillator1Offline.start();
  oscillator2Offline.start();
  
  oscillator1Offline.stop(duration);
  oscillator2Offline.stop(duration);
  
  offlineContext.startRendering().then(function(renderedBuffer) {
    // Converter o buffer em um Blob
    const wav = audioBufferToWav(renderedBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    
    // Criar um link para download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'error-sound.wav';
    a.click();
    
    URL.revokeObjectURL(url);
  });
}

// Função para converter AudioBuffer para WAV
// Nota: Esta é uma implementação simplificada, não é ideal para produção
function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2;
  const sampleRate = buffer.sampleRate;
  const output = new Uint8Array(44 + length);
  const channels = [];
  
  // Extrair dados de cada canal
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  // Escrever cabeçalho WAV
  writeString(output, 0, 'RIFF');
  output.set(uint32ToBytes(36 + length), 4);
  writeString(output, 8, 'WAVE');
  writeString(output, 12, 'fmt ');
  output.set(uint32ToBytes(16), 16);
  output.set(uint16ToBytes(1), 20);
  output.set(uint16ToBytes(numOfChan), 22);
  output.set(uint32ToBytes(sampleRate), 24);
  output.set(uint32ToBytes(sampleRate * 2 * numOfChan), 28);
  output.set(uint16ToBytes(numOfChan * 2), 32);
  output.set(uint16ToBytes(16), 34);
  writeString(output, 36, 'data');
  output.set(uint32ToBytes(length), 40);
  
  // Escrever dados PCM
  let position = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let j = 0; j < numOfChan; j++) {
      const sample = Math.max(-1, Math.min(1, channels[j][i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      output.set(uint16ToBytes(value + (value < 0 ? 0x10000 : 0)), position);
      position += 2;
    }
  }
  
  return output.buffer;
}

function writeString(output, offset, string) {
  for (let i = 0; i < string.length; i++) {
    output[offset + i] = string.charCodeAt(i);
  }
}

function uint16ToBytes(value) {
  return new Uint8Array([value & 0xFF, (value >> 8) & 0xFF]);
}

function uint32ToBytes(value) {
  return new Uint8Array([
    value & 0xFF,
    (value >> 8) & 0xFF,
    (value >> 16) & 0xFF,
    (value >> 24) & 0xFF
  ]);
}

// Para gerar e baixar o som de erro, execute:
// generateErrorSound();