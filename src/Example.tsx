import * as React from "react";
import { BarStack, BarGroup } from "@visx/shape";
import { SeriesPoint } from "@visx/shape/lib/types";
import { Group } from "@visx/group";
import { GridRows } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import cityTemperature, {
  CityTemperature
} from "@visx/mock-data/lib/mocks/cityTemperature";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import { timeParse, timeFormat } from "d3-time-format";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { LegendOrdinal, LegendLabel, LegendItem } from "@visx/legend";
import { localPoint } from "@visx/event";

type CityName = "New York" | "San Francisco" | "Austin";

type TooltipData = {
  bar: SeriesPoint<CityTemperature>;
  key: CityName;
  index: number;
  height: number;
  width: number;
  x: number;
  y: number;
  color: string;
};

// type TooltipData = {
//   bar: SeriesPoint<Forecast>;
//   key: Supplier;
//   index: number;
//   height: number;
//   width: number;
//   x: number;
//   y: number;
//   color: string;
// };

export type BarStackProps = {
  width: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  events?: boolean;
};


const green1 = "#0b2345";
// const green2 = "#135865";
// const green3 = "#3a956c";

const caltex_blue = '#0072BC';
const caltex_light_blue = '#52ADE6';

export const background = "#fff";
const legendGlyphSize = 10;
const defaultMargin = { top: 50, right: 40, bottom: 100, left: 100 };
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: "rgba(255,255,255,1)",
  color: "#414243",
  fontSize: 18
};

const data = cityTemperature.slice(0, 8);
const keys = Object.keys(data[0]).filter((d) => d !== "date") as CityName[];

const verticalTickAmount = 5;

const temperatureTotals = data.reduce((allTotals, currentDate) => {
  const totalTemperature = keys.reduce((dailyTotal, k) => {
    dailyTotal += Number(currentDate[k]);
    return dailyTotal;
  }, 0);
  allTotals.push(totalTemperature);
  return allTotals;
}, [] as number[]);

const parseDate = timeParse("%Y-%m-%d");
const format = timeFormat("%Y %b %d");
const formatDate = (date: string) => format(parseDate(date) as Date);

// accessors
const getDate = (d: CityTemperature) => d.date;

// scales
const dateScale = scaleBand<string>({
  domain: data.map(getDate),
  padding: 0.2
});
const temperatureScale = scaleLinear<number>({
  domain: [0, Math.max(...temperatureTotals)],
  nice: true
});
const colorScale = scaleOrdinal<CityName, string>({
  domain: keys,
  range: [green1, caltex_blue, caltex_light_blue]
});

const cityScale = scaleBand<string>({
  domain: keys,
  padding: 0.1,
});

let tooltipTimeout: number;

