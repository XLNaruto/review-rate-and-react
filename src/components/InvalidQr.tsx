const InvalidQr = () => {
  return (
    <div className="min-h-[85vh] w-full p-4 flex items-center justify-center">
      <div className="sm:w-[370px] mx-auto text-center">
        <div className="relative overflow-hidden rounded-[35px] p-8 mb-6 bg-gradient-to-br from-black via-[#1a1a1a] to-black text-white animate-fade-in-up">
          <div
            aria-hidden
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-16 w-60 h-60 rounded-full bg-purple-500/20 blur-3xl"
          />

          <div className="relative">
            <div className="mx-auto mb-6 w-[112px] h-[112px] rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center animate-pop">
              <div className="relative w-[72px] h-[72px]">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1.5 opacity-60">
                  <div className="bg-white/80 rounded-[3px]" />
                  <div className="bg-white/30 rounded-[3px]" />
                  <div className="bg-white/80 rounded-[3px]" />
                  <div className="bg-white/30 rounded-[3px]" />
                  <div className="bg-white/20 rounded-[3px]" />
                  <div className="bg-white/30 rounded-[3px]" />
                  <div className="bg-white/80 rounded-[3px]" />
                  <div className="bg-white/30 rounded-[3px]" />
                  <div className="bg-white/80 rounded-[3px]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-red-500 shadow-[0_0_24px_rgba(239,68,68,0.6)] flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-white"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-[22px] font-bold mb-2 tracking-tight">
              This QR isn't active
            </h1>
            <p className="text-white/70 text-[14px] leading-relaxed max-w-[280px] mx-auto">
              The code may be invalid, expired, or no longer in use by the business.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="group w-full rounded-full bg-black py-5 text-sm font-medium text-white transition-all duration-300 hover:bg-brand active:scale-[0.98] animate-fade-in-up [animation-delay:120ms]"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 transition-transform duration-500 group-hover:rotate-[360deg]"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
            Try again
          </span>
        </button>

        <p className="text-muted text-[12px] mt-5 animate-fade-in [animation-delay:240ms]">
          Please rescan the QR code or contact the business if the issue continues.
        </p>
      </div>
    </div>
  );
};

export default InvalidQr;
