import { useState } from "react";
import ExperienceHeader from "../../components/ExperienceHeader";
import SurveyForm from "../../components/SurveyForm";
import SmartImage from "../../components/SmartImage";
import { toAbsoluteUrl } from "../../utils/Assets";

const Survey = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="w-full p-4">
      <div className="sm:w-[370px] mx-auto">
        <ExperienceHeader variant={submitted ? "thanks" : "intro"} />

        <div className="mb-5 animate-fade-in-up [animation-delay:80ms]">
          <h5 className="text-center text-placeholder text-[14px] mb-2">
            Business
          </h5>
          <SmartImage
            wrapperClassName="block mx-auto w-[90px] h-[90px] rounded-full"
            className="w-full h-full object-cover rounded-full"
            src={toAbsoluteUrl("media/vendor/starbucks.svg")}
            alt="StarBucks"
          />
          <h1 className="text-[20px] font-bold text-center mt-2">StarBucks</h1>
        </div>

        <div className="survey-card mb-5 animate-fade-in-up [animation-delay:160ms]">
          <h1 className="font-bold text-[18px] mb-4">Survey</h1>
          <div className="flex items-center gap-3">
            <SmartImage
              wrapperClassName="block w-[24px] h-[24px] shrink-0"
              className="w-full h-full"
              src={toAbsoluteUrl("media/icons/filter-mail-edit.svg")}
              alt="survey"
            />
            <p className="text-[14px]">Starbuck Survey</p>
          </div>
        </div>

        <SurveyForm
          onSubmitted={() => {
            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </div>
  );
};

export default Survey;
