import { montreal, neueBitBold } from "@/lib/fonts";
import { Footer } from "@/components/footer";
export type ProvidersAndLayoutProps = {
  children: React.ReactNode;
}

export function ProvidersAndLayout(props: ProvidersAndLayoutProps) {

  const { children } = props;

  return (
    <div 
    className={`max-w-screen w-full min-h-screen p-4 ${montreal.className} bg-[#0C0F1D] bg-gradient-to-b from-[#0C0F1D80] to-[#97F0E580] from-[77.3%] flex flex-col text-[#F7F7F7] gap-4`}
    >
      <div
        className="relative h-max w-full flex flex-col items-center px-4 md:px-8 lg:px-10 pb-8 pt-8 border-[3px] border-[#99EFE4] rounded-xl overflow-hidden bg-[#090e1d]"
      >
        <div className="z-10">
          <div className="absolute top-0 left-0 right-0 px-2 sm:px-4 py-2 sm:py-4 flex flex-col gap-2 sm:flex-row items-center bg-gradient-to-b from-[#090e1d] from-60% via-[#090e1d]/80 via-75% to-transparent">
            <div className="flex flex-row gap-1 items-center w-full justify-center">
              <span className={`${neueBitBold.className} text-3xl sm:text-4xl`}>
                WALRUS
              </span>
              <span className={`${neueBitBold.className} text-3xl sm:text-4xl font-bold text-[#C684F6]`}>
                BLOB UPLOAD
              </span>
            </div>
          </div>
          {children}
        </div>
      </div>
      <Footer />
    </div>
  )
}