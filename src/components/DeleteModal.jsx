export default function DeleteModal({ tabName, message, onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#0d1526] border border-blue-900/30 rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-red-400 text-lg">⚠</span>
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Delete "{tabName}"?</h2>
        <p className="text-blue-300/50 text-sm mb-6 leading-relaxed">
          {message ?? 'This will be permanently deleted.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#131f35] border border-blue-900/30 text-blue-300 rounded-xl font-bold text-sm tracking-wide active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm tracking-wide active:scale-95 transition-all shadow-lg shadow-red-600/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
