import React, { ReactNode } from "react";
import "./styles.css";

const NUMBER_OF_SLIDES = 4;

const Banner = ({
  components,
  duration = 28,
  direction = "left",
}: {
  components: { component: ReactNode }[];
  duration?: number;
  direction?: "right" | "left";
}) => {
  return (
    <div
      className={"slides-wrap flex overflow-hidden mb-4"}
      style={{ width: "100%" }}
    >
      {Array(NUMBER_OF_SLIDES)
        .fill(NUMBER_OF_SLIDES)
        .map((item, i) => (
          <section
            key={i}
            style={{
              animation: `swipe-${direction} ${duration}s linear infinite backwards`,
            }}
            className="px-[10px]"
          >
            {components.map(({ component }, i) => (
              <div
                // style={{ width: `${width}px` }}
                key={i}
              >
                {component}
              </div>
            ))}
          </section>
        ))}
    </div>
  );
};

export default Banner;
