// GameList.tsx
import { useState, useEffect, useMemo } from "react";
import { FaSteam, FaClock } from 'react-icons/fa';
import { PanelSection, PanelSectionRow, DialogButton, Focusable, Field, Dropdown } from '@decky/ui';
import { callable } from "@decky/api";
import useHltb from '../hooks/useHltb';

// This function calls the python function to get the Steam library
const getSteamLibrary = callable<[], Array<{appid: string, name: string, library_path: string}>>("get_steam_library");

interface Game {
  appid: string;
  name: string;
  library_path: string;
  playtime_forever?: number;
}

// Updated GameWithHltb component that reports data back to parent
const GameWithHltbSorting = ({ 
  game, 
  onHltbDataUpdate 
}: { 
  game: Game; 
  onHltbDataUpdate: (appid: string, mainHours: number) => void;
}) => {
  const hltbData = useHltb(parseInt(game.appid), game.name, true);
  const [showDetails, setShowDetails] = useState(false);
  
  // Helper function to parse time strings to hours
  const parseTimeToHours = (timeString: string): number => {
    if (!timeString || timeString === '--') return 0;
    
    const cleanString = timeString.replace(/Hours?/i, '').trim();
    
    if (cleanString.includes('½')) {
      const baseHours = parseFloat(cleanString.replace('½', ''));
      return baseHours + 0.5;
    }
    
    const hours = parseFloat(cleanString);
    return isNaN(hours) ? 0 : hours;
  };

  // Report HLTB data back to parent when it becomes available
  useEffect(() => {
    if (hltbData?.mainStat && hltbData.mainStat !== '--') {
      const mainHours = parseTimeToHours(hltbData.mainStat);
      onHltbDataUpdate(game.appid, mainHours);
    }
  }, [hltbData?.mainStat, game.appid, onHltbDataUpdate]);
  
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

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gamesWithHltbData, setGamesWithHltbData] = useState<(Game & { hltbMainHours?: number })[]>([]);
  const [sortBy, setSortBy] = useState<'time-asc' | 'time-desc'>('time-asc');

  // Define dropdown options
  const sortOptions = [
    { label: 'Shortest First', data: 'time-asc' },
    { label: 'Longest First', data: 'time-desc' }
  ];

  useEffect(() => {
    const loadGames = async () => {
      try {
        const result = await getSteamLibrary();
        if (result && result.length > 0) {
          setGames(result);
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

  // Update games with HLTB data when games change
  useEffect(() => {
    if (games.length === 0) return;
    setGamesWithHltbData(games.map(game => ({ ...game })));
  }, [games]);

  // Sort games based on the selected option
  const sortedGames = useMemo(() => {
    const gamesToSort = [...gamesWithHltbData];
    
    switch (sortBy) {
      case 'time-asc':
        return gamesToSort.sort((a, b) => {
          const timeA = a.hltbMainHours || 0;
          const timeB = b.hltbMainHours || 0;
          // Put games with no time data at the end
          if (timeA === 0 && timeB === 0) return a.name.localeCompare(b.name);
          if (timeA === 0) return 1;
          if (timeB === 0) return -1;
          return timeA - timeB;
        });
      
      case 'time-desc':
        return gamesToSort.sort((a, b) => {
          const timeA = a.hltbMainHours || 0;
          const timeB = b.hltbMainHours || 0;
          // Put games with no time data at the end
          if (timeA === 0 && timeB === 0) return a.name.localeCompare(b.name);
          if (timeA === 0) return 1;
          if (timeB === 0) return -1;
          return timeB - timeA;
        });
      
      default:
        return gamesToSort.sort((a, b) => {
          const timeA = a.hltbMainHours || 0;
          const timeB = b.hltbMainHours || 0;
          if (timeA === 0 && timeB === 0) return a.name.localeCompare(b.name);
          if (timeA === 0) return 1;
          if (timeB === 0) return -1;
          return timeA - timeB;
        });
    }
  }, [gamesWithHltbData, sortBy]);

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
    <PanelSection title="Your Steam Library">
      
      {/* Sort Dropdown */}
      <PanelSectionRow>
        
          <Dropdown
            rgOptions={sortOptions}
            selectedOption={sortOptions.find(option => option.data === sortBy) || sortOptions[0]}
            onChange={(option) => setSortBy(option.data as 'time-asc' | 'time-desc')}
            menuLabel="Sort by completion time"
            strDefaultLabel="Sort by completion time"
          />

      </PanelSectionRow>
      
      {sortedGames.map((game) => (
        <GameWithHltbSorting 
          key={game.appid} 
          game={game} 
          onHltbDataUpdate={(appid, mainHours) => {
            setGamesWithHltbData(prev => 
              prev.map(g => 
                g.appid === appid 
                  ? { ...g, hltbMainHours: mainHours }
                  : g
              )
            );
          }}
        />
      ))}
    </PanelSection>
  );
}