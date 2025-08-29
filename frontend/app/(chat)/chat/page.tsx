'use client';

import * as React from 'react';
import { Chat } from '@/components/chat';
import { getModels } from '@/lib/config/models';
import { Model } from '@/lib/types/models';

export default function ChatPage() {
  const [models, setModels] = React.useState<Model[]>([]);

  React.useEffect(() => {
    const loadModels = async () => {
      const loadedModels = await getModels();
      setModels(loadedModels);
    };
    loadModels();
  }, []);

  return <>{models.length > 0 && <Chat models={models} />}</>;
}
