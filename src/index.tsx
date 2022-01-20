import * as React from "react";
import { render } from "react-dom";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import Example from "./Example";
import "./sandbox-styles.css";

render(
  <ParentSize>
    {({ width, height }) => <Example width={width} height={height} events />}
  </ParentSize>,
  document.getElementById("root")
);
