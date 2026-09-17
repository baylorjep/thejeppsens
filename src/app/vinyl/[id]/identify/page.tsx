import Header from "@/components/Header";
import VinylPressingForm from "@/components/VinylPressingForm";
export const metadata = { title: "Identify a pressing · Isabel’s vinyl" };
export default async function IdentifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="min-h-screen bg-white"><Header /><section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16"><VinylPressingForm id={id} /></section></main>;
}
