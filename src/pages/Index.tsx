import PitchEditor from "@/components/PitchEditor";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-4">Pitch Editor</h1>
        <p className="text-gray-400 mb-6">Click to add control points (max 10). Drag points to adjust the curve.</p>
        <div className="bg-gray-800 rounded-lg p-4">
          <PitchEditor width={800} height={400} />
        </div>
      </div>
    </div>
  );
};

export default Index;