interface Props {
  onRetry: () => void;
}

// Shown when the backend is completely unreachable (network error / server down)
export default function NetworkError({ onRetry }: Props) {
  return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">🔌</p>
      <p className="text-gray-700 font-semibold text-lg">Could not connect to server</p>
      <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
        Make sure the backend is running on port 5000, then try again.
      </p>
      <button
        onClick={onRetry}
        className="btn-primary mt-5"
      >
        Try Again
      </button>
    </div>
  );
}
