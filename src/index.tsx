import {
  PanelSection,
  PanelSectionRow,
  staticClasses
} from "@decky/ui";
import {
  addEventListener,
  removeEventListener,
  callable,
  definePlugin,
  toaster,
  // routerHook
} from "@decky/api"
import { useState, useEffect } from "react";
import { FaShip, FaSteam, FaClock, FaExternalLinkAlt } from 'react-icons/fa';
import { PanelSection, PanelSectionRow, DialogButton, Focusable, Field, Navigation } from '@decky/ui';
import useHltb from './hooks/useHltb';
import GameList from './components/GameList';

// This function calls the python function to get the Steam library
const getSteamLibrary = callable<[], Array<{appid: string, name: string, library_path: string}>>("get_steam_library");

interface Game {
  appid: string;
  name: string;
  library_path: string;
  playtime_forever?: number;
}

const GameHltbTime = ({ appId, appName }: { appId: number, appName: string }) => {
  const hltbData = useHltb(appId, appName, true);
  
  if (!hltbData || !hltbData.showStats || hltbData.mainStat === '--') {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.8em',
      color: 'rgba(255, 255, 255, 0.8)',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      padding: '2px 8px',
      borderRadius: '4px',
      whiteSpace: 'nowrap'
    }}>
      <FaClock size={12} />
      <span>{hltbData.mainStat}</span>
    </div>
  );
};

const GameWithHltb = ({ game }: { game: Game }) => {
  const hltbData = useHltb(parseInt(game.appid), game.name, true);
  const [showDetails, setShowDetails] = useState(false);
  
  // Only show the component if we have stats to display
  const hasStats = hltbData?.showStats && (
    hltbData.mainStat !== '--' || 
    hltbData.mainPlusStat !== '--' || 
    hltbData.completeStat !== '--' || 
    hltbData.allStylesStat !== '--'
  );

  if (!hasStats) return null;
  
 

  return (
    <PanelSectionRow>
      <div style={{ width: '100%' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: showDetails ? '10px' : 0,
          width: '100%'
        }}>
          <span style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.95em',
            fontWeight: 'bold'
          }}>
            {game.name}
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hltbData.mainStat !== '--' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.85em',
                color: 'rgba(255, 255, 255, 0.9)',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '4px 8px',
                borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}>
                <FaClock size={12} />
                <span>{hltbData.mainStat}</span>
              </div>
            )}
            
            <DialogButton 
              onClick={() => setShowDetails(!showDetails)}
              style={{
                padding: '4px 8px',
                minWidth: '32px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showDetails ? '−' : '+'}
            </DialogButton>
          </div>
        </div>
        
        {showDetails && (
          <div style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {hltbData.mainStat !== '--' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Main Story:</span>
                <span>{hltbData.mainStat}</span>
              </div>
            )}
            
            {hltbData.mainPlusStat !== '--' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Main + Extras:</span>
                <span>{hltbData.mainPlusStat}</span>
              </div>
            )}
            
            {hltbData.completeStat !== '--' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Completionist:</span>
                <span>{hltbData.completeStat}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </PanelSectionRow>
  );
};


function Content() {
  return (
   
      <GameList />
   
  );
};

export default definePlugin(() => {
  console.log("Template plugin initializing, this is called once on frontend startup")

  // serverApi.routerHook.addRoute("/decky-plugin-test", DeckyPluginRouterTest, {
  //   exact: true,
  // });

  // Add an event listener to the "timer_event" event from the backend
  const listener = addEventListener<[
    test1: string,
    test2: boolean,
    test3: number
  ]>("timer_event", (test1, test2, test3) => {
    console.log("Template got timer_event with:", test1, test2, test3)
    toaster.toast({
      title: "template got timer_event",
      body: `${test1}, ${test2}, ${test3}`
    });
  });

  return {
    // The name shown in various decky menus
    name: "Steam Beat",
    // The element displayed at the top of your plugin's menu
    titleView: <div className={staticClasses.Title}>Decky Example Plugin</div>,
    // The content of your plugin's menu
    content: <Content />,
    // The icon displayed in the plugin list
    icon: <FaShip />,
    // The function triggered when your plugin unloads
    onDismount() {
      console.log("Unloading")
      removeEventListener("timer_event", listener);
      // serverApi.routerHook.removeRoute("/decky-plugin-test");
    },
  };
});
