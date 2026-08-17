import { Header } from "@/components/layout/Header";
import { FilterBar } from "@/components/freebies/FilterBar";
import { FreebieList } from "@/components/freebies/FreebieList";
import { CommunitySection } from "@/components/community/CommunitySection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <FilterBar />
      <FreebieList />
      <CommunitySection />
    </div>
  );
}