export default function Example({
  width,
  height = 300,
  events = false,
  margin = defaultMargin
}: BarStackProps) {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip
  } = useTooltip<TooltipData>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true
  });

  if (width < 50) return null;
  // bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  dateScale.rangeRound([0, xMax]);
  temperatureScale.range([yMax, 0]);
  cityScale.rangeRound([0, dateScale.bandwidth()]);

  return (
    // relative position is needed for correct tooltip positioning
    <div style={{ position: "relative" }}>
      <svg ref={containerRef} width={width} height={height}>
        <Group top={margin.top} left={margin.left}>
          <GridRows
            scale={temperatureScale}
            width={xMax}
            height={yMax}
            stroke="black"
            strokeOpacity={0.1}
            strokeDasharray="4,4"
            strokeWidth={2}
            numTicks={verticalTickAmount}
          />
          <AxisLeft
            scale={temperatureScale}
            hideTicks
            numTicks={verticalTickAmount}
            tickLabelProps={() => ({
              fill: "#aeaeae",
              fontWeight: 700,
              fontSize: 18,
              textAnchor: "middle",
              verticalAnchor: "middle"
            })}
            tickLength={30} // TODO: this is an ugly hack :)
            strokeWidth={2}
            stroke="#dcdcdc"
            labelOffset={40}
            label="Pipeline"
            labelProps={{
              fill: "#aeaeae",
              fontWeight: 700,
              fontSize: 14,
              textAnchor: "middle"
            }}
          />
          <AxisBottom
            top={yMax}
            scale={dateScale}
            tickFormat={formatDate}
            hideTicks
            tickLabelProps={() => ({
              fill: "#aeaeae",
              fontWeight: 700,
              fontSize: 12,
              textAnchor: "middle",
            })}
            strokeWidth={2}
            stroke="#dcdcdc"
          />
          <BarGroup<CityTemperature, CityName>
            data={data}
            keys={keys}
            height={yMax}
            x0={getDate}
            x0Scale={dateScale}
            x1Scale={cityScale}
            yScale={temperatureScale}
            color={colorScale}
          >
            {(barGroups) =>
              barGroups.map((barGroup) => (
                <Group key={`bar-group-${barGroup.index}-${barGroup.x0}`} left={barGroup.x0}>
                  {barGroup.bars.map((bar) => (
                    <rect
                      key={`bar-group-bar-${barGroup.index}-${bar.index}-${bar.value}-${bar.key}`}
                      x={bar.width + bar.index * bar.width/2}
                      y={bar.y}
                      width={8}
                      height={bar.height}
                      fill={bar.color}
                      rx={4}
                      onClick={() => {
                        if (events) alert(`clicked: ${JSON.stringify(barGroup)}`);
                        // if (!events) return;
                        // const { key, value } = bar;
                        // alert(`clicked: ${JSON.stringify({ key, value })}`);
                      }}
                      onMouseLeave={() => {
                        tooltipTimeout = window.setTimeout(() => {
                          hideTooltip();
                        }, 300);
                      }}
                      onMouseMove={(event) => {
                        if (tooltipTimeout) clearTimeout(tooltipTimeout);
                        // const eventSvgCoords = localPoint(event);
                        // const left = bar.x + bar.width / 2;
                        // const barData = barGroup.bars.find(it=> it.key===bar.key);
                        // if(barData){
                        //   showTooltip({
                        //     tooltipData: barData,
                        //     tooltipTop: eventSvgCoords?.y,
                        //     tooltipLeft: left
                        //   });
                        // }
                      }}
                    />
                  ))}
                </Group>
              ))
            }
          </BarGroup>
        </Group>

        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={temperatureScale}
            width={xMax}
            height={yMax}
            stroke="black"
            strokeOpacity={0.1}
            strokeDasharray="4,4"
            strokeWidth={2}
            numTicks={verticalTickAmount}
          />
          <AxisLeft
            scale={temperatureScale}
            hideTicks
            numTicks={verticalTickAmount}
            tickLabelProps={() => ({
              fill: "#aeaeae",
              fontWeight: 700,
              fontSize: 18,
              textAnchor: "middle",
              verticalAnchor: "middle"
            })}
            tickLength={30} // TODO: this is an ugly hack :)
            strokeWidth={2}
            stroke="#dcdcdc"
            labelOffset={40}
            label="Pipeline"
            labelProps={{
              fill: "#aeaeae",
              fontWeight: 700,
              fontSize: 14,
              textAnchor: "middle"
            }}
          />
          <AxisBottom
            top={yMax}
            scale={dateScale}
            tickFormat={formatDate}
            hideTicks
            tickLabelProps={() => ({
              fill: "#aeaeae",
              fontWeight: 700,
              fontSize: 12,
              textAnchor: "middle"
            })}
            strokeWidth={2}
            stroke="#dcdcdc"
          />
          <BarStack<CityTemperature, CityName>
            data={data}
            keys={keys}
            x={getDate}
            xScale={dateScale}
            yScale={temperatureScale}
            color={colorScale}
          >
            {(barStacks) =>
              barStacks.map((barStack) =>
                barStack.bars.map((bar) => (
                  <rect
                    rx={4}
                    key={`bar-stack-${barStack.index}-${bar.index}`}
                    x={bar.x + bar.width / 2 - 4}
                    y={bar.y}
                    height={bar.height}
                    width={8}
                    fill={bar.color}
                    onClick={() => {
                      if (events) alert(`clicked: ${JSON.stringify(bar)}`);
                    }}
                    onMouseLeave={() => {
                      tooltipTimeout = window.setTimeout(() => {
                        hideTooltip();
                      }, 300);
                    }}
                    onMouseMove={(event) => {
                      if (tooltipTimeout) clearTimeout(tooltipTimeout);
                      const eventSvgCoords = localPoint(event);
                      const left = bar.x + bar.width / 2;
                      showTooltip({
                        tooltipData: bar,
                        tooltipTop: eventSvgCoords?.y,
                        tooltipLeft: left
                      });
                    }}
                  />
                  // <path
                  //   d={`M${bar.x + bar.width / 1.5 / 4},${
                  //     bar.y + bar.height
                  //   } v-${bar.height} q0,-5 5,-5 h${
                  //     bar.width / 1.5
                  //   } q5,0 5,5 v${bar.height}`}
                  //   fill={bar.color}
                  //   onClick={() => {
                  //     if (events) alert(`clicked: ${JSON.stringify(bar)}`);
                  //   }}
                  //   onMouseLeave={() => {
                  //     tooltipTimeout = window.setTimeout(() => {
                  //       hideTooltip();
                  //     }, 300);
                  //   }}
                  //   onMouseMove={(event) => {
                  //     if (tooltipTimeout) clearTimeout(tooltipTimeout);
                  //     const top = event.clientY - margin.top;
                  //     const left = bar.x + bar.width / 2;
                  //     showTooltip({
                  //       tooltipData: bar,
                  //       tooltipTop: top,
                  //       tooltipLeft: left
                  //     });
                  //   }}
                  // />
                ))
              )
            }
          </BarStack>
        </Group>
      </svg>
      <div
        style={{
          position: "absolute",
          top: margin.top / 2 - 18,
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          fontSize: 14
        }}
      >
      {/* <div
        style={{
          position: "absolute",
          bottom: 40,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: "bold",
          color: "#414243",
          textTransform: "uppercase"
        }}
      > */}
        <LegendOrdinal scale={colorScale} direction="row">
          {(labels) =>
            labels.map((label, i) => (
              <LegendItem>
                <svg
                  width={legendGlyphSize}
                  height={legendGlyphSize}
                  style={{ margin: "0 2px 0 20px" }}
                >
                  <circle
                    fill={label.value}
                    r={legendGlyphSize / 2}
                    cx={legendGlyphSize / 2}
                    cy={legendGlyphSize / 2}
                  />
                </svg>
                <LegendLabel align="left" margin="0 8px">
                  {label.text}
                </LegendLabel>
              </LegendItem>
            ))
          }
        </LegendOrdinal>
      </div>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          key={Math.random()} // update tooltip bounds each render
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div>
            <strong style={{ color: tooltipData.color }}>
              {tooltipData.key}
            </strong>
          </div>
          <div>{tooltipData.bar.data[tooltipData.key]}</div>
          <div>
            <small>{formatDate(getDate(tooltipData.bar.data))}</small>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}
