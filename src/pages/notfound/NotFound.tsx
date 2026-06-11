const NotFound = () => {
  return (
    <div className="min-h-screen w-full p-4 flex items-center justify-center">
      <div className="sm:w-[370px] mx-auto text-center">
        <div className="bg-black text-white rounded-[35px] p-8 mb-6 animate-fade-in-up relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-success/20 blur-3xl"
          />

          <div className="relative">
            <div className="inline-flex items-center justify-center mb-6 animate-pop">
              <span className="text-[88px] leading-none font-bold tracking-tight bg-gradient-to-br from-white via-white to-brand bg-clip-text text-transparent">
                404
              </span>
            </div>
            <h1 className="text-[20px] leading-[1.2] font-bold mb-2">
              Page not found
            </h1>
            <p className="text-muted text-[14px] leading-[1.4]">
              The page you're looking for doesn't exist or may have been moved.
            </p>
          </div>
        </div>

        <p className="text-muted text-[12px] mt-5 animate-fade-in [animation-delay:240ms]">
          If you scanned a QR, try scanning it again.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
