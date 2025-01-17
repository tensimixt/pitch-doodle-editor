import PitchEditor from "@/components/PitchEditor";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Pitch Editor</h1>
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg p-4">
        <PitchEditor width={800} height={400} />
      </div>
    </div>
  );
};

export default Index;