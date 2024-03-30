import ChatBox from '@/component/ChatBox/ChatBox';
import RemotePeer from '@/component/RemotePeer/RemotePeer';
import {
  useLocalAudio,
  useLocalPeer,
  useLocalScreenShare,
  useLocalVideo,
  usePeerIds,
  useRoom,
} from '@huddle01/react/hooks';
import { AccessToken, Role } from '@huddle01/server-sdk/auth';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { FaVideo, FaMicrophone, FaDesktop, FaVideoSlash, FaMicrophoneSlash, FaStopCircle, FaCircle } from 'react-icons/fa';

const inter = Inter({ subsets: ['latin'] });

export default function Home({ token }) {
  const [displayName, setDisplayName] = useState('');
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);

  const { joinRoom, state } = useRoom({
    onJoin: (room) => {
      console.log('onJoin', room);
      updateMetadata({ displayName });
    },
    onPeerJoin: (peer) => {
      console.log('onPeerJoin', peer);
    },
  });
  const { enableVideo, isVideoOn, stream, disableVideo } = useLocalVideo();
  const { enableAudio, disableAudio, isAudioOn } = useLocalAudio();
  const { startScreenShare, stopScreenShare, shareStream } =
    useLocalScreenShare();
  const { updateMetadata } = useLocalPeer();
  const { peerIds } = usePeerIds();

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (shareStream && screenRef.current) {
      screenRef.current.srcObject = shareStream;
    }
  }, [shareStream]);

  return (
<main className={`flex min-h-screen flex-col items-center p-4 ${inter.className}`}>
  <div className="max-w-5xl w-full flex flex-col items-center justify-between font-mono text-sm lg:flex-row lg:justify-between">
    <p className="fixed top-0 left-0 w-full bg-gradient-to-b from-zinc-200 dark:bg-zinc-800/30 border-b border-gray-300 pb-6 pt-8 text-center font-bold dark:text-white lg:relative lg:w-auto lg:border lg:rounded-xl lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
      {state}
    </p>
    <div className="fixed bottom-0 left-0 w-full flex flex-col items-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:relative lg:flex-row lg:h-auto lg:w-auto lg:bg-none">
      {state === 'idle' && (
        <>
          <input
            disabled={state !== 'idle'}
            placeholder="Display Name"
            type="text"
            className="border-2 border-blue-400 rounded-lg p-2 mx-2 bg-black text-white mb-2 lg:mb-0 lg:mr-2 lg:w-64"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />

          <button
            disabled={!displayName}
            type="button"
            className="bg-blue-500 p-2 mx-2 rounded-lg lg:w-32"
            onClick={async () => {
              await joinRoom({
                roomId: router.query.roomId,
                token,
              });
            }}
          >
            Join Room
          </button>
        </>
      )}

      {state === 'connected' && (
        <div className="flex justify-center items-center space-x-4 mb-2 lg:mb-0 lg:mr-2">
          <button
            className="bg-blue-500 p-2 rounded-lg"
            onClick={async () => {
              isVideoOn ? await disableVideo() : await enableVideo();
            }}
          >
            {isVideoOn ? <FaVideoSlash /> : <FaVideo />}
          </button>
          <button
            className="bg-blue-500 p-2 rounded-lg"
            onClick={async () => {
              isAudioOn ? await disableAudio() : await enableAudio();
            }}
          >
            {isAudioOn ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <button
            className="bg-blue-500 p-2 rounded-lg"
            onClick={async () => {
              shareStream
                ? await stopScreenShare()
                : await startScreenShare();
            }}
          >
            {shareStream ? <FaDesktop /> : <FaCircle />}
          </button>
          <button
            className="bg-blue-500 p-2 rounded-lg"
            onClick={async () => {
              const status = isRecording
                ? await fetch(`/api/stopRecording?roomId=${router.query.roomId}`)
                : await fetch(`/api/startRecording?roomId=${router.query.roomId}`);

              const data = await status.json();
              console.log({ data });
              setIsRecording(!isRecording);
            }}
          >
            {isRecording ? <FaStopCircle /> : <FaCircle />}
          </button>
        </div>
      )}
    </div>
  </div>

  <div className="w-full mt-8 flex flex-col lg:flex-row lg:justify-between">
    <div className="flex-1 flex flex-col items-center lg:items-stretch lg:flex-row lg:justify-between">
      <div className="">
        <div className="relative flex gap-2">
          {isVideoOn && (
            <div className=" mx-auto border-2 rounded-xl border-blue-400">
              <video ref={videoRef} className="aspect-video rounded-xl" autoPlay muted />
            </div>
          )}
          {shareStream && (
            <div className="mx-auto border-2 rounded-xl border-blue-400">
              <video ref={screenRef} className="aspect-video rounded-xl" autoPlay muted />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 lg:mt-0 mb-32 grid gap-2 text-center">
        {peerIds.map((peerId) =>
          peerId ? <RemotePeer key={peerId} peerId={peerId} /> : null
        )}
      </div>
    </div>
    {state === 'connected' && <ChatBox />}
  </div>
</main>

  );
}

export const getServerSideProps = async (ctx) => {
  const accessToken = new AccessToken({
    apiKey: process.env.API_KEY,
    roomId: ctx.params.roomId,

    role: Role.HOST,
    permissions: {
      admin: true,
      canConsume: true,
      canProduce: true,
      canProduceSources: {
        cam: true,
        mic: true,
        screen: true,
      },
      canRecvData: true,
      canSendData: true,
      canUpdateMetadata: true,
    },
  });

  const token = await accessToken.toJwt();

  console.log(token);

  return {
    props: { token },
  };
};
