import { useState } from "react";
import ExperienceHeader from "../../components/ExperienceHeader";
import BusinessDetails from "../../components/BusinessDetails";
import FeedbackForm from "../../components/FeedbackForm";

const Reaction = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="w-full p-4">
      <div className="sm:w-[370px] mx-auto">
        <ExperienceHeader variant={submitted ? "thanks" : "intro"} />
        <BusinessDetails
          variant="business"
          logo="media/vendor/starbucks.svg"
          name="StarBucks"
          location="ION Orchard"
          about="Starbucks is a global coffeehouse founded in 1971, known for premium coffee, cozy ambiance, and a wide range of beverages."
          website="www.starbucks.in"
        />
        <FeedbackForm onSubmitted={() => setSubmitted(true)} />
      </div>
    </div>
  );
};

export default Reaction;



// import ExperienceHeader from "../../components/ExperienceHeader";
// import BusinessDetails from "../../components/BusinessDetails";
// import FeedbackForm from "../../components/FeedbackForm";

// const Reaction = () => {
//   return (
//     <div className="w-full p-4">
//       <div className="sm:w-[370px] mx-auto">
//         <ExperienceHeader variant="intro" />
//         <BusinessDetails
//           variant="product"
//           logo="media/vendor/starbucks.svg"
//           name="StarBucks"
//           productImage="media/product/1.svg"
//           productName="Hazelnut Oat"
//         />
//         <FeedbackForm />
//       </div>
//     </div>
//   );
// };

// export default Reaction;
