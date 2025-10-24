import React from "react";
import Person from "../../components/objects/Person";
import PersonRoute from "../../components/objects/PersonRoute";
import { useDevSettings } from "../../stores/useDevSettings";

interface NPCProps {
  npc: {
    id: string;
    name: string;
    dialogId: string;
    position: [number, number, number];
    route: [number, number, number][];
    text: string;
    color: string;
    modelURL: string;
    map: number;
    prerequisiteNpcId: string | null;
    isUnlocked: boolean;
    isCompleted: boolean;
  };
  mapId: string;
  onComplete?: () => void;
}

export default function NPC({ npc, mapId, onComplete }: NPCProps) {
  const { isUnlocked, isCompleted } = npc;
  const { showPersonRoute } = useDevSettings();
  
  return (
    <>
      <Person 
        npc={{
          ...npc,
          isUnlocked,
          isCompleted,
          onComplete
        }}
        mapId={mapId}
      />
      {showPersonRoute && <PersonRoute npc={npc} />}
    </>
  );
}
