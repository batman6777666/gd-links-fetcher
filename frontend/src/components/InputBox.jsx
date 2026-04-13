function InputBox({ value, onChange, disabled }) {
  return (
    <div className="w-full">
      <label 
        htmlFor="links-input" 
        className="block text-sm font-medium text-gray-400 mb-2"
      >
        Paste driveseed.org links (one per line)
      </label>
      <textarea
        id="links-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="https://driveseed.org/file/abc123&#10;https://driveseed.org/file/xyz456&#10;..."
        className="w-full h-64 bg-gray-900 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <p className="mt-2 text-xs text-gray-500">
        Enter each driveseed.org link on a separate line. Supports batch processing of 500+ links.
      </p>
    </div>
  );
}

export default InputBox;
