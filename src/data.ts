export type Forecast = {
  date: Date;
  supplier1: number;
  supplier2: number;
  supplier3: number;
  supplier4: number;
};

const random = (max: number) => Math.round(Math.random() * max);
const startDate = new Date().valueOf();
const DAY = 86_400_000;

export const data: Forecast[] = [];

export type Supplier = "supplier1" | "supplier2" | "supplier3" | "supplier4";

for (let d = 0; d < 28; d++) {
  data.push({
    date: new Date(startDate + DAY * d),
    supplier1: random(25),
    supplier2: random(25),
    supplier3: random(25),
    supplier4: random(25)
  });
}
