export default function Header() {
  return (
    <div className="pt-safe bg-[#070b14] border-b border-blue-900/20">
      <div className="px-4 py-4">
        <h1
          className="text-2xl font-black tracking-widest text-white"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          RAMZ WORKOUT LOG
        </h1>
        <div className="mt-1 h-0.5 w-16 bg-blue-500 rounded-full" />
      </div>
    </div>
  )
}
