import Link from 'next/link';
import TextPressure from '@/components/ui/text-pressure';
import Aurora from '@/components/ui/aurora';
import { Button } from '@/components/ui/button';
import ShinyText from '@/components/ui/shiny-text';
import Spline from '@splinetool/react-spline/next';

export default function Home() {
  return (
    <div className="h-full w-full flex flex-col justify-start items-center overflow-hidden">
      <Aurora
        colorStops={['#3A29FF', '#FF94B4', '#FF3232']}
        blend={0.8}
        amplitude={1.0}
        speed={0.8}
      />
      <div className="relative w-[500px] mb-4">
        <TextPressure
          text="Tidal"
          flex={true}
          alpha={false}
          stroke={true}
          width={true}
          weight={true}
          italic={false}
          textColor="#ffffff"
          strokeColor="#000"
          minFontSize={36}
        />
        <div className="text-sm mx-auto w-full text-white px-2 mt-2 mb-6">
          <ShinyText
            text="Tidal is an AI conversation program developed by UPA.Ride the wave of AI-driven dialogue, where natural intelligence
            meets human curiosity."
            disabled={false}
            speed={6}
            className="text-center"
          />
        </div>
        <div className="w-full grid grid-cols-2 gap-8 p-2">
          <Button className="cursor-pointer rounded-2xl bg-neutral-200 text-black duration-200 font-semibold hover:bg-neutral-400">
            <Link href="/login">点击登陆</Link>
          </Button>
          <Button className="cursor-pointer rounded-2xl bg-transparent border-neutral-200 text-neutral-200 border duration-200 font-semibold hover:bg-neutral-400">
            <Link href="/chat">跳转首页(dev)</Link>
          </Button>
        </div>
      </div>
      <Spline
        scene="https://prod.spline.design/pzGcrPnlOYjOBAQi/scene.splinecode"
        className="absolute bottom-0 left-0 right-0 z-[-1] h-[45%]!"
      />
    </div>
  );
}
