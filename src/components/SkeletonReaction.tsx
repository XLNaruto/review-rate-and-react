const shimmer =
  "bg-[linear-gradient(90deg,#ececec_25%,#f7f7f7_50%,#ececec_75%)] bg-[length:200%_100%] animate-shimmer";

const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`${shimmer} rounded ${className}`} />
);

const Circle = ({ size }: { size: number }) => (
  <div
    style={{ width: size, height: size }}
    className={`${shimmer} rounded-full`}
  />
);

const SkeletonReaction = () => {
  return (
    <div className="w-full p-4">
      <div className="sm:w-[370px] mx-auto">
        <div className={`${shimmer} rounded-[35px] h-[110px] mb-5 animate-fade-in-up`} />

        <div className="mb-5 flex flex-col items-center gap-2 animate-fade-in-up [animation-delay:80ms]">
          <Bar className="h-3 w-16" />
          <Circle size={90} />
          <Bar className="h-4 w-24 mt-1" />
          <Bar className="h-3 w-20" />
        </div>

        <div className="bg-surface rounded-[30px] p-5 mb-5 animate-fade-in-up [animation-delay:160ms]">
          <Bar className="h-5 w-40 mb-5" />
          <div className="flex items-start gap-[15px]">
            <Circle size={24} />
            <div className="flex-1 space-y-2">
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-11/12" />
              <Bar className="h-3 w-3/4" />
            </div>
          </div>
          <div className="w-full h-[1px] bg-divider my-5" />
          <div className="flex items-center gap-[15px]">
            <Circle size={24} />
            <Bar className="h-3 w-1/2" />
          </div>
        </div>

        <div className="flex justify-center items-center gap-[20px] mb-7 animate-fade-in-up [animation-delay:240ms]">
          <Circle size={30} />
          <Circle size={30} />
          <Circle size={30} />
          <Circle size={30} />
        </div>

        <div className="animate-fade-in-up [animation-delay:320ms]">
          <Bar className="h-4 w-56 mb-3.5" />
          <div className="border border-border-mute rounded-[10rem] p-5 flex justify-center items-center gap-[10px] mb-5">
            <Circle size={40} />
            <Circle size={40} />
            <Circle size={40} />
            <Circle size={40} />
            <Circle size={40} />
            <Circle size={40} />
          </div>

          <div className="mb-5">
            <Bar className="h-4 w-32 mb-2" />
            <Bar className="h-11 w-full rounded-full" />
          </div>
          <div className="mb-5">
            <Bar className="h-4 w-24 mb-2" />
            <Bar className="h-28 w-full rounded-2xl" />
          </div>
          <Bar className="h-14 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonReaction;
