import { useState } from "react";
import ExperienceHeader from "../../components/ExperienceHeader";
import BusinessDetails from "../../components/BusinessDetails";
import FeedbackForm from "../../components/FeedbackForm";

const Product = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="w-full p-4">
      <div className="sm:w-[370px] mx-auto">
        <ExperienceHeader variant={submitted ? "thanks" : "intro"} />
        <BusinessDetails
          key={submitted ? "thanks" : "intro"}
          variant="product"
          logo="media/vendor/starbucks.svg"
          name="StarBucks"
          productImage="media/product/1.svg"
          productName="Hazelnut Oat"
        />
        <FeedbackForm
          onSubmitted={() => {
            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </div>
  );
};

export default Product;
