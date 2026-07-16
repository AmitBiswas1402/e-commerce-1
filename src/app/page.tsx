import HeroSectionBanners from "@/components/HeroSectionBanners";
import Featuring from "@/components/Featuring";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Banner Slider */}
      <div className="w-full max-w-7xl mb-10">
        <HeroSectionBanners />
      </div>

      {/* Featured Products Section */}
      <div className="w-full max-w-7xl">
        <Featuring />
      </div>
    </div>
  );
}
