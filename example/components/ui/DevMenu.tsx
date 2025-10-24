import React, { useState, useEffect, useRef } from "react";
import { ConnectionLinesMode, useDevSettings } from "../../stores/useDevSettings";
import { useLevelProgress } from "../../stores/useLevelProgress";

interface DevMenuProps {
  top?: boolean;
}

const DevMenu = ({ top }: DevMenuProps) => {
  const { 
    showGrid, 
    showPersonRoute, 
    connectionLinesMode, 
    allNpcIndependent, 
    showConnectionName,
    toggleGrid, 
    togglePersonRoute, 
    toggleConnectionLinesMode,
    toggleAllNpcIndependent,
    toggleShowConnectionName
  } = useDevSettings();
  const { syncProgress } = useLevelProgress();
  const [isExpanded, setIsExpanded] = useState(false);
  const prevAllNpcIndependent = useRef(allNpcIndependent);

  useEffect(() => {
    if (prevAllNpcIndependent.current !== allNpcIndependent) {
      console.log("🔄 allNpcIndependent changed, syncing progress...");
      syncProgress();
      prevAllNpcIndependent.current = allNpcIndependent;
    }
  }, [allNpcIndependent, syncProgress]);

  const toggleStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '14px',
  };

  const switchStyle = {
    position: 'relative' as const,
    display: 'inline-block',
    minWidth: '50px',
    height: '24px',
    marginRight: '10px',
  };

  const sliderStyle = (isOn: boolean) => ({
    position: 'absolute' as const,
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isOn ? '#4CAF50' : '#ccc',
    transition: '0.3s',
    borderRadius: '24px',
  });

  const sliderBeforeStyle = (isOn: boolean) => ({
    position: 'absolute' as const,
    content: '""',
    height: '18px',
    width: '18px',
    left: isOn ? '26px' : '3px',
    bottom: '3px',
    backgroundColor: 'white',
    transition: '0.3s',
    borderRadius: '50%',
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: top ? '20px' : '110px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        border: '2px solid #fff',
        borderRadius: '15px',
        padding: '10px',
        fontSize: '14px',
        zIndex: 1000,
        width: isExpanded ? '230px' : '120px',
        height: isExpanded ? '270px' : '40px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div style={{ 
        marginBottom: isExpanded ? '15px' : '0px', 
        fontWeight: 'bold', 
        textAlign: 'left',
        transition: 'margin-bottom 0.3s ease'
      }}>
        🛠️ Dev Menu
      </div>
      
      <div style={{
        opacity: isExpanded ? 1 : 0,
        transform: isExpanded ? 'translateY(0)' : 'translateY(-30px)',
        transition: 'all 0.3s ease',
        pointerEvents: isExpanded ? 'auto' : 'none',
        width: '210px',
      }}>
        <div style={toggleStyle}>
          <label style={switchStyle}>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={toggleGrid}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={sliderStyle(showGrid)}>
              <span style={sliderBeforeStyle(showGrid)}></span>
            </span>
          </label>
          <span>Show Grid</span>
        </div>

        <div style={toggleStyle}>
          <label style={switchStyle}>
            <input
              type="checkbox"
              checked={showPersonRoute}
              onChange={togglePersonRoute}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={sliderStyle(showPersonRoute)}>
              <span style={sliderBeforeStyle(showPersonRoute)}></span>
            </span>
          </label>
          <span>Show NPC Routes</span>
        </div>

        <div style={toggleStyle}>
          <label style={switchStyle}>
            <input
              type="checkbox"
              checked={connectionLinesMode === ConnectionLinesMode.HOVER}
              onChange={toggleConnectionLinesMode}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={sliderStyle(connectionLinesMode === ConnectionLinesMode.HOVER)}>
              <span style={sliderBeforeStyle(connectionLinesMode === ConnectionLinesMode.HOVER)}></span>
            </span>
          </label>
          <span>Lines on Hover</span>
        </div>

        <div style={toggleStyle}>
          <label style={switchStyle}>
            <input
              type="checkbox"
              checked={allNpcIndependent}
              onChange={toggleAllNpcIndependent}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={sliderStyle(allNpcIndependent)}>
              <span style={sliderBeforeStyle(allNpcIndependent)}></span>
            </span>
          </label>
          <span>All NPC Independent</span>
        </div>

        <div style={toggleStyle}>
          <label style={switchStyle}>
            <input
              type="checkbox"
              checked={showConnectionName}
              onChange={toggleShowConnectionName}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={sliderStyle(showConnectionName)}>
              <span style={sliderBeforeStyle(showConnectionName)}></span>
            </span>
          </label>
          <span>Show Connection Name or NPC Name</span>
        </div>
      </div>
    </div>
  );
};

export default DevMenu;
