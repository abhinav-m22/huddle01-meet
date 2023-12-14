import '@/styles/globals.css';

import { HuddleClient, HuddleProvider } from '@huddle01/react';

const huddleClient = new HuddleClient({
  projectId: 'zMQHa6hH5hGrxfwYZp7z8I-1lWScI7UA',
  options: {
    activeSpeakers: {
      size: 8,
    },
  },
});

export default function App({ Component, pageProps }) {
  return (
    <HuddleProvider client={huddleClient}>
      <Component {...pageProps} />
    </HuddleProvider>
  );
}
