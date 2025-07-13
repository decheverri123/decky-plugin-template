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
import { FaShip, FaSteam, FaGamepad, FaClock } from 'react-icons/fa';
import useHltb from './hooks/useHltb';

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

function GameList() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const result = await getSteamLibrary();
        if (result && result.length > 0) {
          // Sort games alphabetically by name
          const sortedGames = [...result].sort((a, b) => a.name.localeCompare(b.name));
          setGames(sortedGames);
        } else {
          setError("No games found in your Steam library.");
        }
      } catch (err) {
        console.error("Error loading Steam library:", err);
        setError("Failed to load Steam library. Make sure Steam is running and you're logged in.");
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, []);

  if (isLoading) {
    return (
      <PanelSectionRow>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaSteam size={24} />
          <span>Loading your Steam library...</span>
        </div>
      </PanelSectionRow>
    );
  }

  const formatPlaytime = (minutes: number | undefined) => {
    if (!minutes) return 'No playtime';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (error) {
    return (
      <PanelSectionRow>
        <div style={{ color: 'red' }}>
          <p>{error}</p>
        </div>
      </PanelSectionRow>
    );
  }

  return (
    <>
      <PanelSectionRow>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <FaSteam size={24} />
          <h2>Your Steam Library</h2>
        </div>
      </PanelSectionRow>
      <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '0 10px' }}>
        {games.map((game) => (
          <PanelSectionRow key={game.appid}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <FaGamepad size={20} />
              <span style={{ flex: 1 }}>{game.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GameHltbTime appId={parseInt(game.appid)} appName={game.name} />
                <span style={{
                  fontSize: '0.8em',
                  color: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {game.appid}
                </span>
              </div>
            </div>
          </PanelSectionRow>
        ))}
      </div>
    </>
  );
}

function Content() {
  return (
    <PanelSection title="Steam Library">
      <GameList />
    </PanelSection>
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
