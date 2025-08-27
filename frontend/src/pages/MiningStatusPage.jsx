import React, { useState, useEffect } from 'react';

const MiningStatusPage = ({ 
  initialTimeRemaining = 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  onToggleView,
  activeSessions = 1 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [binaryLines, setBinaryLines] = useState([]);
  const [gearRotation, setGearRotation] = useState(0);
  const [statusMessages, setStatusMessages] = useState([]);
  const [oilRigMotion, setOilRigMotion] = useState(0);

  // Generate random binary strings
  const generateBinaryLine = () => {
    const length = Math.floor(Math.random() * 15) + 25; // Shorter for mobile
    return Array(length).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('');
  };

  // Initialize binary lines
  useEffect(() => {
    const initialLines = Array(6).fill(0).map((_, index) => ({
      id: index,
      text: generateBinaryLine(),
      y: Math.random() * 100,
      speed: Math.random() * 1.5 + 0.5
    }));
    setBinaryLines(initialLines);
  }, []);

  // Initialize status messages
  useEffect(() => {
    const messages = [
      'CONNECTING TO MEMPOOL...',
      'SCANNING BLOCKCHAIN NODES...',
      'MINING ACTIVE',
      'REBROADCASTING TRANSACTIONS...',
      'PROCESSING BLOCKS...',
      'HASH VERIFICATION COMPLETE'
    ];
    
    let messageIndex = 0;
    const interval = setInterval(() => {
      setStatusMessages(prev => {
        const newMessage = {
          id: Date.now(),
          text: messages[messageIndex % messages.length],
          timestamp: new Date().toLocaleTimeString()
        };
        messageIndex++;
        return [newMessage, ...prev.slice(0, 4)]; // Keep last 5 messages
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Animate binary lines, gears, and oil rig
  useEffect(() => {
    const interval = setInterval(() => {
      // Update binary lines
      setBinaryLines(prev => prev.map(line => {
        let newY = line.y - line.speed;
        if (newY < -10) {
          newY = 110;
          return {
            ...line,
            y: newY,
            text: generateBinaryLine()
          };
        }
        return { ...line, y: newY };
      }));

      // Rotate gears
      setGearRotation(prev => (prev + 3) % 360);
      
      // Animate oil rig
      setOilRigMotion(prev => (prev + 1) % 100);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Format time display
  const formatTime = (ms) => {
    if (ms <= 0) return "00:00:00";
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Oil Rig Component
  const OilRigAnimation = () => (
    <div className="oil-rig-container">
      <div className="oil-rig">
        {/* Base platform */}
        <div className="rig-base"></div>
        
        {/* Tower structure */}
        <div className="rig-tower"></div>
        
        {/* Rotating gears */}
        <div className="gear gear-left" style={{ transform: `rotate(${gearRotation}deg)` }}>
          <div className="gear-teeth"></div>
          <div className="gear-center"></div>
        </div>
        <div className="gear gear-right" style={{ transform: `rotate(${-gearRotation}deg)` }}>
          <div className="gear-teeth"></div>
          <div className="gear-center"></div>
        </div>
        
        {/* Drilling mechanism */}
        <div 
          className="drill-mechanism" 
          style={{ transform: `translateY(${Math.sin(oilRigMotion * 0.3) * 8}px)` }}
        >
          <div className="drill-bit"></div>
          <div className="drill-cable"></div>
        </div>
        
        {/* Pumping arm */}
        <div 
          className="pumping-arm"
          style={{ transform: `rotate(${Math.sin(oilRigMotion * 0.2) * 15 - 10}deg)` }}
        >
          <div className="arm-base"></div>
          <div className="arm-extension"></div>
          <div className="pump-head"></div>
        </div>
        
        {/* Oil drops */}
        <div className="oil-drops">
          <div 
            className="oil-drop" 
            style={{ animationDelay: '0s', opacity: Math.sin(oilRigMotion * 0.1) > 0 ? 1 : 0 }}
          ></div>
          <div 
            className="oil-drop" 
            style={{ animationDelay: '0.5s', opacity: Math.sin(oilRigMotion * 0.1 + 1) > 0 ? 1 : 0 }}
          ></div>
          <div 
            className="oil-drop" 
            style={{ animationDelay: '1s', opacity: Math.sin(oilRigMotion * 0.1 + 2) > 0 ? 1 : 0 }}
          ></div>
        </div>
        
        {/* Status indicator */}
        <div className="rig-status">
          <div className="status-light active"></div>
          <div className="status-text">MINING</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mining-container">
      <style jsx>{`
        .mining-container {
          min-height: 100vh;
          background: #000000;
          color: #00ff00;
          font-family: 'Courier New', 'SF Mono', 'Monaco', monospace;
          overflow-x: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        .mining-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.02) 2px,
              rgba(0, 255, 0, 0.02) 4px
            );
          pointer-events: none;
          z-index: 1;
        }

        .header-section {
          padding: 15px 12px 10px 12px;
          border-bottom: 1px solid #00ff00;
          background: rgba(0, 255, 0, 0.05);
          position: relative;
          z-index: 10;
          text-align: left;
        }

        .header-section::before {
          content: '> MINING_STATUS.EXE';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: #00ff00;
          color: #000000;
          padding: 4px 12px;
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .mining-title {
          font-size: 16px;
          margin: 20px 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: bold;
          animation: terminalPulse 2s infinite;
        }

        .mining-title::before {
          content: '$ ';
          color: #00ff00;
        }

        .status-line {
          font-size: 11px;
          margin: 4px 0;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .status-line::before {
          content: '// ';
          color: #006600;
        }

        .sessions-info {
          position: absolute;
          top: 35px;
          right: 12px;
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          padding: 6px 10px;
          border-radius: 0;
          z-index: 15;
          font-size: 10px;
        }

        .sessions-info div {
          margin: 2px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .timer-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 15px;
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .notification-text {
          font-size: 12px;
          margin: 8px 0;
          color: #00ff00;
          text-transform: uppercase;
          letter-spacing: 1px;
          line-height: 1.4;
        }

        .timer-display {
          font-size: 2.8rem;
          font-weight: bold;
          color: #00ff00;
          margin: 20px 0;
          animation: glow 2s ease-in-out infinite alternate;
          text-shadow: 0 0 15px #00ff00;
          font-family: 'Courier New', monospace;
        }

        .mining-status {
          width: 100%;
          max-width: 350px;
          margin: 20px 0;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(0, 255, 0, 0.2);
          border: 1px solid #00ff00;
          border-radius: 0;
          margin: 15px 0;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #00ff00;
          border-radius: 0;
          animation: progress 4s ease-in-out infinite;
          box-shadow: 0 0 10px #00ff00;
        }

        /* Oil Rig Animation Styles */
        .oil-rig-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 25px 0;
          height: 120px;
        }

        .oil-rig {
          position: relative;
          width: 160px;
          height: 100px;
        }

        .rig-base {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 12px;
          background: linear-gradient(to bottom, #666, #333);
          border: 1px solid #00ff00;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }

        .rig-tower {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 60px;
          background: linear-gradient(to right, #555, #777, #555);
          border: 1px solid #00ff00;
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.4);
        }

        .gear {
          position: absolute;
          width: 24px;
          height: 24px;
          border: 2px solid #00ff00;
          border-radius: 50%;
          background: radial-gradient(circle, #333, #111);
          box-shadow: 0 0 12px rgba(0, 255, 0, 0.5);
        }

        .gear-left {
          top: 20px;
          left: 20px;
        }

        .gear-right {
          top: 20px;
          right: 20px;
        }

        .gear-teeth {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
        }

        .gear-teeth::before,
        .gear-teeth::after {
          content: '';
          position: absolute;
          width: 4px;
          height: 4px;
          background: #00ff00;
          border-radius: 1px;
        }

        .gear-teeth::before {
          top: -2px;
          left: 50%;
          transform: translateX(-50%);
          box-shadow: 
            0 26px 0 #00ff00,
            -12px 2px 0 #00ff00,
            12px 2px 0 #00ff00,
            -12px 22px 0 #00ff00,
            12px 22px 0 #00ff00;
        }

        .gear-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: #00ff00;
          border-radius: 50%;
          box-shadow: 0 0 6px #00ff00;
        }

        .drill-mechanism {
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 40px;
        }

        .drill-bit {
          width: 8px;
          height: 8px;
          background: #ff4444;
          border-radius: 50% 50% 0 0;
          margin: 0 auto 2px;
          box-shadow: 0 0 8px rgba(255, 68, 68, 0.6);
          animation: spin 0.5s linear infinite;
        }

        .drill-cable {
          width: 2px;
          height: 30px;
          background: #666;
          margin: 0 auto;
          border-left: 1px solid #00aa00;
        }

        .pumping-arm {
          position: absolute;
          top: 25px;
          right: 35px;
          transform-origin: bottom left;
          width: 30px;
          height: 3px;
        }

        .arm-base {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 6px;
          height: 6px;
          background: #666;
          border: 1px solid #00ff00;
          border-radius: 50%;
        }

        .arm-extension {
          position: absolute;
          bottom: 1px;
          left: 6px;
          width: 20px;
          height: 2px;
          background: linear-gradient(to right, #555, #777);
          border: 1px solid #00aa00;
        }

        .pump-head {
          position: absolute;
          bottom: -1px;
          right: 0;
          width: 4px;
          height: 4px;
          background: #00ff00;
          border-radius: 50%;
          box-shadow: 0 0 6px #00ff00;
        }

        .oil-drops {
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 20px;
        }

        .oil-drop {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #000;
          border: 1px solid #00ff00;
          border-radius: 50%;
          animation: dropFall 2s infinite;
        }

        .oil-drop:nth-child(1) { left: 2px; }
        .oil-drop:nth-child(2) { left: 8px; }
        .oil-drop:nth-child(3) { left: 14px; }

        .rig-status {
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-light {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ff0000;
        }

        .status-light.active {
          background: #00ff00;
          box-shadow: 0 0 8px #00ff00;
          animation: blink 1s infinite;
        }

        .status-text {
          font-size: 8px;
          color: #00ff00;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .status-log {
          background: rgba(0, 255, 0, 0.05);
          border: 1px solid #00aa00;
          margin: 20px 0;
          padding: 15px 12px;
          max-height: 120px;
          overflow-y: auto;
          font-size: 10px;
          text-align: left;
        }

        .status-log::-webkit-scrollbar {
          width: 4px;
        }

        .status-log::-webkit-scrollbar-track {
          background: #000000;
        }

        .status-log::-webkit-scrollbar-thumb {
          background: #00aa00;
        }

        .log-entry {
          margin: 3px 0;
          opacity: 0;
          animation: fadeIn 0.5s ease-in forwards;
          line-height: 1.3;
        }

        .log-entry.new {
          color: #00ff00;
        }

        .log-entry.old {
          color: #006600;
        }

        .log-timestamp {
          color: #666666;
          margin-right: 8px;
        }

        .binary-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          opacity: 0.15;
          z-index: 2;
        }

        .binary-line {
          position: absolute;
          left: 0;
          right: 0;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          color: #00ff00;
          white-space: nowrap;
          letter-spacing: 1px;
        }

        .controls-section {
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          background: #000000;
          border-top: 1px solid #00ff00;
          padding: 15px 12px;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn {
          background: #000000;
          border: 1px solid #00ff00;
          color: #00ff00;
          padding: 16px 20px;
          font-size: 13px;
          font-weight: bold;
          border-radius: 0;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.3s ease;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          -webkit-tap-highlight-color: transparent;
        }

        .btn:hover, .btn:focus {
          background: #00ff00;
          color: #000000;
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
          outline: none;
        }

        .btn:active {
          background: #00aa00;
          border-color: #00aa00;
        }

        .btn-secondary {
          background: #000000;
          color: #666666;
          border-color: #333333;
        }

        .btn-secondary:hover, .btn-secondary:focus {
          background: #111111;
          color: #00aa00;
          border-color: #00aa00;
          box-shadow: 0 0 10px rgba(0, 170, 0, 0.3);
        }

        .btn-row {
          display: flex;
          gap: 12px;
        }

        .btn-row .btn {
          flex: 1;
        }

        @keyframes terminalPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes glow {
          from { 
            text-shadow: 0 0 15px #00ff00, 0 0 25px #00ff00;
          }
          to { 
            text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00;
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes progress {
          0% { width: 5%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(0%); }
          100% { width: 5%; transform: translateX(1000%); }
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        @keyframes dropFall {
          0% { opacity: 0; transform: translateY(-5px); }
          50% { opacity: 1; transform: translateY(5px); }
          100% { opacity: 0; transform: translateY(15px); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Mobile landscape optimizations */
        @media (max-height: 500px) and (orientation: landscape) {
          .timer-section {
            padding: 10px 15px;
          }
          
          .timer-display {
            font-size: 2rem;
            margin: 10px 0;
          }

          .oil-rig-container {
            height: 80px;
            margin: 15px 0;
          }

          .oil-rig {
            height: 70px;
          }

          .status-log {
            max-height: 60px;
          }

          .controls-section {
            padding: 10px 12px;
          }
        }

        /* Very small screens */
        @media (max-width: 320px) {
          .timer-display {
            font-size: 2.2rem;
          }
          
          .mining-title {
            font-size: 14px;
          }
          
          .controls-section {
            padding: 12px 10px;
          }
        }

        /* Touch device optimizations */
        @media (pointer: coarse) {
          .btn {
            min-height: 52px;
            font-size: 14px;
          }
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Binary background animation */}
      <div className="binary-background">
        {binaryLines.map((line) => (
          <div
            key={line.id}
            className="binary-line"
            style={{ 
              top: `${line.y}%`,
              animationDelay: `${line.id * 0.3}s`
            }}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="header-section">
        <h1 className="mining-title">Mining Bot Active</h1>
        <div className="status-line">Operations: Running</div>
        <div className="status-line">Mode: Mempool Rebroadcast</div>

        {/* Sessions info */}
        <div className="sessions-info">
          <div>Sessions: {activeSessions}</div>
          <div>Status: LIVE</div>
        </div>
      </div>

      {/* Timer section */}
      <div className="timer-section">
        <div className="notification-text">
          Blockchain Mining in Progress
        </div>
        <div className="notification-text">
          Time Remaining:
        </div>
        <div className="timer-display">
          {formatTime(timeRemaining)}
        </div>

        <div className="mining-status">
          {/* Progress bar */}
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>

          {/* Oil Rig Animation */}
          <OilRigAnimation />
        </div>

        {/* Status log */}
        <div className="status-log">
          {statusMessages.map((message, index) => (
            <div 
              key={message.id} 
              className={`log-entry ${index === 0 ? 'new' : 'old'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="log-timestamp">[{message.timestamp}]</span>
              {message.text}
            </div>
          ))}
        </div>
      </div>

      {/* Controls - Fixed at bottom */}
      <div className="controls-section">
        <button 
          className="btn"
          onClick={() => {
            // Add monitoring functionality
          }}
        >
          <span>📊</span> Monitor Status
        </button>
        
        <div className="btn-row">
          <button 
            className="btn btn-secondary"
            onClick={onToggleView}
          >
            ➕ New Session
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              // Add pause functionality
            }}
          >
            ⏸️ Pause Mining
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiningStatusPage;