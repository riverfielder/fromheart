import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F6F7F9]">
      <div className="w-full max-w-sm bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-8 flex flex-col items-center text-center space-y-6">
        
        {/* Decorative Bagua Background */}
        <div className="absolute inset-0 bg-[url('/bagua.svg')] bg-no-repeat bg-center opacity-[0.03] bg-[length:80%] pointer-events-none" />

        <div className="relative z-10 w-20 h-20 opacity-80">
            <Image 
                src="/logo.svg" 
                alt="Logo" 
                fill
                className="object-contain grayscale"
            />
        </div>

        <div className="relative z-10 space-y-2">
            <h2 className="text-xl font-serif text-stone-800 tracking-widest font-medium">
                勿探天机
            </h2>
            <p className="text-xs text-stone-500 font-serif leading-relaxed">
                缘分未到，不必强求。<br/>
                心诚则灵，随遇而安。
            </p>
        </div>

        <Link 
            href="/"
            className="relative z-10 px-8 py-2.5 rounded-full bg-emerald-800/90 text-white text-xs tracking-widest hover:bg-emerald-900 transition-colors shadow-lg shadow-emerald-900/20"
        >
            返回问道
        </Link>

        {/* Footer decoration */}
        <div className="absolute bottom-4 text-[10px] text-stone-300 font-serif tracking-[0.2em]">
            FROM HEART
        </div>
      </div>
    </div>
  );
}
